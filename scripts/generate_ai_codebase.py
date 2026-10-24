#!/usr/bin/env python3
"""
Generate AI Codebase File (APPLICATION_CODE_FOR_AI.md)
This script bundles the entire LibreDroid OS application architecture,
directory structure, context models, and full source code into a single,
cleanly-formatted, AI-optimized document so any LLM (Gemini, Claude, GPT-4, etc.)
can instantly read, understand, debug, and extend the system.
"""

import os
import sys
from datetime import datetime

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_FILE = os.path.join(ROOT_DIR, "APPLICATION_CODE_FOR_AI.md")

# Files to exclude from the code export
EXCLUDED_EXTENSIONS = {".iso", ".png", ".jpg", ".jpeg", ".webp", ".ico", ".svg", ".lock"}
EXCLUDED_FILES = {"package-lock.json", "APPLICATION_CODE_FOR_AI.md", "libredroid-universal-x86_64.iso"}
EXCLUDED_DIRS = {"node_modules", ".git", "dist", ".gemini", "brain"}

# Order of files to present logically to an AI
PRIORITY_DIRS = [
    "src/types",
    "src/context",
    "src/services",
    "src/constants",
    "src",
    "src/components/common",
    "src/components/device",
    "src/components/window",
    "src/components/navigation",
    "src/components/statusbar",
    "src/components/launcher",
    "src/components/security",
    "src/components/persona",
    "src/components/assistant",
    "src/components/apps",
    "server",
    "installer",
    "scripts",
]

LANGUAGE_MAP = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".json": "json",
    ".css": "css",
    ".html": "html",
    ".sh": "bash",
    ".py": "python",
    ".md": "markdown",
    ".webmanifest": "json"
}

def get_relative_path(path):
    return os.path.relpath(path, ROOT_DIR)

def should_include_file(rel_path):
    parts = rel_path.split(os.sep)
    for part in parts:
        if part in EXCLUDED_DIRS:
            return False
    base = os.path.basename(rel_path)
    if base in EXCLUDED_FILES:
        return False
    _, ext = os.path.splitext(rel_path)
    if ext in EXCLUDED_EXTENSIONS:
        return False
    return True

def collect_files():
    all_files = []
    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = get_relative_path(full_path)
            if should_include_file(rel_path):
                all_files.append(rel_path)
    
    # Sort files according to priority
    def sort_key(path):
        dirname = os.path.dirname(path)
        basename = os.path.basename(path)
        
        # Check priority index
        priority_index = 999
        for idx, p_dir in enumerate(PRIORITY_DIRS):
            if dirname == p_dir or dirname.startswith(p_dir + "/"):
                priority_index = idx
                break
        
        # Root configs like package.json first or last
        if dirname == "":
            if basename in ["package.json", "vite.config.ts", "tsconfig.json"]:
                priority_index = -1
            else:
                priority_index = 1000
                
        return (priority_index, dirname, basename)

    all_files.sort(key=sort_key)
    return all_files

