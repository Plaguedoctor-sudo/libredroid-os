'use strict';
/* Minimal, dependency-free APK reader: package name, label, version, minSdk, icon.
   Handles binary AndroidManifest.xml + resources.arsc + adaptive-icon XML.
   Everything is best-effort; callers must tolerate nulls. */
const fs = require('fs');
const zlib = require('zlib');

const TYPE_STRING = 0x03, TYPE_REF = 0x01, TYPE_INT_DEC = 0x10,
      TYPE_INT_HEX = 0x11, TYPE_INT_BOOL = 0x12, TYPE_INT_COLOR = 0x1c;

/* ---------- zip ---------- */
function openZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  const floor = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const idx = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const csize  = buf.readUInt32LE(off + 20);
    const nl     = buf.readUInt16LE(off + 28);
    const el     = buf.readUInt16LE(off + 30);
    const cl     = buf.readUInt16LE(off + 32);
    const lho    = buf.readUInt32LE(off + 42);
    idx.set(buf.toString('utf8', off + 46, off + 46 + nl), { method, csize, lho });
    off += 46 + nl + el + cl;
  }
  return {
    names: () => [...idx.keys()],
    get(name) {
      const e = idx.get(name); if (!e) return null;
      const nl = buf.readUInt16LE(e.lho + 26), el = buf.readUInt16LE(e.lho + 28);
      const s = e.lho + 30 + nl + el;
      const raw = buf.subarray(s, s + e.csize);
      if (e.method === 0) return raw;
      if (e.method === 8) { try { return zlib.inflateRawSync(raw); } catch { return null; } }
      return null;
    },
  };
}

/* ---------- string pool ---------- */
function stringPool(buf, p) {
  const count = buf.readUInt32LE(p + 8);
  const flags = buf.readUInt32LE(p + 16);
  const start = buf.readUInt32LE(p + 20);
  const utf8 = !!(flags & 0x100);
  const base = p + start;
  const out = new Array(count).fill('');
  for (let i = 0; i < count; i++) {
    const o = base + buf.readUInt32LE(p + 28 + i * 4);
    try {
      if (utf8) {
        let l = buf.readUInt8(o), s = o + 1;
        if (l & 0x80) { l = ((l & 0x7f) << 8) | buf.readUInt8(s); s++; }
        let u = buf.readUInt8(s); s++;
        if (u & 0x80) { u = ((u & 0x7f) << 8) | buf.readUInt8(s); s++; }
        out[i] = buf.toString('utf8', s, s + l);
      } else {
        let l = buf.readUInt16LE(o), s = o + 2;
        if (l & 0x8000) { l = ((l & 0x7fff) << 16) | buf.readUInt16LE(s); s += 2; }
        out[i] = buf.toString('utf16le', s, s + l * 2);
      }
    } catch { out[i] = ''; }
  }
  return out;
}

/* ---------- binary xml ---------- */
function parseAxml(buf) {
  let p = 8, pool = null;
  const els = [];
  while (p + 8 <= buf.length) {
    const type = buf.readUInt16LE(p), size = buf.readUInt32LE(p + 4);
    if (size < 8 || p + size > buf.length) break;
    if (type === 0x0001) pool = stringPool(buf, p);
    else if (type === 0x0102) {
      const nameIdx = buf.readUInt32LE(p + 20);
      const attrStart = buf.readUInt16LE(p + 24);
      const attrSize = buf.readUInt16LE(p + 26) || 20;
      const attrCount = buf.readUInt16LE(p + 28);
      const el = { name: pool ? pool[nameIdx] : '', attrs: {} };
      let a = p + 16 + attrStart;
      for (let i = 0; i < attrCount; i++, a += attrSize) {
        if (a + attrSize > p + size) break;
        const an  = buf.readUInt32LE(a + 4);
        const raw = buf.readUInt32LE(a + 8);
        const dt  = buf.readUInt8(a + 15);
        const dd  = buf.readUInt32LE(a + 16);
        const key = pool ? pool[an] : '';
        if (key) el.attrs[key] = {
          type: dt, data: dd,
          raw: (raw >= 0 && raw !== 0xffffffff && pool) ? pool[raw] : null,
        };
      }
      els.push(el);
    }
    p += size;
  }
  return els;
}

