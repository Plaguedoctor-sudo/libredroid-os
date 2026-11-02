#!/usr/bin/env python3
"""
simg2img.py — Converts an Android sparse image to a raw image.
Pure Python, zero external dependencies.
"""

import os
import struct
import sys

SPARSE_HEADER_MAGIC = 0xED26FF3A
CHUNK_TYPE_RAW = 0xCAC1
CHUNK_TYPE_FILL = 0xCAC2
CHUNK_TYPE_DONT_CARE = 0xCAC3
CHUNK_TYPE_CRC32 = 0xCAC4

def simg2img(src_path, dst_path):
    with open(src_path, 'rb') as src, open(dst_path, 'wb') as dst:
        header_bin = src.read(28)
        if len(header_bin) < 28:
            raise ValueError("File too short for sparse image header")

        magic, major, minor, file_hdr_sz, chunk_hdr_sz, blk_sz, total_blks, total_chunks, image_checksum = struct.unpack(
            '<I4H4I', header_bin
        )

        if magic != SPARSE_HEADER_MAGIC:
            raise ValueError(f"Magic 0x{magic:08x} does not match Android sparse magic 0x{SPARSE_HEADER_MAGIC:08x}")

        if file_hdr_sz > 28:
            src.read(file_hdr_sz - 28)

        total_bytes_written = 0
        for _ in range(total_chunks):
            chunk_bin = src.read(chunk_hdr_sz)
            chunk_type, reserved1, chunk_sz, total_sz = struct.unpack('<2H2I', chunk_bin[:12])
            data_sz = total_sz - chunk_hdr_sz

            if chunk_type == CHUNK_TYPE_RAW:
                expected_data_len = chunk_sz * blk_sz
                raw_data = src.read(expected_data_len)
                dst.write(raw_data)
                total_bytes_written += len(raw_data)
            elif chunk_type == CHUNK_TYPE_FILL:
                fill_val = src.read(4)
                fill_chunk = fill_val * (blk_sz // 4)
                for _ in range(chunk_sz):
                    dst.write(fill_chunk)
                total_bytes_written += chunk_sz * blk_sz
            elif chunk_type == CHUNK_TYPE_DONT_CARE:
                # Seek forward (creates sparse file on supported filesystems)
                dst.seek(chunk_sz * blk_sz, os.SEEK_CUR)
                total_bytes_written += chunk_sz * blk_sz
            elif chunk_type == CHUNK_TYPE_CRC32:
                src.read(4)
            else:
                raise ValueError(f"Unknown chunk type: 0x{chunk_type:04x}")

    print(f":: Converted sparse {src_path} -> raw {dst_path} ({os.path.getsize(dst_path)} bytes)")

def main():
    if len(sys.argv) < 3:
        print(f"usage: {sys.argv[0]} <sparse_image_file> <raw_image_file>")
        sys.exit(1)
    simg2img(sys.argv[1], sys.argv[2])

if __name__ == '__main__':
    main()
