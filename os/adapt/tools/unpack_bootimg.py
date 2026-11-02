#!/usr/bin/env python3
"""
unpack_bootimg.py — Unpacks an Android boot image (header v0, v1, v2, v3, v4).
Pure Python implementation, zero third-party dependencies.
"""

import argparse
import os
import struct
import sys

BOOT_MAGIC = b'ANDROID!'
BOOT_MAGIC_SIZE = 8

def parse_cmdline(args):
    parser = argparse.ArgumentParser(description='Unpacks Android boot images.')
    parser.add_argument('--boot_img', required=True, help='path to the boot image')
    parser.add_argument('--out', default='out', help='output directory')
    parser.add_argument('--info', action='store_true', help='print header info only')
    return parser.parse_args(args)

def read_exact(f, size):
    buf = f.read(size)
    if len(buf) < size:
        raise ValueError(f"Unexpected EOF while reading {size} bytes")
    return buf

def c_str(bytes_in):
    return bytes_in.split(b'\0', 1)[0].decode('utf-8', errors='replace')

def pad_to_page(size, page_size):
    return (size + page_size - 1) & ~(page_size - 1)

def unpack_v0_v1_v2(f, header, out_dir):
    # struct boot_img_hdr_v0 {
    #   uint8_t magic[8]; uint32_t kernel_size; uint32_t kernel_addr;
    #   uint32_t ramdisk_size; uint32_t ramdisk_addr;
    #   uint32_t second_size; uint32_t second_addr;
    #   uint32_t tags_addr; uint32_t page_size;
    #   uint32_t header_version; uint32_t os_version;
    #   uint8_t name[16]; uint8_t cmdline[512];
    #   uint8_t id[32]; uint8_t extra_cmdline[1024];
    # };
    fmt = '<8s10I16s512s32s1024s'
    v0_size = struct.calcsize(fmt)
    unpacked = struct.unpack(fmt, header[:v0_size])
    magic, kernel_size, kernel_addr, ramdisk_size, ramdisk_addr, second_size, second_addr, tags_addr, page_size, header_version, os_version, name, cmdline, id_sha, extra_cmdline = unpacked

    recovery_dtbo_size = 0
    recovery_dtbo_offset = 0
    dtb_size = 0
    dtb_addr = 0

    if header_version >= 1:
        v1_fmt = '<8s10I16s512s32s1024sIQI'
        v1_size = struct.calcsize(v1_fmt)
        unpacked_v1 = struct.unpack(v1_fmt, header[:v1_size])
        recovery_dtbo_size = unpacked_v1[15]
        recovery_dtbo_offset = unpacked_v1[16]

    if header_version >= 2:
        v2_fmt = '<8s10I16s512s32s1024sIQIIQ'
        v2_size = struct.calcsize(v2_fmt)
        unpacked_v2 = struct.unpack(v2_fmt, header[:v2_size])
        dtb_size = unpacked_v2[18]
        dtb_addr = unpacked_v2[19]

    cmdline_str = (c_str(cmdline) + ' ' + c_str(extra_cmdline)).strip()

    info = {
        'header_version': header_version,
        'page_size': page_size,
        'kernel_size': kernel_size,
        'kernel_addr': f'0x{kernel_addr:08x}',
        'ramdisk_size': ramdisk_size,
        'ramdisk_addr': f'0x{ramdisk_addr:08x}',
        'second_size': second_size,
        'second_addr': f'0x{second_addr:08x}',
        'tags_addr': f'0x{tags_addr:08x}',
        'os_version': os_version >> 11,
        'os_patch_level': os_version & 0x7FF,
        'name': c_str(name),
        'cmdline': cmdline_str,
        'recovery_dtbo_size': recovery_dtbo_size,
        'dtb_size': dtb_size,
    }

    # Extract payloads
    # Layout: header (1 page) | kernel | ramdisk | second | recovery_dtbo | dtb
    pos = page_size
    f.seek(pos)
    kernel_data = read_exact(f, kernel_size) if kernel_size else b''
    pos += pad_to_page(kernel_size, page_size)

    f.seek(pos)
    ramdisk_data = read_exact(f, ramdisk_size) if ramdisk_size else b''
    pos += pad_to_page(ramdisk_size, page_size)

    second_data = b''
    if second_size:
        f.seek(pos)
        second_data = read_exact(f, second_size)
        pos += pad_to_page(second_size, page_size)

    recovery_dtbo_data = b''
    if recovery_dtbo_size:
        f.seek(recovery_dtbo_offset)
        recovery_dtbo_data = read_exact(f, recovery_dtbo_size)

    dtb_data = b''
    if dtb_size:
        f.seek(pos)
        dtb_data = read_exact(f, dtb_size)

    return info, kernel_data, ramdisk_data, dtb_data, second_data, recovery_dtbo_data

