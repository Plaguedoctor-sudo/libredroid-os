# OmniOS - Universal Adaptive Android System

OmniOS is a universal, multi-form-factor operating system shell and application runtime inspired by Google Android (AOSP) and Samsung DeX / ChromeOS. It fluidly adapts its UI paradigms, navigation models, and window management to any device size or input mechanism.

---

## 🌟 Adaptive Form Factors

OmniOS dynamically detects and adapts to 5 distinct form factors:

1. **Auto-Adaptive**: Continuously monitors the browser viewport and switches dynamically between phone, tablet, and desktop layouts.
2. **Smartphone Mode (Pixel 9 Pro)**:
   - Fullscreen app containers
   - Android 3-button navigation & gesture pill
   - Punch-hole camera bezel simulation
   - Swipe-up Google App Drawer
   - Top status bar with quick settings shade pull-down
3. **Tablet Mode (Pixel Tablet)**:
   - High-DPI app grid with pinned bottom dock
   - Multi-column quick settings and split notifications
4. **Foldable Mode (Pixel Fold)**:
   - Hinge state simulation: **Folded** (narrow outer cover screen) vs **Unfolded** (wide dual-pane canvas)
5. **Desktop Mode (Samsung DeX / ChromeOS)**:
   - Floating, draggable, resizable multi-window desktop manager
   - Bottom taskbar with Start / Apps launcher, running app indicators, and system tray
   - Minimize, Maximize, and Close window controls

---

## 📱 Built-In Universal Applications

- **Chrome Browser**: Multi-tab browsing, URL navigation, Google search engine simulation, bookmarks, and quick shortcuts.
- **Files & Drive**: Virtual hierarchical filesystem (`Documents`, `Downloads`, `Cloud Drive`), file creation, reading text files, and storage quota tracking.
- **Pixel Camera**: Real webcam hardware integration (`navigator.mediaDevices`), viewfinder grid, capture shutter with flash, and real-time color filters (Vintage, Grayscale, Cyberpunk).
- **Omni Terminal Pro**: Interactive command-line shell with `help`, `neofetch`, `device <mode>`, `battery`, `whoami`, `ls`, `clear`, and system diagnostics.
- **Calculator**: Material 3 calculator with basic operations and safe expression calculation.
- **Keep Notes**: Google Keep-style sticky note keeper with customizable color palettes and `localStorage` persistence.
- **Play Store**: App repository allowing 1-click installation, simulated updates, and app launching.
- **Clock & Stopwatch**: Real-time world clock and stopwatch with lap control.
- **Google Photos**: Gallery viewer with lightbox preview, photo metadata, and editing simulation.
- **Omni Gemini Assistant**: Smart AI assistant sheet for voice/text device commands (switching form factors, opening apps, checking battery).

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Dev server runs on `http://localhost:3001` (or `3000`).
