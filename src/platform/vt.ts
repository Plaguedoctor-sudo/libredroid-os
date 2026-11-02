/** Minimal but correct VT100/xterm emulator: cell grid, SGR, cursor, erase, scrollback. */

export interface Cell {
  ch: string;
  fg: string | null; bg: string | null;
  bold: boolean; dim: boolean; italic: boolean; underline: boolean; inverse: boolean;
}

const BLANK: Cell = { ch: ' ', fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false };
const clone = (c: Cell): Cell => ({ ...c });

const BASIC = ['#1c1c1c', '#d75f5f', '#5faf5f', '#d7af5f', '#5f87d7', '#af5fd7', '#5fafaf', '#e4e4e4'];
const BRIGHT = ['#6c6c6c', '#ff8787', '#87d787', '#ffd787', '#87afff', '#d787ff', '#87d7d7', '#ffffff'];

const rgb256 = (n: number): string => {
  if (n < 16) return (n < 8 ? BASIC : BRIGHT)[n % 8];
  if (n < 232) {
    const v = n - 16;
    const r = Math.floor(v / 36), g = Math.floor((v % 36) / 6), b = v % 6;
    const s = (x: number) => (x === 0 ? 0 : 55 + x * 40);
    return `rgb(${s(r)},${s(g)},${s(b)})`;
  }
  const g = 8 + (n - 232) * 10;
  return `rgb(${g},${g},${g})`;
};

type Parser = 'ground' | 'esc' | 'csi' | 'osc' | 'charset';

export class VT {
  cols: number; rows: number;
  private grid: Cell[][];
  private scroll: Cell[][] = [];
  private scrollMax: number;
  private cur = { r: 0, c: 0 };
  private saved = { r: 0, c: 0 };
  private pen: Omit<Cell, 'ch'> = { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false };
  private wrap = true;
  private pendingWrap = false;
  private parser: Parser = 'ground';
  private buf = '';
  private osc = '';
  private alt = false;
  private savedGrid: Cell[][] | null = null;
  title = '';
  cursorVisible = true;
  /** bumped on every mutation so React can memoise cheaply */
  version = 0;

  constructor(cols = 80, rows = 24, scrollMax = 2000) {
    this.cols = cols; this.rows = rows; this.scrollMax = scrollMax;
    this.grid = this.blankGrid();
  }

