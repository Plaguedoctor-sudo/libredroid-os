# LibreDroid OS — Security Model & Threat Boundaries

LibreDroid OS is built on a defensive, defense-in-depth architecture adhering to strict zero-trust principles.

---

## 1. Threat Model & Adversary Classes

| Adversary Profile | Attack Vectors | LibreDroid OS Mitigations |
|---|---|---|
| **Big-Tech Ad Networks & Trackers** | Device fingerprinting, persistent advertising IDs, canvas hashing, background telemetry beacons. | • DNS sinkhole (`lrd-dnsd`)<br>• High-entropy synthetic data poisoning (`lrd-poisoner`)<br>• Constant dummy battery & device state reporting. |
| **Malicious or Untrusted Apps** | Sandbox escape, disk snooping, clipboard theft, credential exfiltration, peripheral hijacking. | • Linux namespaces (mount, pid, ipc, net, user)<br>• Landlock LSM path-restricted filesystem access<br>• Strict Seccomp-BPF syscall whitelist<br>• Zero-trust dummy sensor streams. |
| **Physical Tampering / Evil Maid** | Bootloader modification, partition tampering, offline root extraction. | • UEFI SecureBoot with enrolled user keys<br>• Cryptographic dm-verity root filesystem verification<br>• TPM 2.0 PCR-7 measured boot sealing<br>• LUKS2 Argon2id volume encryption. |
| **Network Surveillance / ISP Profiling** | SNI inspection, unencrypted DNS queries, IP geolocation tracking. | • Kernel namespace Tor routing (`tor-gw` + `anon-ws`)<br>• Default-deny nftables firewall with zero open ingress ports<br>• DNS over HTTPS (DoH) / DNS over TLS (DoT). |

---

## 2. Kernel Security & KSPP Invariants

The LibreDroid kernel builds enforce the Kernel Self Protection Project (KSPP) security configuration:
- `CONFIG_SECURITY_LANDLOCK=y`: Fine-grained unprivileged filesystem access control.
- `CONFIG_SECCOMP=y`: System call filtering to restrict attack surfaces.
- `CONFIG_DM_VERITY=y`: Block-level cryptographic verification of root storage partitions.
- `CONFIG_STACKPROTECTOR_STRONG=y`: GCC stack canary protection.
- `CONFIG_HARDENED_USERCOPY=y`: Bounds checking for user space memory copying.
- `CONFIG_PAGE_TABLE_ISOLATION=y`: Meltdown / KPTI CPU bug mitigations.

---

## 3. Peripheral & Sensor Isolation

1. **Camera**: Libcamera hardware shutter intercept with synthetic color bar/noise feed injection when physical camera access is restricted.
2. **Audio**: PulseAudio/PipeWire virtual null-sinks preventing unauthorized microphone eavesdropping.
3. **Sensors**: Hardware sensor daemon (`lrd-sensord`) providing synthetic zero-jitter gyroscope/accelerometer streams to prevent acoustic side-channel eavesdropping.

---

## 4. Live Image Session & Identity Constraints (v0.1)

1. **User Privilege Model:**
   The default `live` user belongs to `video`, `render`, `audio`, `netdev`, `input`, `tty`, `adm`, and `systemd-journal`. The inclusion of `adm` (reading `/var/log` including system logs) and `systemd-journal` is an intentional live-medium convenience allowing unprivileged session diagnostics and service inspection without requiring root privilege escalations.
2. **Ephemeral Browser Sandbox:**
   Chromium's profile lives entirely inside `/home/live` atop the volatile memory tmpfs overlay (`live-boot`). All cookies, cache, browser history, IndexedDB state, and local storage are zeroed and discarded at power-off by design. Persistent user storage must only occur via explicit encrypted FreeStack user vaults.
3. **Safe Mode Diagnostic Target:**
   Safe Mode passes `nomodeset systemd.unit=multi-user.target`. By design, this prevents Cage and Chromium from launching on `tty7`, leaving the console at `tty1` and `ttyS0` for kernel, firmware, and `lspci -k` diagnostic inspection.
4. **Boot Integrity & Secure Boot:**
   The v0.1 live ISO is generated via `grub-mkrescue` and is currently unsigned by Microsoft 3rd Party UEFI CA or custom MOK. Secure Boot must be disabled in target machine UEFI firmware settings prior to booting. Signed shim integration is planned for subsequent milestones.

