# Kernel hardening

## Method

`config/kernel/fragment-x86_64.config` is applied on top of `x86_64_defconfig`
and is the only permitted source of hardening changes. `tests/kconfig.bats`
asserts every line landed. `checksec --kernel` runs in the gate.

## Deviations

| Option | State | Reason | Revisit |
|---|---|---|---|
| `CONFIG_CFI_CLANG` | **blocked** | Requires a Clang-built kernel; the current toolchain is gcc from `musl-cross-make`. Needs a kernel-only Clang/LLVM toolchain, which is a separate reproducibility surface. | Add `clang`/`llvm` to the manifest, build the kernel with it, verify reproducibility, then enable. Tracked in `docs/BUILD.md#blockers`. |
| `CONFIG_KFENCE` | off | ~2–5% throughput cost. Enable on debug builds only. | — |
| `CONFIG_COMPAT` / `CONFIG_IA32_EMULATION` | on | 32-bit userspace still exists in the wild. | Drop when the app set is 64-bit only. |
| `CONFIG_USERFAULTFD` | off | Only `postcopy` migration needs it; X200 has none. | Re-enable for live migration. |
| `CONFIG_HIBERNATION` | off | Suspend-to-RAM only; hibernate needs swap and adds attack surface. | — |
| `CONFIG_MAGIC_SYSRQ` | on | Recovery path on a laptop with no serial. Restricted via `sysctl kernel.sysrq=1`. | — |

## Until CFI lands

`CONFIG_RETPOLINE` + `X86_KERNEL_IBT` + `ZERO_CALL_USED_REGS` carry the control-flow
story. IBT requires CET-capable silicon; the X200 is not, so on that board it is
compiled in but inert. Document per board in `docs/HARDWARE.md`.

## Verifying

    make kconfig-audit     # kconfig-hardened-check against the fragment
    make kconfig-test      # bats, on a booted kernel
    checksec --kernel