  private blankGrid() {
    return Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => clone(BLANK)));
  }

  resize(cols: number, rows: number) {
    const next = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (this.grid[r]?.[c] ? clone(this.grid[r][c]) : clone(BLANK))));
    this.cols = cols; this.rows = rows; this.grid = next;
    this.cur.r = Math.min(this.cur.r, rows - 1);
    this.cur.c = Math.min(this.cur.c, cols - 1);
    this.version++;
  }

  reset() { this.grid = this.blankGrid(); this.cur = { r: 0, c: 0 }; this.scroll = []; this.version++; }

  /* ---------- output ---------- */
  write(input: string) {
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const code = input.charCodeAt(i);
      switch (this.parser) {
        case 'ground':
          if (code === 0x1b) { this.parser = 'esc'; break; }
          if (code === 0x0a || code === 0x0b || code === 0x0c) { this.lf(); break; }
          if (code === 0x0d) { this.cur.c = 0; this.pendingWrap = false; break; }
          if (code === 0x08) { this.cur.c = Math.max(0, this.cur.c - 1); this.pendingWrap = false; break; }
          if (code === 0x09) { this.cur.c = Math.min(this.cols - 1, (Math.floor(this.cur.c / 8) + 1) * 8); break; }
          if (code === 0x07) break;
          if (code < 0x20) break;
          if (code === 0x7f) break;
          this.put(ch);
          break;
        case 'esc':
          if (ch === '[') { this.parser = 'csi'; this.buf = ''; break; }
          if (ch === ']') { this.parser = 'osc'; this.osc = ''; break; }
          if (ch === '(' || ch === ')' || ch === '*' || ch === '+') { this.parser = 'charset'; break; }
          if (ch === '7') { this.saved = { ...this.cur }; this.parser = 'ground'; break; }
          if (ch === '8') { this.cur = { ...this.saved }; this.parser = 'ground'; break; }
          if (ch === 'D') { this.lf(); this.parser = 'ground'; break; }
          if (ch === 'M') { this.ri(); this.parser = 'ground'; break; }
          if (ch === 'E') { this.cur.c = 0; this.lf(); this.parser = 'ground'; break; }
          if (ch === 'c') { this.reset(); this.parser = 'ground'; break; }
          if (ch === '=' || ch === '>') { this.parser = 'ground'; break; }
          this.parser = 'ground';
          break;
        case 'charset':
          this.parser = 'ground';
          break;
        case 'osc':
          if (ch === '\x07') { this.finishOsc(); break; }
          if (ch === '\x1b') { this.finishOsc(); this.parser = 'esc'; break; }
          this.osc += ch;
          break;
        case 'csi': {
          const c = ch;
          if (/[0-9;?<>=!]/.test(c)) { this.buf += c; break; }
          this.csi(c);
          this.parser = 'ground';
          break;
        }
      }
    }
    this.version++;
  }

  private finishOsc() {
    const m = /^(\d+);(.*)$/.exec(this.osc);
    if (m && (m[1] === '0' || m[1] === '2')) this.title = m[2];
    this.osc = '';
    this.parser = 'ground';
  }

  private put(ch: string) {
    if (this.pendingWrap && this.wrap) { this.cur.c = 0; this.lf(); }
    this.pendingWrap = false;
    const row = this.grid[this.cur.r];
    if (!row) return;
    const cell = row[this.cur.c];
    if (cell) { row[this.cur.c] = { ch, ...this.pen }; }
    if (this.cur.c >= this.cols - 1) this.pendingWrap = true;
    else this.cur.c++;
  }

  private lf() {
    if (this.cur.c === this.cols) { this.cur.c = 0; }
    if (this.cur.r >= this.rows - 1) this.scrollUp(); else this.cur.r++;
  }

  private ri() {
    if (this.cur.r <= 0) {
      this.grid.pop();
      this.grid.unshift(Array.from({ length: this.cols }, () => clone(BLANK)));
    } else this.cur.r--;
  }

  private scrollUp() {
    const top = this.grid.shift();
    if (top && !this.alt) {
      this.scroll.push(top);
      if (this.scroll.length > this.scrollMax) this.scroll.shift();
    }
    this.grid.push(Array.from({ length: this.cols }, () => clone(BLANK)));
  }

  private csi(final: string) {
    const priv = this.buf.startsWith('?');
    const raw = priv ? this.buf.slice(1) : this.buf;
    const nums = raw.split(';').map((s) => (s === '' ? 0 : parseInt(s, 10))).map((n) => (Number.isFinite(n) ? n : 0));
    const p = (i: number, d = 1) => (nums[i] === undefined || nums[i] === 0 ? d : nums[i]);

    switch (final) {
      case 'm': this.sgr(nums); break;
      case 'H': case 'f': this.cur = { r: Math.min(this.rows - 1, Math.max(0, p(0) - 1)), c: Math.min(this.cols - 1, Math.max(0, p(1) - 1)) }; this.pendingWrap = false; break;
      case 'A': this.cur.r = Math.max(0, this.cur.r - p(0)); break;
      case 'B': this.cur.r = Math.min(this.rows - 1, this.cur.r + p(0)); break;
      case 'C': this.cur.c = Math.min(this.cols - 1, this.cur.c + p(0)); break;
      case 'D': this.cur.c = Math.max(0, this.cur.c - p(0)); break;
      case 'G': this.cur.c = Math.min(this.cols - 1, Math.max(0, p(0) - 1)); break;
      case 'd': this.cur.r = Math.min(this.rows - 1, Math.max(0, p(0) - 1)); break;
      case 'E': this.cur.c = 0; this.cur.r = Math.min(this.rows - 1, this.cur.r + p(0)); break;
      case 'F': this.cur.c = 0; this.cur.r = Math.max(0, this.cur.r - p(0)); break;
      case 's': this.saved = { ...this.cur }; break;
      case 'u': this.cur = { ...this.saved }; break;
      case 'J': this.eraseDisplay(nums[0] ?? 0); break;
      case 'K': this.eraseLine(nums[0] ?? 0); break;
      case 'L': this.insertLines(p(0)); break;
      case 'M': this.deleteLines(p(0)); break;
      case 'P': this.deleteChars(p(0)); break;
      case '@': this.insertChars(p(0)); break;
      case 'X': this.eraseChars(p(0)); break;
      case 'h': if (priv) this.setMode(raw, true); break;
      case 'l': if (priv) this.setMode(raw, false); break;
      default: break;
    }
  }

  private setMode(raw: string, on: boolean) {
    for (const n of raw.split(';').map(Number)) {
      if (n === 25) this.cursorVisible = on;
      else if (n === 7) this.wrap = on;
      else if (n === 1049 || n === 1047 || n === 47) {
        if (on && !this.alt) { this.savedGrid = this.grid; this.alt = true; this.grid = this.blankGrid(); this.cur = { r: 0, c: 0 }; }
        else if (!on && this.alt) { this.alt = false; if (this.savedGrid) this.grid = this.savedGrid; this.savedGrid = null; }
      }
    }
  }

  private sgr(nums: number[]) {
    if (!nums.length) nums = [0];
    for (let i = 0; i < nums.length; i++) {
      const n = nums[i];
      if (n === 0) this.pen = { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false };
      else if (n === 1) this.pen.bold = true;
      else if (n === 2) this.pen.dim = true;
      else if (n === 3) this.pen.italic = true;
      else if (n === 4) this.pen.underline = true;
      else if (n === 7) this.pen.inverse = true;
      else if (n === 22) { this.pen.bold = false; this.pen.dim = false; }
      else if (n === 23) this.pen.italic = false;
      else if (n === 24) this.pen.underline = false;
      else if (n === 27) this.pen.inverse = false;
      else if (n >= 30 && n <= 37) this.pen.fg = BASIC[n - 30];
      else if (n === 39) this.pen.fg = null;
      else if (n >= 40 && n <= 47) this.pen.bg = BASIC[n - 40];
      else if (n === 49) this.pen.bg = null;
      else if (n >= 90 && n <= 97) this.pen.fg = BRIGHT[n - 90];
      else if (n >= 100 && n <= 107) this.pen.bg = BRIGHT[n - 100];
      else if (n === 38 || n === 48) {
        const key = n === 38 ? 'fg' : 'bg';
        if (nums[i + 1] === 5) { this.pen[key] = rgb256(nums[i + 2] ?? 0); i += 2; }
        else if (nums[i + 1] === 2) { this.pen[key] = `rgb(${nums[i + 2] ?? 0},${nums[i + 3] ?? 0},${nums[i + 4] ?? 0})`; i += 4; }
      }
    }
  }

  private eraseLine(mode: number) {
    const row = this.grid[this.cur.r]; if (!row) return;
    const from = mode === 1 ? 0 : mode === 2 ? 0 : this.cur.c;
    const to = mode === 0 ? this.cols - 1 : mode === 1 ? this.cur.c : this.cols - 1;
    for (let c = from; c <= to; c++) if (row[c]) row[c] = { ch: ' ', ...this.pen, ch2: undefined } as any;
    for (let c = from; c <= to; c++) row[c] = { ch: ' ', ...this.pen };
  }

  private eraseDisplay(mode: number) {
    if (mode === 2 || mode === 3) { this.grid = this.blankGrid(); return; }
    if (mode === 1) {
      for (let r = 0; r < this.cur.r; r++) this.grid[r] = Array.from({ length: this.cols }, () => clone(BLANK));
      this.eraseLine(1);
    } else {
      this.eraseLine(0);
      for (let r = this.cur.r + 1; r < this.rows; r++) this.grid[r] = Array.from({ length: this.cols }, () => clone(BLANK));
    }
  }

  private eraseChars(n: number) {
    const row = this.grid[this.cur.r]; if (!row) return;
    for (let c = this.cur.c; c < Math.min(this.cols, this.cur.c + n); c++) row[c] = { ch: ' ', ...this.pen };
  }

  private insertChars(n: number) {
    const row = this.grid[this.cur.r]; if (!row) return;
    const blanks = Array.from({ length: n }, () => clone(BLANK));
    row.splice(this.cur.c, 0, ...blanks);
    row.length = this.cols;
  }

  private deleteChars(n: number) {
    const row = this.grid[this.cur.r]; if (!row) return;
    row.splice(this.cur.c, n);
    while (row.length < this.cols) row.push(clone(BLANK));
  }

  private insertLines(n: number) {
    for (let i = 0; i < n; i++) {
      this.grid.splice(this.cur.r, 0, Array.from({ length: this.cols }, () => clone(BLANK)));
      this.grid.length = this.rows;
    }
  }

  private deleteLines(n: number) {
    for (let i = 0; i < n; i++) {
      this.grid.splice(this.cur.r, 1);
      this.grid.push(Array.from({ length: this.cols }, () => clone(BLANK)));
    }
  }

  /* ---------- read ---------- */
  getCursor() { return { ...this.cur, visible: this.cursorVisible }; }
  getScrollback() { return this.scroll; }
  getGrid() { return this.grid; }
  /** plain text, for copy and for search */
  text(includeScroll = false) {
    const rows = includeScroll ? [...this.scroll, ...this.grid] : this.grid;
    return rows.map((r) => r.map((c) => c.ch).join('').replace(/\s+$/, '')).join('\n');
  }
}
