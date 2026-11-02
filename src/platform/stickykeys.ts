// src/platform/stickykeys.ts — sticky modifiers for the shell's own keyboard,
// which is where touch users actually type. libxkbcommon's AccessX support is
// partial, so implementing it in the keyboard is the reliable route.
export class StickyKeys {
  private held = new Set<string>();
  enabled = false;

  press(k: string) { if (this.enabled) this.held.add(k); }
  release(_k: string) { /* stay held until consumed */ }
  consume(): string[] {
    const mods = [...this.held];
    if (this.enabled) this.held.clear();
    return mods;
  }
  /** a key event becomes modifier-prefixed if any sticky modifier is held */
  apply(k: string) { const m = this.consume(); return [...m, k].join('+'); }
  toggle() { this.enabled = !this.enabled; if (!this.enabled) this.held.clear(); }
}
export const stickyKeys = new StickyKeys();
