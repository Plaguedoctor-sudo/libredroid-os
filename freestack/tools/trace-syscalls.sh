#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Syscall Tracer & Seccomp Profile Generator (Task 2.6)
# Traces service execution and outputs suggested seccomp JSON allowlist

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 [--output <profile.json>] <command> [args...]"
    exit 1
fi

OUT_FILE=""
if [ "$1" == "--output" ]; then
    OUT_FILE="$2"
    shift 2
fi

TMP_TRACE=$(mktemp /tmp/fs-trace.XXXXXX)
trap 'rm -f "$TMP_TRACE"' EXIT

echo "Tracing syscalls for: $*"
if command -v strace >/dev/null 2>&1; then
    strace -f -c -o "$TMP_TRACE" "$@" || true
    echo "=== Syscall Summary ==="
    cat "$TMP_TRACE"
    
    SYSCALLS=$(awk '/^[ -]+$/ {flag=1; next} flag && NF>0 && !/total/ {print $NF}' "$TMP_TRACE" | sort -u)
else
    echo "Note: strace not available in path; generating baseline list"
    SYSCALLS="read write openat close fstat mmap mprotect munmap brk rt_sigaction rt_sigprocmask ioctl prctl exit_group"
fi

if [ -n "$OUT_FILE" ]; then
    cat <<EOF > "$OUT_FILE"
{
  "default_action": "SCMP_ACT_ERRNO",
  "arch_map": ["SCMP_ARCH_X86_64", "SCMP_ARCH_AARCH64"],
  "syscalls": [
$(for sc in $SYSCALLS; do echo "    {\"name\": \"$sc\", \"action\": \"SCMP_ACT_ALLOW\"},"; done | sed '$ s/,$//')
  ]
}
EOF
    echo "Generated seccomp allowlist profile in $OUT_FILE"
fi
