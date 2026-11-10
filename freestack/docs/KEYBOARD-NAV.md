# FreeStack Full-Surface Keyboard Navigation Contract (Task 11.8)

**Work Package Reference**: W11 (Task 11.8)  
**Standard**: Non-pointer, keyboard-only accessibility across 100% of shell, settings, and dialog surfaces.

---

## 1. Global Navigation Keys

| Key Binding | Action | Scope | Accessible Announcement |
|---|---|---|---|
| `Super` (Windows key) | Open/Close Application Launcher | Global Shell | "Application Launcher opened, search active" |
| `Super + Tab` | Next Active Task / Window | Global Compositor | Window title and application name voiced via AT-SPI |
| `Super + Shift + Tab` | Previous Active Task | Global Compositor | Window title voiced |
| `Super + Q` | Close Focused Window | Active Surface | "Window closed" |
| `Super + S` | Open FreeStack Settings Suite | Global Shell | "Settings window opened" |
| `Super + L` | Lock Session Immediately | Security Domain | "Session locked" |
| `Super + A` | Toggle Orca Screen Reader | Accessibility | "Orca screen reader activated / deactivated" |
| `Super + H` | Toggle High Contrast Mode | Display Bridge | "High contrast mode enabled / disabled" |

---

## 2. Widget Focus Traversal Standards

All custom FreeStack GTK/Wayland widgets must obey strict focus traversal:
1. **Tab / Shift+Tab**: Forward and backward cyclical navigation between interactive elements. Focus rings must maintain at least 4.5:1 contrast against surface background.
2. **Arrow Keys (Up/Down/Left/Right)**: Navigate inside list views, option groups, tabs, and sliders.
3. **Space / Enter**: Activate buttons, toggle checkboxes, or expand disclosure groups.
4. **Escape**: Dismiss overlays, drop-downs, modal consent sheets, or contextual menus, restoring focus to the originating trigger widget.
5. **No Trapping**: Focus must never become trapped inside any frame, sandboxed container window, or web view.
