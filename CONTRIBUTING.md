# Contributing to LibreDroid OS

Thank you for your interest in contributing to **LibreDroid OS**! LibreDroid is a sovereign, non-monopolistic universal operating environment designed to run seamlessly across smartphones, foldables, tablets, and desktops.

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🧭 Table of Contents
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)
- [Security Vulnerabilities](#security-vulnerabilities)

---

## 🛠️ How Can I Contribute?

You can contribute in many ways:
- **Core UI & Shell Development:** Enhancing multitasking, window management, launcher, and responsive form factors.
- **Security & Sandboxing:** Improving Qubes-style multi-OS domain isolation, seccomp filters, and Landlock LSM rules.
- **Hardware & HAL Integration:** Adding support for additional devices, sensors, audio HALs, and Treble GSIs.
- **Documentation & Localization:** Writing setup guides, translating system text, and improving install runbooks.
- **Bug Fixes & Optimizations:** Addressing open issues, improving responsiveness, and reducing bundle size.

---

## 🚀 Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm`
- Git

### Getting Started

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/Plaguedoctor-sudo/libredroid-os.git
   cd libredroid-os
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

4. **Verify Typechecking & Production Build**
   ```bash
   npm run build
   ```

---

## 🏛️ Project Architecture

- **`src/`**: Modern React 18 + TypeScript frontend shell
  - `src/components/apps/`: Native sovereign applications (Browser, Terminal, Files, Keystore, etc.)
  - `src/components/device/`: Dynamic device frame rendering (Phone, Tablet, Foldable, Desktop)
  - `src/components/window/`: Multi-window management, Qubes-style domain borders, split-screen, and tiling
  - `src/components/launcher/`: App drawer, folder grouping, dock, and home screen widgets
  - `src/services/`: Hardware HAL client, persistence, IPC system bus, and domain security
  - `src/context/`: Global system, window, and security domain state
- **`os/`**: Operating system images, live-build configs, seccomp filters, and ARM/Treble porting scripts
- **`installer/`**: Bare-metal safety guards, device flashers, and microG / Play Integrity setup scripts
- **`server/`**: Hardware bridge and IPC proxy plugins

---

## 📋 Pull Request Guidelines

1. **Create a Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Adhere to Code Style**
   - Write clear, typed TypeScript (avoid `any` where possible).
   - Use Tailwind CSS utility classes and Lucide React icons.
   - Maintain responsiveness across Phone, Tablet, and Desktop viewport modes.
3. **Verify Before Submitting**
   - Run `npm run build` and ensure zero TypeScript or Vite errors.
   - Test UI responsiveness using the Device Switcher Bar.
4. **Write Clear Commit Messages**
   - Follow Conventional Commits: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`.
5. **Open a Pull Request**
   - Describe the changes made, motivations, and attach screenshots or screen recordings if applicable.

---

## 🐛 Reporting Bugs & Requesting Features

- Please search existing [Issues](https://github.com/Plaguedoctor-sudo/libredroid-os/issues) before opening a new one.
- Use our [Issue Templates](.github/ISSUE_TEMPLATE/) when filing bug reports or feature proposals.
- Include your environment details (OS, browser/device, node version) and steps to reproduce.

---

## 🔒 Security Vulnerabilities

Security and user sovereignty are paramount to LibreDroid. If you discover a security vulnerability or exploit:
- **Do not disclose it publicly in an open GitHub issue.**
- Report the vulnerability privately via GitHub's Private Vulnerability Reporting or contact the maintainers directly.
- We appreciate your responsible disclosure and will work quickly to verify and patch valid findings.

---

## 📜 License

LibreDroid OS is licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).
