# Artifact naming

One scheme. Every artifact. No exceptions.

| Kind | Pattern | Example |
|---|---|---|
| Live / installer image | `libredroid-<arch>-<version>.iso` | `libredroid-x86_64-0.1.0.iso` |
| Device image | `libredroid-<device-slug>-<version>.img` | `libredroid-pinephone-0.1.0.img` |
| Rootfs tarball | `libredroid-rootfs-<arch>-<version>.tar.zst` | — |

Rules:
- `<arch>` is `x86_64` or `arm64`. Never `universal`, never `amd64`.
- `<device-slug>` comes from `devices/<slug>.yaml`, lowercased, hyphenated.
- `<version>` comes from `VERSION`. No `-dev`, `-rc1`, or `latest` in the filename.
- Volume label is always `LIBREDROID`, independent of the filename.
- A device image is only published once it has booted on that device.
