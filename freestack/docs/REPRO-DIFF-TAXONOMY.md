# FreeStack Reproducibility Diff Taxonomy (P1 – P4)

**Document Reference**: FreeStack Work Package W7 (Tasks 7.6, 7.7)  
**Standard**: Reproducible Builds Bit-for-Bit Verification Specification  
**Goal**: Zero variance between independent builders across organizations.

---

## 1. Executive Summary

FreeStack non-negotiable **R7** dictates:
> *Reproducible builds, bit for bit. Non-reproducible components carry a repro_exception and are tracked.*

When an independent builder produces an artifact that does not match the official or threshold-signed build hash, the difference must be triaged according to this **P1–P4 Reproducibility Discrepancy Taxonomy**.

---

## 2. Taxonomy Classes & Remediation Matrix

| Class | Severity | Root Cause Category | Diagnostic Pattern | Required Architectural Remediation |
|---|---|---|---|---|
| **P1** | Low | Archive / Packaging Layout | Tar/Cpio file ordering differences, archive padding bytes, unstable zip directory record offsets | Use `tar --sort=name --owner=root:0 --group=root:0 --numeric-owner --mtime="@${SOURCE_DATE_EPOCH}"`, run `strip-nondeterminism` on `.a`/`.tar`/`.cpio`, mount build outputs on `disorderfs` during verification. |
| **P2** | Medium | Embedded Timestamps & Epochs | `__DATE__`, `__TIME__`, build-system time injection, filesystem timestamps in object headers | Set and export `SOURCE_DATE_EPOCH`; pass `-Werror=date-time` to GCC/Clang; patch upstream build scripts injecting `date`, `uname -v`, or `git log` timestamps into generated C/Rust headers. |
| **P3** | High | Environment & Path Leakage | Leaked `/home/...` or `/build/...` paths in DWARF debug symbols or string tables; varying `umask` (0022 vs 0002); varying UID/GID | Inject `-ffile-prefix-map=${PWD}=.` and `-fdebug-prefix-map=${PWD}=.`; compile inside standardized hermetic containers (`bwrap --unshare-all`); standardize `umask 0022` and user ID 1000 in build runner. |
| **P4** | Critical | Non-Deterministic Codegen / Bytecode | Compiler symbol reordering, unstable hash-map iteration in AST walkers, uninitialized struct padding in compilers, ASLR/random seed variation | Inject `-frandom-seed=freestack` in GCC; disable unordered parallelism in LTO (`-flto-partition=none`); audit LLVM/Rustc codegen passes for hash seed non-determinism (`RUSTFLAGS="-C metadata=freestack"`). |

---

## 3. Triage & Gate Workflow

1. **Detection**:
   The independent rebuild suite (`tests/repro-rebuild.sh`) executes on builder instances in divergent environments (different timezones, umasks, paths, kernel versions).
2. **Analysis**:
   Artifacts are compared via `diffoscope` or the automated classifier:
   ```bash
   python3 tools/diff-classifier.py --diffoscope-json out/diff.json --out dist/diff-report.json
   ```
3. **Classification & Action**:
   - Any **P4** defect halts release candidate tagging immediately.
   - **P2/P3** defects require a patch to the component's build flags or recipe in `manifest/freestack.manifest.yaml`.
   - **P1** defects require a packaging wrapper update.
4. **Resolution**:
   Once patched, `make gate` must report `zero_diffs_confirmed: true`.
