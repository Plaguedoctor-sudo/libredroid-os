# Universal Converged Wayland Shell (`shell/`)

Replaces Android's `SurfaceFlinger` and monolithic `SystemUI`.
Constructed in Rust as a sub-30MB, low-latency Wayland compositor that dynamically conforms to any form factor without restarting user sessions or killing apps.

## Subdirectories

- [`compositor/`](file:///home/nitin/fkgugal/application/shell/compositor): Direct DRM/KMS and libinput display server with 120Hz/VRR frame flipping.
- [`convergence/`](file:///home/nitin/fkgugal/application/shell/convergence): Multi-form-factor layout engine:
  - `handset`: Gesture-driven single-hand layout
  - `foldable`: Hinge-aware dual-pane splitting
  - `tablet`: Pencil/stylus palm-rejection layout
  - `desktop`: Floating/tiling window manager with multi-display dock
- [`osk/`](file:///home/nitin/fkgugal/application/shell/osk): Isolated layer-shell on-screen keyboard with zero keystroke leakage.
- [`system-ui/`](file:///home/nitin/fkgugal/application/shell/system-ui): Status bar, quick settings, domain isolation badges, and biometric lockscreen.
