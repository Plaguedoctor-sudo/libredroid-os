#!/usr/bin/env python3
"""Reconstruct a DTS from a /proc/device-tree dump (no root required)."""
import os, sys, struct

STRINGY = {'compatible','model','status','device_type','name','bootargs',
           'clock-names','reg-names','interrupt-names','label','gpio-names',
           'pinctrl-names','label','supply','vdd-supply','phandle-name'}
SKIP = {'name'}

def is_str(b):
    return b and b'\x00' not in b[:-1] and all(32 <= c < 127 or c in (9,10,13) for c in b[:-1])

def render(path, name, indent):
    pad = '  ' * indent
    files = sorted(os.listdir(path))
    lines = [f'{pad}{name} {{']
    for f in files:
        if f in SKIP: continue
        p = os.path.join(path, f)
        if os.path.isdir(p):
            lines.append(render(p, f, indent + 1))
            continue
        try:
            b = open(p, 'rb').read()
        except OSError:
            continue
        if not b:
            lines.append(f'{pad}  {f};'); continue
        if f in STRINGY or is_str(b):
            s = b.rstrip(b'\x00').decode('utf-8', 'replace')
            lines.append(f'{pad}  {f} = "{s}";')
        elif len(b) % 4 == 0:
            cells = struct.unpack(f'>{len(b)//4}I', b)
            body = ' '.join(f'0x{c:x}' for c in cells[:64])
            more = ' /* … */' if len(cells) > 64 else ''
            lines.append(f'{pad}  {f} = <{body}>{more};')
        else:
            body = ' '.join(f'{x:02x}' for x in b[:64])
            lines.append(f'{pad}  {f} = [{body}];')
    lines.append(f'{pad}}};')
    return '\n'.join(lines)

root = sys.argv[1] if len(sys.argv) > 1 else './tree'
print('/dts-v1/;')
print('/ {')
for f in sorted(os.listdir(root)):
    p = os.path.join(root, f)
    if os.path.isdir(p):
        print(render(p, f, 1))
    elif f not in SKIP:
        try: b = open(p, 'rb').read()
        except OSError: continue
        s = b.rstrip(b'\x00').decode('utf-8', 'replace')
        print(f'  {f} = "{s}";')
print('};')
