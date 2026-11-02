#!/usr/bin/env python3
"""
repack_boot.py — Unpacks stock Android boot.img, replaces the ramdisk with LibreDroid
Halium initramfs, appends the necessary kernel cmdline, and repacks boot_b.img.
Preserves header version, page size, memory offsets, and DTB exactly as the vendor bootloader expects.
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
UNPACK_TOOL = os.path.join(HERE, 'unpack_bootimg.py')
MKBOOT_TOOL = os.path.join(HERE, 'mkbootimg.py')
INITRAMFS_BUILDER = os.path.join(HERE, 'build_initramfs.sh')

DEFAULT_CMDLINE_FLAGS = "androidboot.selinux=permissive lrd.root=LABEL=LRDROOT lrd.level=hybrid console=tty0 vt.global_cursor_default=0"

def parse_args():
    parser = argparse.ArgumentParser(description='Repacks stock Android boot.img into LibreDroid boot_b.img')
    parser.add_argument('--stock_boot', required=True, help='Path to stock vendor boot.img')
    parser.add_argument('-o', '--output', required=True, help='Output path for boot_b.img')
    parser.add_argument('--kernel', help='Path to optional rebuilt kernel Image (defaults to stock kernel)')
    parser.add_argument('--ramdisk', help='Path to custom initramfs.cpio.gz (defaults to generated Halium initramfs)')
    parser.add_argument('--cmdline', help='Custom cmdline to replace or append')
    parser.add_argument('--append_cmdline', default=DEFAULT_CMDLINE_FLAGS, help='Flags to append to stock cmdline')
    return parser.parse_args()

def main():
    args = parse_args()

    if not os.path.exists(args.stock_boot):
        print(f"Error: stock boot image {args.stock_boot} not found", file=sys.stderr)
        sys.exit(1)

    workdir = tempfile.mkdtemp(prefix='lrd-boot-')
    try:
        print(f":: Unpacking stock boot image: {args.stock_boot}")
        unpack_cmd = [sys.executable, UNPACK_TOOL, '--boot_img', args.stock_boot, '--out', workdir]
        subprocess.check_call(unpack_cmd)

        # Read info.txt
        info = {}
        with open(os.path.join(workdir, 'info.txt')) as f:
            for line in f:
                if '=' in line:
                    k, v = line.strip().split('=', 1)
                    info[k] = v

        header_ver = int(info.get('header_version', '2'))
        page_size = int(info.get('page_size', '2048'))
        stock_cmdline = info.get('cmdline', '')

        # Determine kernel to use
        kernel_path = os.path.join(workdir, 'kernel')
        if args.kernel and os.path.exists(args.kernel):
            kernel_path = args.kernel
            print(f":: Using custom vendor kernel: {kernel_path}")
        else:
            print(f":: Preserving stock vendor kernel: {kernel_path}")

        # Determine ramdisk to use
        ramdisk_path = args.ramdisk
        if not ramdisk_path:
            init_out = os.path.join(workdir, 'initramfs')
            subprocess.check_call(['bash', INITRAMFS_BUILDER, init_out])
            ramdisk_path = os.path.join(init_out, 'initramfs.cpio.gz')
        print(f":: Using Halium initramfs: {ramdisk_path}")

        # Determine cmdline
        final_cmdline = args.cmdline if args.cmdline else f"{stock_cmdline} {args.append_cmdline}".strip()

        # Build repack command
        repack_cmd = [
            sys.executable, MKBOOT_TOOL,
            '--kernel', kernel_path,
            '--ramdisk', ramdisk_path,
            '--header_version', str(header_ver),
            '--page_size', str(page_size),
            '--cmdline', final_cmdline,
            '-o', args.output
        ]

        if 'kernel_addr' in info:
            repack_cmd.extend(['--kernel_offset', info['kernel_addr']])
        if 'ramdisk_addr' in info:
            repack_cmd.extend(['--ramdisk_offset', info['ramdisk_addr']])
        if 'second_addr' in info:
            repack_cmd.extend(['--second_offset', info['second_addr']])
        if 'tags_addr' in info:
            repack_cmd.extend(['--tags_offset', info['tags_addr']])

        dtb_path = os.path.join(workdir, 'dtb')
        if os.path.exists(dtb_path) and os.path.getsize(dtb_path) > 0:
            repack_cmd.extend(['--dtb', dtb_path])

        second_path = os.path.join(workdir, 'second')
        if os.path.exists(second_path) and os.path.getsize(second_path) > 0:
            repack_cmd.extend(['--second', second_path])

        dtbo_path = os.path.join(workdir, 'recovery_dtbo')
        if os.path.exists(dtbo_path) and os.path.getsize(dtbo_path) > 0:
            repack_cmd.extend(['--recovery_dtbo', dtbo_path])

        print(f":: Packing LibreDroid boot image: {args.output}")
        subprocess.check_call(repack_cmd)
        print(f"✔ Done. Ready for flashing: fastboot flash boot_b {args.output}")

    finally:
        shutil.rmtree(workdir, ignore_errors=True)

if __name__ == '__main__':
    main()
