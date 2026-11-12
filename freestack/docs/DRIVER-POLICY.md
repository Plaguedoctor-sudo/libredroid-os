# Driver policy

ADR 0002. The privileged core is an **allowlist**. A driver is in-kernel only
with a row here and a reason. Everything else runs in a `crosvm` microVM over
virtio, or is absent.

## In-kernel, permitted

| Driver | Reason | Isolation exit criterion |
|---|---|---|
| `virtio_blk`, `nvme` | Block fast path; VM exit cost is measurable | Virtio latency within 5% of native over 10k IOPS |
| `virtio_net`, `e1000e` | Net core; needed before the first driver VM exists | Same, on a 1 Gbit/s line |
| `xhci_hcd` | Boot from USB is required for rescue | USB survives a VM restart without re-enumeration |
| `i915` | X200 display; no virtio GPU on this board | Virtio-gpu reaches parity on this panel |
| `atkbd`, `psmouse`, `libps2` | Keyboard is the recovery path | Never isolated — a dead input VM is unrecoverable |
| `acpi`, `thermal`, `cpufreq` | Power management is core | Not isolatable meaningfully |
| `dm_crypt`, `dm_verity`, `fscrypt`, `ext4`, `f2fs`, `erofs` | Storage trust chain | Not isolatable |

## Out of process (target state)

`iwlwifi`, `ath9k`, `uvcvideo`, `snd_hda_intel`, `btusb`, `rtsx_pci`,
`thinkpad_acpi` — all peripheral, all vendor-maintained, all restartable.

## Forbidden without an ADR

- Any driver over 20k LoC
- Any driver from a vendor with no upstream presence
- Any driver that pulls a firmware blob larger than 1 MiB into core

## Enforcement

`audit-kernel-config.sh` fails on an in-kernel driver absent from this table.
