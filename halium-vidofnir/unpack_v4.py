#!/usr/bin/env python3
"""
unpack_v4.py — Unpacks Android boot.img and vendor_boot.img (header v3/v4).
"""

import os
import sys
import struct
import json
from pathlib import Path

def pad_to_page(size, page_size=4096):
    return (size + page_size - 1) & ~(page_size - 1)

def unpack_boot(img_path: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(img_path, 'rb') as f:
        header = f.read(4096)
        magic = header[:8]
        if magic != b'ANDROID!':
            raise ValueError(f"Not an ANDROID! boot image: {magic}")
        
        # v3/v4 header
        # uint8_t magic[8]; uint32_t kernel_size; uint32_t ramdisk_size;
        # uint32_t os_version; uint32_t header_size;
        # uint32_t reserved[4]; uint32_t header_version; uint8_t cmdline[1536];
        v4_fmt = '<8s4I4II1536sI'
        unpacked = struct.unpack(v4_fmt, header[:struct.calcsize(v4_fmt)])
        magic, kernel_size, ramdisk_size, os_version, header_size, r0, r1, r2, r3, header_version, cmdline, sig_size = unpacked
        
        cmdline_str = cmdline.split(b'\0', 1)[0].decode('utf-8', errors='replace')
        page_size = 4096
        
        info = {
            "type": "boot",
            "magic": magic.decode('ascii'),
            "header_version": header_version,
            "kernel_size": kernel_size,
            "ramdisk_size": ramdisk_size,
            "os_version": f"{os_version >> 11}.{(os_version >> 7) & 0xF}",
            "os_version_raw": os_version,
            "header_size": header_size,
            "cmdline": cmdline_str,
            "signature_size": sig_size,
        }
        
        (out_dir / "boot_info.json").write_text(json.dumps(info, indent=2))
        
        # Read kernel
        f.seek(page_size)
        kernel = f.read(kernel_size)
        (out_dir / "kernel").write_bytes(kernel)
        
        # Read ramdisk
        ramdisk_pos = page_size + pad_to_page(kernel_size, page_size)
        f.seek(ramdisk_pos)
        ramdisk = f.read(ramdisk_size)
        (out_dir / "ramdisk.img").write_bytes(ramdisk)
        
        # Read tail (AVB footer / padding if present)
        tail_pos = ramdisk_pos + pad_to_page(ramdisk_size, page_size)
        f.seek(tail_pos)
        tail = f.read()
        if tail:
            (out_dir / "boot_tail.bin").write_bytes(tail)
        
        print(f"✔ Unpacked boot.img (Header v{header_version}):")
        print(f"  Kernel:   {kernel_size} bytes -> {out_dir}/kernel")
        print(f"  Ramdisk:  {ramdisk_size} bytes -> {out_dir}/ramdisk.img")
        print(f"  Cmdline:  '{cmdline_str}'")

def unpack_vendor_boot(img_path: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(img_path, 'rb') as f:
        header = f.read(4096)
        magic = header[:8]
        if magic != b'VNDRBOOT':
            raise ValueError(f"Not a VNDRBOOT image: {magic}")
        
        # struct vendor_boot_img_hdr_v3 {
        #   uint8_t magic[8]; uint32_t header_version; uint32_t page_size;
        #   uint32_t kernel_addr; uint32_t ramdisk_addr; uint32_t vendor_ramdisk_size;
        #   uint8_t cmdline[2048]; uint32_t tags_addr; uint8_t name[16];
        #   uint32_t header_size; uint32_t dtb_size; uint64_t dtb_addr;
        # };
        # v4 adds:
        #   uint32_t vendor_ramdisk_table_size; uint32_t vendor_ramdisk_table_entry_num;
        #   uint32_t vendor_ramdisk_table_entry_size; uint32_t bootconfig_size;
        v4_fmt = '<8s5I2048sI16sIIQ4I'
        hdr_size = struct.calcsize(v4_fmt)
        unpacked = struct.unpack(v4_fmt, header[:hdr_size])
        
        magic, header_version, page_size, kernel_addr, ramdisk_addr, ramdisk_size, cmdline, tags_addr, name, header_size, dtb_size, dtb_addr, table_size, table_num, entry_size, bootconfig_size = unpacked
        
        cmdline_str = cmdline.split(b'\0', 1)[0].decode('utf-8', errors='replace')
        name_str = name.split(b'\0', 1)[0].decode('utf-8', errors='replace')
        
        info = {
            "type": "vendor_boot",
            "magic": magic.decode('ascii'),
            "header_version": header_version,
            "page_size": page_size,
            "kernel_addr": kernel_addr,
            "ramdisk_addr": ramdisk_addr,
            "vendor_ramdisk_size": ramdisk_size,
            "tags_addr": tags_addr,
            "header_size": header_size,
            "dtb_size": dtb_size,
            "dtb_addr": dtb_addr,
            "bootconfig_size": bootconfig_size,
            "cmdline": cmdline_str,
            "name": name_str,
            "ramdisk_table_size": table_size,
            "ramdisk_table_entry_num": table_num,
            "ramdisk_table_entry_size": entry_size,
        }
        (out_dir / "vendor_boot_info.json").write_text(json.dumps(info, indent=2))
        
        # Payload layout in v4:
        # header (1 page) | vendor ramdisk | dtb | vendor ramdisk table | bootconfig
        pos = page_size
        f.seek(pos)
        ramdisk = f.read(ramdisk_size)
        (out_dir / "vendor_ramdisk.img").write_bytes(ramdisk)
        pos += pad_to_page(ramdisk_size, page_size)
        
        dtb = b''
        if dtb_size:
            f.seek(pos)
            dtb = f.read(dtb_size)
            (out_dir / "dtb.img").write_bytes(dtb)
            pos += pad_to_page(dtb_size, page_size)
        
        table = b''
        if table_size:
            f.seek(pos)
            table = f.read(table_size)
            (out_dir / "vendor_ramdisk_table").write_bytes(table)
            pos += pad_to_page(table_size, page_size)
            
        bootconfig = b''
        if bootconfig_size:
            f.seek(pos)
            bootconfig = f.read(bootconfig_size)
            (out_dir / "bootconfig").write_bytes(bootconfig)
            pos += pad_to_page(bootconfig_size, page_size)
            
        # Read tail (AVB footer / partition padding if present)
        f.seek(pos)
        tail = f.read()
        if tail:
            (out_dir / "vendor_boot_tail.bin").write_bytes(tail)
            
        print(f"✔ Unpacked vendor_boot.img (Header v{header_version}):")
        print(f"  Vendor Ramdisk: {ramdisk_size} bytes -> {out_dir}/vendor_ramdisk.img")
        print(f"  DTB:            {dtb_size} bytes -> {out_dir}/dtb.img")
        print(f"  Bootconfig:     {bootconfig_size} bytes -> {out_dir}/bootconfig")
        print(f"  Cmdline:        '{cmdline_str}'")

def main():
    if len(sys.argv) < 3:
        print("Usage: unpack_v4.py <boot.img|vendor_boot.img> <out_dir>")
        sys.exit(1)
    
    img = Path(sys.argv[1])
    out = Path(sys.argv[2])
    with open(img, 'rb') as f:
        magic = f.read(8)
    if magic == b'ANDROID!':
        unpack_boot(img, out)
    elif magic == b'VNDRBOOT':
        unpack_vendor_boot(img, out)
    else:
        raise ValueError(f"Unknown image magic: {magic}")

if __name__ == '__main__':
    main()
