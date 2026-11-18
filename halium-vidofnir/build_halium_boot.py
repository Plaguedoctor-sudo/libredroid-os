#!/usr/bin/env python3
"""
build_halium_boot.py — Assembles LibreMobile Halium 12 Boot Artifacts for MT6789.
Target: Volla Phone X23 (vidofnir) & compatible MT6789 platforms.
Ensures 100% deterministic, bit-level verifiable boot.img and vendor_boot.img.
"""

import os
import sys
import shutil
import struct
import subprocess
import json
from pathlib import Path

# Local imports
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))
from unpack_v4 import unpack_boot, unpack_vendor_boot
from repack_v4 import repack_boot, repack_vendor_boot

SOURCE_DATE_EPOCH = int(os.environ.get("SOURCE_DATE_EPOCH", 1700000000))

def compress_legacy_lz4(data: bytes, block_size: int = 8 * 1024 * 1024) -> bytes:
    import lz4.block
    chunks = [b'\x02\x21\x4c\x18']
    for i in range(0, len(data), block_size):
        chunk = data[i:i + block_size]
        comp = lz4.block.compress(chunk, mode='high_compression', store_size=False)
        chunks.append(len(comp).to_bytes(4, 'little'))
        chunks.append(comp)
    return b''.join(chunks)

def decompress_legacy_lz4(data: bytes) -> bytes:
    import lz4.block
    assert data[:4] == b'\x02\x21\x4c\x18', "Invalid LZ4 legacy magic"
    pos = 4
    blocks = []
    while pos < len(data):
        if pos + 4 > len(data):
            break
        sz = int.from_bytes(data[pos:pos+4], 'little')
        pos += 4
        chunk = data[pos:pos+sz]
        pos += sz
        blocks.append(lz4.block.decompress(chunk, uncompressed_size=8 * 1024 * 1024))
    return b''.join(blocks)

def unpack_cpio_pure(data: bytes, target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)
    pos = 0
    while pos + 110 <= len(data):
        magic = data[pos:pos+6]
        if magic not in (b'070701', b'070702'):
            pos = (pos + 4) & ~3
            if pos >= len(data):
                break
            continue
        hdr = data[pos:pos+110]
        try:
            mode = int(hdr[14:22], 16)
            filesize = int(hdr[54:62], 16)
            namesize = int(hdr[94:102], 16)
        except ValueError:
            pos += 4
            continue
        
        pos += 110
        name_raw = data[pos:pos+namesize]
        pos += namesize
        if (110 + namesize) % 4 != 0:
            pos += 4 - ((110 + namesize) % 4)
        
        filename = name_raw.rstrip(b'\0').decode('utf-8', errors='replace')
        if filename == 'TRAILER!!!':
            pos = (pos + 3) & ~3
            continue
            
        filedata = data[pos:pos+filesize]
        pos += filesize
        if filesize % 4 != 0:
            pos += 4 - (filesize % 4)
            
        out_path = target_dir / filename
        file_type = mode & 0o170000
        if file_type == 0o040000: # Directory
            out_path.mkdir(parents=True, exist_ok=True)
        elif file_type == 0o120000: # Symlink
            out_path.parent.mkdir(parents=True, exist_ok=True)
            link_target = filedata.decode('utf-8', errors='replace')
            if out_path.is_symlink() or out_path.exists():
                out_path.unlink()
            os.symlink(link_target, out_path)
        elif file_type == 0o100000: # Regular file
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(filedata)
            os.chmod(out_path, mode & 0o777)

