# FreeStack Sovereign Software Development Kit (SDK)
SPDX-License-Identifier: GPL-3.0-or-later

The FreeStack SDK provides developers with tools, sysroot definitions, and application templates to build sovereign, local-first applications and daemons.

## Architecture

- **`manifest.yaml`**: The SDK manifest defining ABI contracts, required compiler versions, and core system libraries.
- **`env.sh`**: Source this script (`source sdk/env.sh`) to export standard compiler flags, sysroot paths, and reproducibility flags (`SOURCE_DATE_EPOCH`).
- **`build-sdk.sh`**: Assembles the SDK sysroot containing `libfskeystore` headers, libraries, and pkg-config manifests.
- **`sysroot/`**: Staged sysroot containing `/usr/include` and `/usr/lib`.

## Application Templates (`templates/`)

1. **`c-adwaita/`**: C application using GTK4 and Libadwaita with responsive design, keyboard-only navigation, and AT-SPI2 accessibility.
2. **`python-gtk/`**: Sovereign Python client using PyGObject.
3. **`daemon-seccomp/`**: Background daemon with bubblewrap seccomp confinement and hardware keystore integration (`fskeystore.h`).
