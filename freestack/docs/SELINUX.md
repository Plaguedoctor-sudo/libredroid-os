# FreeStack SELinux Mandatory Access Control Policy

FreeStack implements strict domain separation with zero blanket `allow` rules, per-service confinement domains, and strict hardware access barriers.

---

## 1. Process Domains & Confinement Tiers

| Process Domain | Binary / Unit | Description & Boundaries |
|---|---|---|
| `fs_init_t` | `/bin/dinit` | System supervisor; manages service lifecycles; transitions to confined domains. |
| `fs_lrdd_t` | `/usr/libexec/fs-lrdd` | Hardware coordinator & IPC broker. Reaches Unix domain sockets only. |
| `fs_shell_t` | `/bin/wayland-shell` | Compositor; has `chr_file` access to DRM/KMS and evdev. No network capability. |
| `fs_display_t` | `/usr/libexec/fs-display` | Display server daemon; isolated from raw disk and network. |
| `fs_network_t` | `/sbin/nft`, `unbound`, `chrony` | Confined networking daemon; holds `netlink_route_socket` and UDP/TCP rights. Cannot touch storage vaults. |
| `fs_modem_t` | `/usr/libexec/fs-modemd` | Cellular baseband manager; isolated in network namespace. |
| `fs_keystore_t` | `/usr/bin/fskeystored` | Hardware TPM2 keystore service. Reads strictly sealed storage tokens. No network access. |
| `fs_vault_t` | `/usr/libexec/fs-vault` | Air-gapped cryptographic secret vault. Zero socket, zero network, zero ambient IPC. |
| `fs_update_t` | `/usr/bin/fsctl-updated` | A/B update verification daemon. Communicates via Cap'n Proto `update.capnp`. |
| `fs_app_t` | User applications | Confined application sandboxes; restricted to application directories and Wayland sockets. |

---

## 2. Invariant Neverallow Rules

FreeStack enforces non-negotiable architectural invariants via [config/selinux/neverallow.te](file:///home/nitin/fkgugal/freestack/config/selinux/neverallow.te):

1. **Vault & Keystore Isolation:**
   ```selinux
   neverallow { fs_vault_t fs_keystore_t } *:{ tcp_socket udp_socket rawip_socket } *;
   ```
2. **Application Network Default-Deny:**
   ```selinux
   neverallow fs_app_t *:{ tcp_socket udp_socket } *; # unless explicit net capability handle held
   ```
3. **Block Device Write Barriers:**
   ```selinux
   neverallow { domain -fs_init_t -fs_update_t } blk_file:chr_file write;
   ```

---

## 3. Transition to Capability Handles (ADR 0001)

As capability handles replace filesystem paths, ambient SELinux domain rights will be monotonically narrowed. Processes receive capability descriptors over Cap'n Proto IPC instead of ambient file domain permissions.
