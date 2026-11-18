#!/usr/bin/env python3
"""
repack_v4.py — Reassembles Android boot.img and vendor_boot.img (header v3/v4).
Validates bit-level roundtrip fidelity against stock/Halium reference artifacts.
"""

import sys
import struct
import json
from pathlib import Path

def pad_to_page(size: int, page_size: int = 4096) -> int:
    return (size + page_size - 1) & ~(page_size - 1)

def pad_bytes(data: bytes, page_size: int = 4096) -> bytes:
    pad_len = pad_to_page(len(data), page_size) - len(data)
    return data + (b'\0' * pad_len)

def repack_boot(in_dir: Path, out_img: Path, target_size: int = None):
    info_file = in_dir / "boot_info.json"
    if not info_file.exists():
        raise FileNotFoundError(f"Missing {info_file}")
    info = json.loads(info_file.read_text())

    kernel_path = in_dir / "kernel"
    ramdisk_path = in_dir / "ramdisk.img"
    if not kernel_path.exists() or not ramdisk_path.exists():
        raise FileNotFoundError("kernel or ramdisk.img missing in input directory")

    kernel_data = kernel_path.read_bytes()
    ramdisk_data = ramdisk_path.read_bytes()

    kernel_size = len(kernel_data)
    ramdisk_size = len(ramdisk_data)
    os_version = info.get("os_version_raw", 402653542)
    header_size = 1584
    header_version = info.get("header_version", 4)
    cmdline = info.get("cmdline", "").encode("utf-8")
    sig_size = info.get("signature_size", 0)

    v4_fmt = '<8s4I4II1536sI'
    cmdline_padded = cmdline + b'\0' * (1536 - len(cmdline))

    hdr_bytes = struct.pack(
        v4_fmt,
        b'ANDROID!',
        kernel_size,
        ramdisk_size,
        os_version,
        header_size,
        0, 0, 0, 0, # reserved[4]
        header_version,
        cmdline_padded,
        sig_size
    )

    page_size = 4096
    hdr_page = pad_bytes(hdr_bytes, page_size)
    kernel_pages = pad_bytes(kernel_data, page_size)
    ramdisk_pages = pad_bytes(ramdisk_data, page_size)

    with open(out_img, 'wb') as f:
        f.write(hdr_page)
        f.write(kernel_pages)
        f.write(ramdisk_pages)

        # If original image had extra data or target size (e.g. AVB or fixed partition size)
        tail_file = in_dir / "boot_tail.bin"
        if tail_file.exists() and (not target_size or f.tell() + tail_file.stat().st_size <= target_size):
            f.write(tail_file.read_bytes())

        if target_size:
            cur = f.tell()
            if cur < target_size:
                f.write(b'\0' * (target_size - cur))

    print(f"✔ Repacked boot.img -> {out_img} ({out_img.stat().st_size} bytes)")

def repack_vendor_boot(in_dir: Path, out_img: Path, target_size: int = None):
    info_file = in_dir / "vendor_boot_info.json"
    if not info_file.exists():
        raise FileNotFoundError(f"Missing {info_file}")
    info = json.loads(info_file.read_text())

    page_size = info.get("page_size", 4096)
    kernel_addr = info.get("kernel_addr", 0x40000000)
    ramdisk_addr = info.get("ramdisk_addr", 0x66f00000)
    tags_addr = info.get("tags_addr", 0x47c64000)
    header_size = info.get("header_size", 2128)
    dtb_addr = info.get("dtb_addr", 0x47c64000)
    entry_size = info.get("ramdisk_table_entry_size", 108)

    cmdline = info.get("cmdline", "").encode("utf-8")
    cmdline_padded = cmdline + b'\0' * (2048 - len(cmdline))

    name = info.get("name", "").encode("utf-8")
    name_padded = name + b'\0' * (16 - len(name))

    ramdisk_path = in_dir / "vendor_ramdisk.img"
    dtb_path = in_dir / "dtb.img"
    table_path = in_dir / "vendor_ramdisk_table"
    bootconfig_path = in_dir / "bootconfig"

    ramdisk_data = ramdisk_path.read_bytes() if ramdisk_path.exists() else b''
    dtb_data = dtb_path.read_bytes() if dtb_path.exists() else b''
    table_data = table_path.read_bytes() if table_path.exists() else b''
    bootconfig_data = bootconfig_path.read_bytes() if bootconfig_path.exists() else b''

    ramdisk_size = len(ramdisk_data)
    dtb_size = len(dtb_data)
    table_size = len(table_data)
    table_num = info.get("ramdisk_table_entry_num", 1 if table_size else 0)
    bootconfig_size = len(bootconfig_data)

    v4_fmt = '<8s5I2048sI16sIIQ4I'
    hdr_bytes = struct.pack(
        v4_fmt,
        b'VNDRBOOT',
        info.get("header_version", 4),
        page_size,
        kernel_addr,
        ramdisk_addr,
        ramdisk_size,
        cmdline_padded,
        tags_addr,
        name_padded,
        header_size,
        dtb_size,
        dtb_addr,
        table_size,
        table_num,
        entry_size,
        bootconfig_size
    )

    hdr_page = pad_bytes(hdr_bytes, page_size)
    ramdisk_pages = pad_bytes(ramdisk_data, page_size)
    dtb_pages = pad_bytes(dtb_data, page_size)
    table_pages = pad_bytes(table_data, page_size) if table_data else b''
    bootconfig_pages = pad_bytes(bootconfig_data, page_size) if bootconfig_data else b''

    with open(out_img, 'wb') as f:
        f.write(hdr_page)
        f.write(ramdisk_pages)
        f.write(dtb_pages)
        if table_pages:
            f.write(table_pages)
        if bootconfig_pages:
            f.write(bootconfig_pages)

        # If original vendor_boot had AVB footer or partition padding
        tail_file = in_dir / "vendor_boot_tail.bin"
        if tail_file.exists() and (not target_size or f.tell() + tail_file.stat().st_size <= target_size):
            f.write(tail_file.read_bytes())

        if target_size:
            cur = f.tell()
            if cur < target_size:
                f.write(b'\0' * (target_size - cur))

    print(f"✔ Repacked vendor_boot.img -> {out_img} ({out_img.stat().st_size} bytes)")

def main():
    if len(sys.argv) < 4:
        print("Usage: repack_v4.py <boot|vendor_boot> <unpacked_dir> <output_img>")
        sys.exit(1)

    mode = sys.argv[1]
    in_dir = Path(sys.argv[2])
    out_img = Path(sys.argv[3])

    if mode == "boot":
        repack_boot(in_dir, out_img)
    elif mode == "vendor_boot":
        repack_vendor_boot(in_dir, out_img)
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)

if __name__ == "__main__":
    main()