def generate_ai_documentation(files):
    total_lines = 0
    file_stats = []
    
    for rel_path in files:
        full_path = os.path.join(ROOT_DIR, rel_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                lines = len(f.readlines())
                total_lines += lines
                file_stats.append((rel_path, lines))
        except Exception as e:
            file_stats.append((rel_path, 0))

    header = f"""# LibreDroid OS - Comprehensive Application Code & Architecture for AI

> **Purpose:** This file contains the complete codebase, architectural specification, context models, and runtime mechanics of **LibreDroid OS**. It is structured to allow any AI (LLM / reasoning engine / coding assistant) to thoroughly analyze, understand, debug, and enhance the application without missing dependencies or context.
>
> **Generated on:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
> **Total Files Exported:** {len(files)}
> **Total Lines of Source Code:** {total_lines:,}

---

## 1. Executive System Overview

**LibreDroid OS** (`omni-android-system`) is an independent, non-monopolistic universal operating environment running across smartphones, foldables, tablets, and desktop workstations.

### Core Pillars
1. **Universal Form Factor Responsiveness:**
   - Dynamically adapts between `phone`, `tablet`, `foldable`, and `desktop` window modes via `DeviceFrame` and `DeviceSwitcherBar`.
   - Desktop mode features resizable, draggable floating windows, taskbar with running tasks, system tray, and start drawer.
   - Mobile modes feature status bar, navigation bar (3-button / gestures), notification shade with quick settings, and Android-style home screen.

2. **Multi-OS Qubes-Style Hypervisor Isolation:**
   - Applications are partitioned into isolated security domains:
     - **seL4 Microkernel Vault** (`#8b5cf6`): Formally-verified microkernel isolation for crypto credentials and password storage.
     - **Whonix-Gateway Tor Domain** (`#10b981`): All networking routed through Tor circuits with anti-fingerprinting.
     - **GrapheneOS AOSP Runtime** (`#3b82f6`): Hardened Android Open Source Project container with microG.
     - **Disposable Alpine Linux VM** (`#ef4444`): Volatile RAM-disk container destroyed on window close.
     - **Debian Workstation Container** (`#f59e0b`): Rootless POSIX container with terminal and development toolchains.
     - **Apple Darwin / CocoaTouch Bridge** (`#f43f5e`): Hardware-accelerated Darwin/Mach-O runtime (Darling XNU + touchHLE + MoltenVK).
   - Dynamic domain migration badge in every window frame enables on-the-fly isolation switching.

3. **Active Defense & Anti-Predatory Security Stack:**
   - **Linux Sandboxing & Guardrails:** cgroups v2 resource ceilings, Seccomp-BPF syscall filters, Landlock LSM filesystem sandboxing, and dummy sensor streams (camera, mic, GPS) to prevent data exfiltration.
   - **Telemetry Poisoning Engine:** Intercepts commercial tracking beacons (Firebase, Meta Graph, AppsFlyer) and injects randomized high-entropy dummy data.
   - **Anti-Predatory Shield:** Defuses dark patterns, urgency countdowns, forced paywalls, review nagging, and in-game gacha loot boxes.
   - **Irrevocable Subscription Killer:** Cancels recurring payments directly at the OS boundary.

4. **Universal Persona Adaptation Engine:**
   - Instant dynamic recalibration of UI layout, density, animations, and security constraints based on user profile:
     - `standard`: Balanced modern sovereign OS experience.
     - `power_user`: Low latency, compact density, terminal shortcuts, hypervisor controls.
     - `minimalist`: Distraction-free typography, zero badges, grayscale/e-ink palette.
     - `elderly_accessible`: High contrast, 160% text scale, oversized touch targets, loud audio prompts.
     - `child_safe`: Content gating, strict domain lockdown, educational default apps, anti-predatory shield locked on.

5. **Hardware Bridge & Native OS Integration:**
   - `server/hardwareBridgePlugin.ts`: Vite plugin & WebSocket server interfacing with host Linux hardware (battery, CPU, memory, display brightness, Wi-Fi, audio, and Waydroid/ADB container management).
   - `installer/`: Ready-to-flash scripts for Android GSIs, live ISO generation, kiosk lockdown, and stock launcher suppression.

---

## 2. Architecture & State Management Diagram

```mermaid
flowchart TD
    subgraph UI_Layer ["User Interface & Compositor"]
        App["App.tsx"]
        DSB["DeviceSwitcherBar"]
        DF["DeviceFrame"]
        WF["WindowFrame (Floating / Tiled)"]
        HS["HomeScreen & AppDrawer"]
        QS["QuickSettingsPanel & StatusBar"]
        NB["NavigationBar & Taskbar"]
        OA["OmniAssistant (Local AI)"]
        VK["VirtualKeyboard"]
    end

    subgraph Context_Layer ["Global React State Providers"]
        SC["SystemContext (Device Mode, Wallpapers, Settings, Notifications)"]
        WC["WindowContext (Instances, Stacking, Domains, Drag & Drop)"]
        SecC["SecurityContext (Permissions, Telemetry Poisoning, Seccomp)"]
        PC["PersonaContext (Adaptive Profiles, Theme, Font Scale)"]
        KC["KeyboardContext (Sovereign On-Screen Input)"]
    end

    subgraph Service_Engines ["Sovereign Core Engines"]
        MOH["multiOsHypervisor.ts (seL4, Whonix, Graphene, Alpine, Darwin)"]
        HSE["hardenedSecurityEngine.ts (Namespaces, cgroups, Landlock, Dummy Sensors)"]
        TPE["telemetryPoisoningEngine.ts (Dummy Noise, Spoofed Identifiers)"]
        APE["antiPredatoryEngine.ts (Dark Pattern Defusal, Subscription Killer)"]
        AME["antiMonopolyEngine.ts (microG Integration, FOSS Replacements)"]
        HD["hardwareDetector.ts (RAM/Core Performance Tiering)"]
        HBC["hardwareBridgeClient.ts (WebSocket / Native IPC)"]
        APKM["apkManager.ts & appRepositoryManager.ts (F-Droid, Izzy, Git)"]
        ADM["appleAppManager.ts (Darwin / CocoaTouch Translation)"]
    end

    subgraph Host_Native ["Native Host & Kernel Layer"]
        HBP["server/hardwareBridgePlugin.ts (Vite Dev Server Plugin / WS)"]
        WD["Waydroid AOSP Container & Host Linux Kernel"]
        SCR["installer/ & scripts/ (Bare-metal ISO & GSI Scripts)"]
    end

    App --> SC & SecC & PC & WC & KC
    DF --> HS & WF & QS & NB & OA & VK
    WF --> MOH & HSE
    SecC --> TPE & HSE & APE & AME
    SC --> HD & HBC
    HBC <--> HBP <--> WD
```

---

## 3. Comprehensive File Inventory

| Relative File Path | Language | Lines | Description & Responsibility |
| :--- | :--- | :--- | :--- |
"""
    for rel_path, lines in file_stats:
        desc = get_file_description(rel_path)
        _, ext = os.path.splitext(rel_path)
        lang = LANGUAGE_MAP.get(ext, "text")
        header += f"| `{rel_path}` | `{lang}` | {lines} | {desc} |\n"

    header += """
---

## 4. Complete Application Source Code

The complete source code for every file is provided below in full, categorized by subsystem. Each file block starts with the file path and line count.

"""
    return header

def get_file_description(path):
    # Mapping for quick human and AI file comprehension
    descriptions = {
        "package.json": "Project manifest, scripts (dev, build, preview), dependencies (React 18, Lucide, Tailwind).",
        "vite.config.ts": "Vite bundler configuration with React plugin and Hardware Bridge server plugin.",
        "tsconfig.json": "TypeScript compiler settings, JSX runtime configuration, and module resolution.",
        "tailwind.config.js": "Tailwind CSS theme configuration with custom animations, colors, and responsive breakpoints.",
        "postcss.config.js": "PostCSS setup with Tailwind CSS and Autoprefixer.",
        "index.html": "HTML shell entry point with viewport scaling, web manifest link, and root DOM node.",
        "src/main.tsx": "React root DOM bootstrap and application mounter.",
        "src/App.tsx": "Root application container assembling all context providers, DeviceFrame, and global overlays.",
        "src/styles/index.css": "Global styles, glassmorphism utilities, scrollbars, and Tailwind directives.",
        "src/types/system.ts": "Type definitions for device modes (phone/tablet/foldable/desktop), quick settings, and notifications.",
        "src/types/apps.ts": "Type definitions for AppId, AppMetadata, and WindowInstance.",
        "src/types/persona.ts": "Type definitions for UX personas (Standard, Power User, Minimalist, Elderly, Child Safe).",
        "src/constants/apps.ts": "Registry of built-in system applications, categories, icons, colors, and default domains.",
        "src/context/SystemContext.tsx": "Core state provider for device mode, orientation, notifications, wallpaper, and quick settings.",
        "src/context/WindowContext.tsx": "Window manager state: active windows, z-index stacking, tiling, resizing, and hypervisor domains.",
        "src/context/SecurityContext.tsx": "Security state: permissions, telemetry poisoning statistics, firewall toggles, and sensor dummying.",
        "src/context/PersonaContext.tsx": "Persona switching and dynamic adaptation engine provider.",
        "src/context/KeyboardContext.tsx": "Virtual on-screen keyboard visibility, input target management, and typing handlers.",
        "src/services/multiOsHypervisor.ts": "Qubes-style multi-OS hypervisor matrix defining 6 OS domains and cross-domain migration rules.",
        "src/services/hardenedSecurityEngine.ts": "Linux namespaces, cgroups v2, Seccomp-BPF filters, and zero-trust dummy sensor streams.",
        "src/services/telemetryPoisoningEngine.ts": "Surveillance SDK interceptor and high-entropy fake telemetry noise generator.",
        "src/services/antiPredatoryEngine.ts": "Dark pattern detection, urgency counter neutralizer, and 1-click subscription killer.",
        "src/services/antiMonopolyEngine.ts": "Anti-monopoly auditor replacing Big Tech proprietary services with microG and FOSS.",
        "src/services/hardwareDetector.ts": "Hardware benchmarking and runtime performance tiering (Low-end / Mid / High).",
        "src/services/hardwareBridgeClient.ts": "Client-side IPC client communicating with the native host hardware bridge server.",
        "src/services/appRepositoryManager.ts": "Decentralized FOSS app store catalog (F-Droid, IzzyOnDroid, Flathub, AltStore, Git).",
        "src/services/apkManager.ts": "Android APK manifest inspection and Waydroid container launcher.",
        "src/services/appleAppManager.ts": "Darwin / Mach-O binary emulation via Darling XNU and touchHLE CocoaTouch bridge.",
        "src/services/linuxSandboxEngine.ts": "Rootless Bubblewrap POSIX container sandboxing engine.",
        "src/services/personaEngine.ts": "Dynamic UI tuning engine applying contrast, font sizes, and layout density per persona.",
        "src/services/securityGuardrailsEngine.ts": "Real-time security auditing and guardrail policy enforcement.",
        "src/components/device/DeviceFrame.tsx": "Outer responsive chassis modeling Phone, Tablet, Foldable, or Desktop viewport.",
        "src/components/device/DeviceSwitcherBar.tsx": "Floating control pill to switch between Phone, Tablet, Foldable, Desktop, or Auto modes.",
        "src/components/window/WindowFrame.tsx": "Window chrome with minimize/maximize/close, resizing handles, and domain migration badge.",
        "src/components/launcher/HomeScreen.tsx": "Android-style home screen grid with widgets, app shortcuts, and dock.",
        "src/components/launcher/AppDrawer.tsx": "Searchable full application drawer listing all installed FOSS and sideloaded apps.",
        "src/components/launcher/RecentsView.tsx": "Multitasking overview screen displaying cards of active background applications.",
        "src/components/launcher/AtAGlanceWidget.tsx": "Contextual home screen widget showing clock, date, weather, and active security status.",
        "src/components/launcher/GoogleSearchPill.tsx": "De-Googled sovereign search bar powered by DuckDuckGo and SearXNG.",
        "src/components/navigation/NavigationBar.tsx": "Mobile bottom navigation bar supporting gesture navigation and 3-button modes.",
        "src/components/navigation/Taskbar.tsx": "Desktop mode bottom taskbar with app launcher, running app icons, and system tray.",
        "src/components/statusbar/StatusBar.tsx": "Top system status bar displaying clock, Wi-Fi, battery, cellular, and security shields.",
        "src/components/statusbar/QuickSettingsPanel.tsx": "Pull-down quick settings tiles (Wi-Fi, Bluetooth, Tor, Mic/Cam Killswitches, Brightness).",
        "src/components/security/SecurityDialogOverlay.tsx": "Modal dialogue prompting for permission grants with synthetic dummy feed options.",
        "src/components/persona/UniversalAdaptationWizard.tsx": "Interactive onboarding wizard guiding users through persona selection.",
        "src/components/common/VirtualKeyboard.tsx": "Self-contained on-screen sovereign keyboard with multi-layout support.",
        "src/components/common/AppIcon.tsx": "Dynamic app icon renderer with adaptive shapes, domain borders, and badges.",
        "src/components/common/ErrorBoundary.tsx": "React error boundary preventing OS crash from component errors.",
        "src/components/assistant/OmniAssistant.tsx": "Built-in local sovereign voice & text AI assistant with zero cloud dependencies.",
        "server/hardwareBridgePlugin.ts": "Vite dev server plugin providing REST & WebSocket endpoints for host Linux integration.",
        "scripts/test_os_functions.py": "Python test suite validating hypervisor domains, sandboxing, and telemetry poisoning.",
        "installer/build-iso.sh": "Bash script building a bootable live x86_64 ISO containing LibreDroid OS.",
        "installer/flash-hardened-gsi.sh": "Script to flash LibreDroid GSI image to Treble-compatible Android smartphones.",
        "installer/degoogle-android.sh": "Removes proprietary Google Play Services and telemetry packages from Android base.",
        "installer/freeze-stock-launcher.sh": "Disables stock vendor launchers to lock LibreDroid as default UI.",
        "installer/setup-kiosk-suppression.sh": "Configures kiosk suppression mode for dedicated terminal appliances.",
        "installer/restore-stock-os.sh": "Reversible recovery script restoring factory Android OS defaults.",
        "installer/waydroid-setup.sh": "Installs and initializes Waydroid container environment for native APK execution."
    }
    
    if path in descriptions:
        return descriptions[path]
    if "components/apps/" in path:
        app_name = os.path.basename(path).replace("App.tsx", "").replace(".tsx", "")
        return f"Application component for {app_name}."
    return f"Source implementation file for {os.path.basename(path)}."

def main():
    print(f"Scanning project root: {ROOT_DIR}")
    files = collect_files()
    print(f"Found {len(files)} files to export.")
    
    doc_header = generate_ai_documentation(files)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write(doc_header)
        
        for idx, rel_path in enumerate(files, 1):
            full_path = os.path.join(ROOT_DIR, rel_path)
            _, ext = os.path.splitext(rel_path)
            lang = LANGUAGE_MAP.get(ext, "")
            
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                    lines = content.count("\n") + (1 if content else 0)
            except Exception as e:
                content = f"// Error reading file: {e}"
                lines = 0
            
            desc = get_file_description(rel_path)
            
            out.write(f"\n### {idx}. File: `{rel_path}`\n\n")
            out.write(f"- **Path:** `{rel_path}`\n")
            out.write(f"- **Language:** `{lang}`\n")
            out.write(f"- **Lines of Code:** {lines}\n")
            out.write(f"- **Purpose:** {desc}\n\n")
            out.write(f"```{lang}\n")
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")
            out.write("```\n\n---\n")
            
    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"Successfully generated {OUTPUT_FILE}")
    print(f"File size: {size_mb:.2f} MB")

if __name__ == "__main__":
    main()