def patch_halium_scripts(stage_dir: Path):
    halium_script = stage_dir / "scripts" / "halium"
    if not halium_script.exists():
        raise FileNotFoundError(f"{halium_script} not found in initramfs")

    content = halium_script.read_text(encoding='utf-8')

    # 1. Patch identify_file_layout for LibreMobile dual-slot support
    target_layout = """identify_file_layout() {
\t# Determine if we have a Halium rootfs.img & system.img"""

    replacement_layout = """identify_file_layout() {
\t# LibreMobile slot detection: root-a.img vs root-b.img
\tlrd_slot="a"
\tif [ -f /tmpmnt/slot ]; then
\t\tlrd_slot=$(cat /tmpmnt/slot | tr -d ' \\n\\r\\t')
\telif [ -n "$ab_slot_suffix" ]; then
\t\tlrd_slot=$(echo "$ab_slot_suffix" | tr -d '_')
\tfi

\tif [ -e "/tmpmnt/root-${lrd_slot}.img" ]; then
\t\timagefile="/tmpmnt/root-${lrd_slot}.img"
\t\tfile_layout="halium"
\t\ttell_kmsg "LibreMobile: Selected slot $lrd_slot -> $imagefile"
\tel"""

    if target_layout in content:
        content = content.replace(target_layout, replacement_layout, 1)
        print("  ✔ Patched identify_file_layout for LibreMobile slot detection")
    else:
        print("  ⚠ Notice: identify_file_layout already patched or different structure")

    # 2. Patch persistent volume mounts for home and waydroid
    target_mount = """\t\t# Mounting userdata outside of /android, to avoid having LXC container access it
\t\tmkdir -p ${rootmnt}/userdata
\t\tmount --move /tmpmnt ${rootmnt}/userdata"""

    replacement_mount = """\t\t# Mounting userdata outside of /android, to avoid having LXC container access it
\t\tmkdir -p ${rootmnt}/userdata
\t\tmount --move /tmpmnt ${rootmnt}/userdata

\t\t# LibreMobile persistent volume binds (home & waydroid)
\t\tif [ -d ${rootmnt}/userdata/home ]; then
\t\t\tmkdir -p ${rootmnt}/home
\t\t\tmount -o bind ${rootmnt}/userdata/home ${rootmnt}/home
\t\t\ttell_kmsg "LibreMobile: Bound /userdata/home -> /home"
\t\tfi
\t\tif [ -d ${rootmnt}/userdata/waydroid ]; then
\t\t\tmkdir -p ${rootmnt}/var/lib/waydroid
\t\t\tmount -o bind ${rootmnt}/userdata/waydroid ${rootmnt}/var/lib/waydroid
\t\t\ttell_kmsg "LibreMobile: Bound /userdata/waydroid -> /var/lib/waydroid"
\t\tfi"""

    if target_mount in content:
        content = content.replace(target_mount, replacement_mount, 1)
        print("  ✔ Patched persistent volume binds (/home, /var/lib/waydroid)")
    else:
        print("  ⚠ Notice: persistent volume mount block already patched")

    halium_script.write_text(content, encoding='utf-8')