const attrStr = (a) => !a ? null
  : a.type === TYPE_STRING ? (a.raw ?? null)
  : a.type === TYPE_REF ? { ref: a.data } : null;

/* ---------- resources.arsc ---------- */
function parseArsc(buf) {
  const globalStrings = [];
  const pkgs = new Map();
  const walk = (p, end) => {
    while (p + 8 <= end) {
      const type = buf.readUInt16LE(p), hsize = buf.readUInt16LE(p + 2), size = buf.readUInt32LE(p + 4);
      if (size < 8 || p + size > end) break;
      if (type === 0x0001) globalStrings.push(...stringPool(buf, p));
      else if (type === 0x0200) {
        const id = buf.readUInt32LE(p + 8);
        const typeIdOffset = hsize > 288 ? buf.readUInt32LE(p + 288) : 0;
        const types = new Map();
        walk2(p + hsize, p + size, id, types, typeIdOffset);
        pkgs.set(id, types);
      }
      p += size;
    }
  };
  const walk2 = (p, end, pkgId, types, tOff) => {
    while (p + 8 <= end) {
      const type = buf.readUInt16LE(p), hsize = buf.readUInt16LE(p + 2), size = buf.readUInt32LE(p + 4);
      if (size < 8 || p + size > end) break;
      if (type === 0x0201) {
        const tId = buf.readUInt8(p + 8) + tOff;
        const entryCount = buf.readUInt32LE(p + 12);
        const entriesStart = buf.readUInt32LE(p + 16);
        let density = 0;
        try { density = buf.readUInt16LE(p + 34); } catch {}
        const list = types.get(tId) || [];
        const entries = new Map();
        for (let i = 0; i < entryCount; i++) {
          const o = buf.readUInt32LE(p + hsize + i * 4);
          if (o === 0xffffffff) continue;
          const ep = p + entriesStart + o;
          const dt = buf.readUInt8(ep + 3);
          const dd = buf.readUInt32LE(ep + 4);
          entries.set(i, { type: dt, data: dd });
        }
        list.push({ density, entries });
        types.set(tId, list);
      }
      p += size;
    }
  };
  walk(8, buf.length);
  return { globalStrings, pkgs };
}

function resolve(arsc, resId) {
  const pkgId = (resId >>> 24) & 0xff, typeId = (resId >>> 16) & 0xff, entry = resId & 0xffff;
  const types = arsc.pkgs.get(pkgId); if (!types) return null;
  const list = types.get(typeId); if (!list) return null;
  const out = [];
  for (const t of list) {
    const e = t.entries.get(entry); if (!e) continue;
    out.push({ density: t.density, type: e.type, data: e.data });
  }
  return out.length ? out : null;
}
const arscValue = (arsc, e) =>
  e.type === TYPE_STRING ? (arsc.globalStrings[e.data] ?? null)
  : e.type === TYPE_INT_COLOR ? '#' + (e.data >>> 0).toString(16).padStart(8, '0')
  : null;