def unpack_v3_v4(f, header, out_dir):
    # struct boot_img_hdr_v3 {
    #   uint8_t magic[8]; uint32_t kernel_size; uint32_t ramdisk_size;
    #   uint32_t os_version; uint32_t header_size;
    #   uint32_t reserved[4]; uint32_t header_version; uint8_t cmdline[1536];
    # };
    fmt = '<8s4I4II1536s'
    v3_size = struct.calcsize(fmt)
    unpacked = struct.unpack(fmt, header[:v3_size])
    magic, kernel_size, ramdisk_size, os_version, header_size, r0, r1, r2, r3, header_version, cmdline = unpacked

    signature_size = 0
    if header_version >= 4:
        v4_fmt = '<8s4I4II1536sI'
        v4_size = struct.calcsize(v4_fmt)
        signature_size = struct.unpack(v4_fmt, header[:v4_size])[-1]

    page_size = 4096
    cmdline_str = c_str(cmdline)

    info = {
        'header_version': header_version,
        'page_size': page_size,
        'kernel_size': kernel_size,
        'ramdisk_size': ramdisk_size,
        'os_version': os_version >> 11,
        'os_patch_level': os_version & 0x7FF,
        'cmdline': cmdline_str,
        'signature_size': signature_size,
    }

    pos = page_size
    f.seek(pos)
    kernel_data = read_exact(f, kernel_size) if kernel_size else b''
    pos += pad_to_page(kernel_size, page_size)

    f.seek(pos)
    ramdisk_data = read_exact(f, ramdisk_size) if ramdisk_size else b''

    return info, kernel_data, ramdisk_data, b'', b'', b''

def unpack(boot_img_path, out_dir):
    with open(boot_img_path, 'rb') as f:
        header = f.read(4096)
        if len(header) < 16 or header[:8] != BOOT_MAGIC:
            raise ValueError(f"{boot_img_path} is not a valid Android boot image (magic mismatch)")

        # Peek version at offset 40 (for v0-v2) or 36 (for v3-v4)
        v3_candidate_ver = struct.unpack('<I', header[40:44])[0]
        v0_candidate_ver = struct.unpack('<I', header[40:44])[0]

        # In v3, header_version is at offset 40 (after magic(8) + 4 uint32(16) + 4 reserved uint32(16) = 40)
        # In v0, page_size is at offset 36, header_version is at offset 40!
        header_ver = v0_candidate_ver
        if header_ver >= 3:
            info, kernel, ramdisk, dtb, second, dtbo = unpack_v3_v4(f, header, out_dir)
        else:
            info, kernel, ramdisk, dtb, second, dtbo = unpack_v0_v1_v2(f, header, out_dir)

    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'kernel'), 'wb') as kf:
        kf.write(kernel)
    if ramdisk:
        with open(os.path.join(out_dir, 'ramdisk.cpio.gz'), 'wb') as rf:
            rf.write(ramdisk)
    if dtb:
        with open(os.path.join(out_dir, 'dtb'), 'wb') as df:
            df.write(dtb)
    if second:
        with open(os.path.join(out_dir, 'second'), 'wb') as sf:
            sf.write(second)
    if dtbo:
        with open(os.path.join(out_dir, 'recovery_dtbo'), 'wb') as of:
            of.write(dtbo)

    with open(os.path.join(out_dir, 'info.txt'), 'w') as infof:
        for k, v in info.items():
            infof.write(f'{k}={v}\n')

    return info

def main():
    args = parse_cmdline(sys.argv[1:])
    info = unpack(args.boot_img, args.out)
    if args.info:
        for k, v in info.items():
            print(f'{k}: {v}')
    else:
        print(f":: Boot image unpacked into {args.out}")
        print(f"   header_version: {info.get('header_version')}")
        print(f"   page_size: {info.get('page_size')}")
        print(f"   cmdline: {info.get('cmdline')}")

if __name__ == '__main__':
    main()
