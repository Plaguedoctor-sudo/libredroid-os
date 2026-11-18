# LibreMobile OS — Governance, Licensing & Support Policy

**Specification:** LibreDroid System Design v0.1 §16  
**License:** GPL-3.0-or-later for OS code; GPL-2.0-only for Linux kernel & Halium tree

---

## 1. Principles of Software Sovereignty

1. **Zero Proprietary Vendor Blobs in Distributed Images:**
   - Official LibreMobile OS release images (`boot`, `vendor_boot`, `rootfs`) are 100% Free Software under the GNU General Public License.
   - Any proprietary vendor HALs or firmware must remain on the device's stock `vendor` partition and are dynamically enumerated at runtime via Android VINTF and libhybris.
   - LibreMobile binaries will never redistribute proprietary vendor firmware blobs.

2. **Source Code Availability & Reproducibility:**
   - All kernel and Halium modifications are tracked and published under GPL-2.
   - Rootfs build trees are pinned to Debian snapshot archives with fixed timestamps (`SOURCE_DATE_EPOCH`) to ensure deterministic, bit-for-bit reproducibility.

---

## 2. Device Support Tiers & Governance

Support is structured around two distinct tiers:

### Tier 1: Core-Maintained Platforms
- Hardware maintained and continuously verified by the core development team.
- Requirements:
  - 100% passing automated foundation test suites.
  - Bit-for-bit deterministic boot pipeline.
  - MediaTek MT6789 BROM or Qualcomm EDL emergency unbrick harness in-tree.
  - Maintained profiles (<120 lines TOML) and tested display geometry.
- Current Tier 1 Devices:
  1. **Volla Phone X23 (`vidofnir`)** — MediaTek Helio G99 (MT6789), 720×1560, scale=2.0, VNDK 31, Halium 12
  2. **OnePlus Pad Go (`OP5DA6L1`)** — MediaTek Helio G99 (MT6789), 1720×2408, scale=1.0, VNDK 33, Halium 13

### Tier 2: Community Profiles
- Devices maintained by community developers via profile submissions (`/usr/share/profiles/<codename>.toml`).
- Requirements:
  - Treble-compliant (Android 9–14, VNDK 28–34).
  - Unlockable bootloader.
  - Publicly published Halium kernel tree or boot artifact.
- Governance:
  - Community maintainers receive pull-request review and testing feedback.
  - Unmaintained profiles without active maintainers for 6 months transition to Tier 3 (Deprecated) and are archived.

---

## 3. Trademark & Distribution Policy

- **Official Builds:** The names "LibreMobile", "LibreMobile OS", and "LibreDroid" may only be applied to unmodified official images built from the master repository.
- **Derivatives:** Third parties and downstream distributions may freely fork, modify, and build custom images under GPL-3, provided they do not use official trademark logos or represent modified builds as official releases.