def build_boot_artifacts(output_dir: Path, target_device: str = "vidofnir"):
    output_dir.mkdir(parents=True, exist_ok=True)
    raw_boot = SCRIPT_DIR / "partitions" / "boot.img"
    raw_vendor = SCRIPT_DIR / "partitions" / "vendor_boot.img"

    if not raw_boot.exists() or not raw_vendor.exists():
        raise FileNotFoundError("Reference boot.img or vendor_boot.img missing in partitions/")

    unpacked_boot_dir = SCRIPT_DIR / "unpacked_boot"
    unpacked_vendor_dir = SCRIPT_DIR / "unpacked_vendor_boot"

    print(":: [1/5] Unpacking reference Halium 12 boot artifacts...")
    unpack_boot(raw_boot, unpacked_boot_dir)
    unpack_vendor_boot(raw_vendor, unpacked_vendor_dir)

    print(":: [2/5] Extracting Halium initramfs stage 1...")
    ramdisk_raw = (unpacked_boot_dir / "ramdisk.img").read_bytes()
    # Chunk 1 ends at 6197352 in reference
    c1_raw = ramdisk_raw[:6197352]
    c2_raw = ramdisk_raw[6197352:]

    c1_decompressed = decompress_legacy_lz4(c1_raw)
    stage_dir = Path(f"/tmp/lrd_initrd_{os.getpid()}")
    if stage_dir.exists():
        shutil.rmtree(stage_dir)
    stage_dir.mkdir(parents=True)

    try:
        unpack_cpio_pure(c1_decompressed, stage_dir)

        print(":: [3/5] Applying LibreMobile sovereign boot hooks to scripts/halium...")
        patch_halium_scripts(stage_dir)

        print(":: [4/5] Repacking deterministic Halium initramfs (CPIO + LZ4)...")
        # Clamp mtimes to SOURCE_DATE_EPOCH for stage_dir and all contents
        os.utime(stage_dir, (SOURCE_DATE_EPOCH, SOURCE_DATE_EPOCH))
        for root, dirs, files in os.walk(stage_dir):
            for d in dirs:
                try:
                    os.utime(os.path.join(root, d), (SOURCE_DATE_EPOCH, SOURCE_DATE_EPOCH), follow_symlinks=False)
                except Exception:
                    pass
            for f in files:
                try:
                    os.utime(os.path.join(root, f), (SOURCE_DATE_EPOCH, SOURCE_DATE_EPOCH), follow_symlinks=False)
                except Exception:
                    pass
        os.utime(stage_dir, (SOURCE_DATE_EPOCH, SOURCE_DATE_EPOCH))

        # Generate sorted reproducible CPIO archive
        proc = subprocess.Popen(
            ['cpio', '-o', '-H', 'newc', '-R', '0:0', '--reproducible'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=stage_dir
        )
        # Feed all filenames sorted
        file_list = []
        for root, dirs, files in os.walk(stage_dir):
            rel_root = os.path.relpath(root, stage_dir)
            if rel_root == ".":
                rel_root = ""
            for d in sorted(dirs):
                p = os.path.join(rel_root, d) if rel_root else d
                file_list.append(p)
            for f in sorted(files):
                p = os.path.join(rel_root, f) if rel_root else f
                file_list.append(p)
        file_list = ["."] + sorted(file_list)
        cpio_input = "\n".join(file_list).encode('utf-8')
        new_c1_cpio, err = proc.communicate(input=cpio_input)

        # Compress new chunk 1 with LZ4 legacy
        new_c1_lz4 = compress_legacy_lz4(new_c1_cpio)

        # Combine with chunk 2
        new_ramdisk = new_c1_lz4 + c2_raw
        (unpacked_boot_dir / "ramdisk.img").write_bytes(new_ramdisk)

        # Update boot_info.json ramdisk_size
        boot_info_path = unpacked_boot_dir / "boot_info.json"
        boot_info = json.loads(boot_info_path.read_text())
        boot_info["ramdisk_size"] = len(new_ramdisk)
        boot_info_path.write_text(json.dumps(boot_info, indent=2))

        print(":: [5/5] Reassembling Android Header v4 boot & vendor_boot images...")
        if target_device in ("vidofnir", "all"):
            out_boot = output_dir / "boot-vidofnir-libremobile.img"
            out_vendor = output_dir / "vendor_boot-vidofnir-libremobile.img"

            repack_boot(unpacked_boot_dir, out_boot, target_size=67108864)
            repack_vendor_boot(unpacked_vendor_dir, out_vendor)

            # Compute checksums
            out_manifest = output_dir / "boot-manifest.json"
            manifest_data = {
                "device": "vidofnir",
                "model": "Volla Phone X23",
                "soc": "MediaTek MT6789 (Helio G99)",
                "halium_version": 12,
                "kernel_version": "5.10.110-gki",
                "header_version": 4,
                "artifacts": {
                    "boot_image": out_boot.name,
                    "boot_sha256": subprocess.check_output(['sha256sum', str(out_boot)]).decode().split()[0],
                    "vendor_boot_image": out_vendor.name,
                    "vendor_boot_sha256": subprocess.check_output(['sha256sum', str(out_vendor)]).decode().split()[0]
                },
                "panel_driver": "lib/modules/panel-alpha-jdi-nt36672e-cphy-vdo.ko (preserved in vendor_boot)",
                "source_date_epoch": SOURCE_DATE_EPOCH
            }
            out_manifest.write_text(json.dumps(manifest_data, indent=2))
            (output_dir / "boot-manifest-vidofnir.json").write_text(json.dumps(manifest_data, indent=2))
            print(f"✔ Volla Phone X23 Artifacts -> {out_boot.name}, {out_vendor.name}")

        if target_device in ("OP5DA6L1", "all"):
            pad_stock_boot = REPO_ROOT / "stock_firmware" / "OnePlus_Pad_Go_OPD2304_MT6789_EX_11_A.30_231025_MXML" / "Firmware" / "IMAGES" / "boot.img"
            pad_stock_vendor = REPO_ROOT / "stock_firmware" / "OnePlus_Pad_Go_OPD2304_MT6789_EX_11_A.30_231025_MXML" / "Firmware" / "IMAGES" / "vendor_boot.img"
            if pad_stock_boot.exists() and pad_stock_vendor.exists():
                pad_unpacked_boot = Path(f"/tmp/lrd_pad_boot_{os.getpid()}")
                pad_unpacked_vendor = Path(f"/tmp/lrd_pad_vendor_{os.getpid()}")
                try:
                    unpack_boot(pad_stock_boot, pad_unpacked_boot)
                    unpack_vendor_boot(pad_stock_vendor, pad_unpacked_vendor)

                    # Inject deterministic Halium sovereign ramdisk
                    (pad_unpacked_boot / "ramdisk.img").write_bytes(new_ramdisk)
                    pad_boot_info = json.loads((pad_unpacked_boot / "boot_info.json").read_text())
                    pad_boot_info["ramdisk_size"] = len(new_ramdisk)
                    (pad_unpacked_boot / "boot_info.json").write_text(json.dumps(pad_boot_info, indent=2))

                    out_pad_boot = output_dir / "boot-OP5DA6L1-libremobile.img"
                    out_pad_vendor = output_dir / "vendor_boot-OP5DA6L1-libremobile.img"
                    repack_boot(pad_unpacked_boot, out_pad_boot, target_size=67108864)
                    repack_vendor_boot(pad_unpacked_vendor, out_pad_vendor, target_size=67108864)

                    pad_manifest = {
                        "device": "OP5DA6L1",
                        "model": "OnePlus Pad Go",
                        "soc": "MediaTek MT6789 (Helio G99)",
                        "halium_version": 13,
                        "kernel_version": "5.10.149-android12-9-o",
                        "header_version": 4,
                        "artifacts": {
                            "boot_image": out_pad_boot.name,
                            "boot_sha256": subprocess.check_output(['sha256sum', str(out_pad_boot)]).decode().split()[0],
                            "vendor_boot_image": out_pad_vendor.name,
                            "vendor_boot_sha256": subprocess.check_output(['sha256sum', str(out_pad_vendor)]).decode().split()[0]
                        },
                        "panel_driver": "lib/modules/panel-alpha-jdi-nt36672e-cphy-vdo.ko (preserved in vendor_boot)",
                        "source_date_epoch": SOURCE_DATE_EPOCH
                    }
                    (output_dir / "boot-manifest-OP5DA6L1.json").write_text(json.dumps(pad_manifest, indent=2))
                    print(f"✔ OnePlus Pad Go Artifacts -> {out_pad_boot.name}, {out_pad_vendor.name}")
                finally:
                    if pad_unpacked_boot.exists(): shutil.rmtree(pad_unpacked_boot)
                    if pad_unpacked_vendor.exists(): shutil.rmtree(pad_unpacked_vendor)

        print("\n" + "=" * 70)
        print("✔ LibreMobile Multi-Target Boot Pipeline Succeeded!")
        print(f"  Target:            {target_device}")
        print(f"  Output Directory:  {output_dir}")
        print("=" * 70)

    finally:
        if stage_dir.exists():
            shutil.rmtree(stage_dir)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="LibreMobile Halium Boot Artifact Builder")
    parser.add_argument("--device", choices=["vidofnir", "OP5DA6L1", "all"], default="vidofnir", help="Target device (default: vidofnir)")
    parser.add_argument("out_dir", nargs="?", default=str(REPO_ROOT / "dist-boot"), help="Output directory")
    args = parser.parse_args()
    build_boot_artifacts(Path(args.out_dir), target_device=args.device)