/* ---------- public ---------- */
function readApkMeta(apkPath) {
  const out = { path: apkPath, packageName: null, label: null, versionName: null,
                versionCode: null, minSdk: null, targetSdk: null,
                iconPath: null, iconFg: null, iconBg: null, bgColor: null };
  let zip;
  try { zip = openZip(apkPath); } catch { return out; }

  const mx = zip.get('AndroidManifest.xml'); if (!mx) return out;
  let els;
  try { els = parseAxml(mx); } catch { return out; }

  const manifest = els.find((e) => e.name === 'manifest');
  if (manifest?.attrs.package?.raw) out.packageName = manifest.attrs.package.raw;

  const verName = attrStr(manifest?.attrs.versionName);
  out.versionName = typeof verName === 'string' ? verName : null;
  const vc = manifest?.attrs.versionCode;
  if (vc && (vc.type === TYPE_INT_DEC || vc.type === TYPE_INT_HEX)) out.versionCode = vc.data;

  const uses = els.find((e) => e.name === 'uses-sdk');
  for (const k of ['minSdkVersion', 'targetSdkVersion']) {
    const a = uses?.attrs[k];
    if (!a) continue;
    const v = a.type === TYPE_STRING ? parseInt(a.raw, 10) : a.data;
    if (k === 'minSdkVersion') out.minSdk = v; else out.targetSdk = v;
  }

  const app = els.find((e) => e.name === 'application');
  if (!app) return out;

  const arscRaw = zip.get('resources.arsc');
  let arsc = null;
  if (arscRaw) { try { arsc = parseArsc(arscRaw); } catch { arsc = null; } }

  const pickString = (a) => {
    if (!a) return null;
    if (a.type === TYPE_STRING) return a.raw ?? null;
    if (a.type === TYPE_REF && arsc) {
      const cands = resolve(arsc, a.data); if (!cands) return null;
      for (const c of cands.sort((x, y) => y.density - x.density)) {
        const v = arscValue(arsc, c); if (typeof v === 'string' && !/^res\//.test(v)) return v;
      }
    }
    return null;
  };
  out.label = pickString(app.attrs.label);

  const iconAttr = app.attrs.roundIcon || app.attrs.icon;
  if (iconAttr && iconAttr.type === TYPE_REF && arsc) {
    const cands = resolve(arsc, iconAttr.data) || [];
    const files = cands.filter((c) => c.type === TYPE_STRING)
                       .map((c) => ({ d: c.density, p: arsc.globalStrings[c.data] }))
                       .filter((x) => typeof x.p === 'string' && /^res\//.test(x.p));
    files.sort((a, b) => b.d - a.d);
    const top = files[0]?.p || null;
    if (top && /\.xml$/i.test(top)) {
      const xml = zip.get(top);
      if (xml) {
        const ax = parseAxml(xml);
        const fg = ax.find((e) => e.name === 'foreground')?.attrs.drawable;
        const bg = ax.find((e) => e.name === 'background')?.attrs.drawable;
        if (fg?.type === TYPE_REF) {
          const f = (resolve(arsc, fg.data) || []).filter((c) => c.type === TYPE_STRING)
            .map((c) => ({ d: c.density, p: arsc.globalStrings[c.data] }))
            .filter((x) => /^res\//.test(x.p || '')).sort((a, b) => b.d - a.d)[0]?.p || null;
          out.iconFg = f;
        }
        if (bg) {
          if (bg.type === TYPE_INT_COLOR) out.bgColor = '#' + (bg.data >>> 0).toString(16).padStart(8, '0');
          else if (bg.type === TYPE_REF) {
            const b = (resolve(arsc, bg.data) || []).find((c) => c.type === TYPE_INT_COLOR);
            if (b) out.bgColor = arscValue(arsc, b);
            else {
              const bf = (resolve(arsc, bg.data) || []).filter((c) => c.type === TYPE_STRING)
                .map((c) => arsc.globalStrings[c.data]).filter((x) => /^res\//.test(x || ''))[0] || null;
              out.iconBg = bf;
            }
          }
        }
      }
      if (!out.iconFg) {
        const cand = zip.names().filter((n) => /^res\/mipmap[^/]*\/.*launcher.*\.(png|webp)$/i.test(n))
          .sort((a, b) => b.length - a.length)[0];
        if (cand) out.iconFg = cand;
      }
    } else {
      out.iconPath = top;
    }
  }

  const grab = (entry) => {
    if (!entry) return null;
    const b = zip.get(entry); if (!b) return null;
    const mime = /\.webp$/i.test(entry) ? 'image/webp' : 'image/png';
    return { mime, b64: b.toString('base64') };
  };
  out._icon = grab(out.iconFg || out.iconPath);
  out._iconBg = grab(out.iconBg);
  return out;
}

module.exports = { readApkMeta, openZip, parseAxml, parseArsc, resolve };
