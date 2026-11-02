#!/usr/bin/env python3
"""
mkbootimg.py — Packs kernel, ramdisk, and dtb into an Android boot image.
Supports boot image header versions 0, 1, 2, 3, and 4.
Pure Python, zero third-party dependencies.
"""

import argparse
import hashlib
import os
import struct
import sys

BOOT_MAGIC = b'ANDROID!'

def pad_to_page(size, page_size):
    return (size + page_size - 1) & ~(page_size - 1)

def write_padded(f, data, page_size):
    f.write(data)
    pad = pad_to_page(len(data), page_size) - len(data)
    if pad > 0:
        f.write(b'\0' * pad)

def parse_cmdline(args):
    parser = argparse.ArgumentParser(description='Packs Android boot images.')
    parser.add_argument('--kernel', required=True, help='path to the kernel image')
    parser.add_argument('--ramdisk', required=True, help='path to the ramdisk archive')
    parser.add_argument('--dtb', help='path to the device tree blob (DTB)')
    parser.add_argument('--second', help='path to the 2nd stage bootloader')
    parser.add_argument('--recovery_dtbo', help='path to recovery dtbo')
    parser.add_argument('--cmdline', default='', help='kernel command line')
    parser.add_argument('--base', default='0x10000000', help='base memory address')
    parser.add_argument('--kernel_offset', default='0x00008000', help='kernel offset')
    parser.add_argument('--ramdisk_offset', default='0x01000000', help='ramdisk offset')
    parser.add_argument('--second_offset', default='0x00f00000', help='second offset')
    parser.add_argument('--tags_offset', default='0x00000100', help='tags offset')
    parser.add_argument('--dtb_offset', default='0x01f00000', help='dtb offset')
    parser.add_argument('--os_version', type=int, default=0, help='OS version')
    parser.add_argument('--os_patch_level', type=int, default=0, help='OS patch level')
    parser.add_argument('--board', default='', help='board name')
    parser.add_argument('--page_size', type=int, default=2048, choices=[2048, 4096, 8192, 16384], help='page size in bytes')
    parser.add_argument('--header_version', type=int, default=2, choices=[0, 1, 2, 3, 4], help='boot image header version')
    parser.add_argument('-o', '--output', required=True, help='output boot.img path')
    return parser.parse_args(args)

def pack_v0_v1_v2(args, kernel, ramdisk, dtb, second, dtbo):
    base = int(args.base, 16)
    kernel_addr = base + int(args.kernel_offset, 16)
    ramdisk_addr = base + int(args.ramdisk_offset, 16)
    second_addr = base + int(args.second_offset, 16)
    tags_addr = base + int(args.tags_offset, 16)
    dtb_addr = base + int(args.dtb_offset, 16)

    os_ver_field = (args.os_version << 11) | (args.os_patch_level & 0x7FF)

    cmdline_bytes = args.cmdline.encode('utf-8')
    cmdline_main = cmdline_bytes[:512].ljust(512, b'\0')
    cmdline_extra = cmdline_bytes[512:1536].ljust(1024, b'\0')

    # Hash id: sha1 of kernel + ramdisk + second + recovery_dtbo + dtb
    sha = hashlib.sha1()
    sha.update(kernel)
    sha.update(ramdisk)
    sha.update(second)
    if args.header_version >= 1:
        sha.update(dtbo)
    if args.header_version >= 2:
        sha.update(dtb)
    id_sha = sha.digest().ljust(32, b'\0')

    board_bytes = args.board.encode('utf-8')[:16].ljust(16, b'\0')

    # header v0 (1632 bytes)
    hdr = struct.pack(
        '<8s10I16s512s32s1024s',
        BOOT_MAGIC,
        len(kernel),
        kernel_addr,
        len(ramdisk),
        ramdisk_addr,
        len(second),
        second_addr,
        tags_addr,
        args.page_size,
        args.header_version,
        os_ver_field,
        board_bytes,
        cmdline_main,
        id_sha,
        cmdline_extra,
    )

    if args.header_version >= 1:
        # recovery_dtbo_size, recovery_dtbo_offset (uint32, uint64) + header_size (uint32)
        recovery_dtbo_offset = 0
        if dtbo:
            # offset will be right after second stage
            recovery_dtbo_offset = args.page_size + pad_to_page(len(kernel), args.page_size) + pad_to_page(len(ramdisk), args.page_size) + pad_to_page(len(second), args.page_size)
        hdr += struct.pack('<IQI', len(dtbo), recovery_dtbo_offset, len(hdr) + 16)

    if args.header_version >= 2:
        hdr += struct.pack('<IQ', len(dtb), dtb_addr)

    with open(args.output, 'wb') as f:
        write_padded(f, hdr, args.page_size)
        write_padded(f, kernel, args.page_size)
        write_padded(f, ramdisk, args.page_size)
        if second:
            write_padded(f, second, args.page_size)
        if dtbo:
            write_padded(f, dtbo, args.page_size)
        if dtb:
            write_padded(f, dtb, args.page_size)

def pack_v3_v4(args, kernel, ramdisk):
    page_size = 4096
    os_ver_field = (args.os_version << 11) | (args.os_patch_level & 0x7FF)
    cmdline_bytes = args.cmdline.encode('utf-8')[:1536].ljust(1536, b'\0')

    # struct boot_img_hdr_v3
    header_size = 4096
    hdr = struct.pack(
        '<8s4I4II1536s',
        BOOT_MAGIC,
        len(kernel),
        len(ramdisk),
        os_ver_field,
        header_size,
        0, 0, 0, 0, # reserved
        args.header_version,
        cmdline_bytes
    )

    if args.header_version >= 4:
        hdr += struct.pack('<I', 0) # signature_size

    with open(args.output, 'wb') as f:
        write_padded(f, hdr, page_size)
        write_padded(f, kernel, page_size)
        write_padded(f, ramdisk, page_size)

def main():
    args = parse_cmdline(sys.argv[1:])

    with open(args.kernel, 'rb') as f:
        kernel = f.read()

    with open(args.ramdisk, 'rb') as f:
        ramdisk = f.read()

    dtb = b''
    if args.dtb and os.path.exists(args.dtb):
        with open(args.dtb, 'rb') as f:
            dtb = f.read()

    second = b''
    if args.second and os.path.exists(args.second):
        with open(args.second, 'rb') as f:
            second = f.read()

    dtbo = b''
    if args.recovery_dtbo and os.path.exists(args.recovery_dtbo):
        with open(args.recovery_dtbo, 'rb') as f:
            dtbo = f.read()

    if args.header_version >= 3:
        pack_v3_v4(args, kernel, ramdisk)
    else:
        pack_v0_v1_v2(args, kernel, ramdisk, dtb, second, dtbo)

    print(f":: Created Android boot image: {args.output}")
    print(f"   size: {os.path.getsize(args.output)} bytes")
    print(f"   header_version: {args.header_version}")
    print(f"   kernel size: {len(kernel)} bytes")
    print(f"   ramdisk size: {len(ramdisk)} bytes")
    if dtb:
        print(f"   dtb size: {len(dtb)} bytes")

if __name__ == '__main__':
    main()
