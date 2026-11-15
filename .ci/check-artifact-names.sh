#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
set -euo pipefail
fail=0
if git grep -n 'libredroid-universal' -- ':!CHANGELOG.md' ':!*.lock' ':!.ci/check-artifact-names.sh'; then
  echo "FAIL: old 'universal' artifact name" >&2; fail=1
fi
if git grep -nE 'libredroid-(amd64|universal)' -- '*.sh' '*.md' ':!CHANGELOG.md' ':!.ci/check-artifact-names.sh'; then
  echo "FAIL: wrong arch token" >&2; fail=1
fi
if ! git grep -q 'lib/artifact-name.sh' -- os/build/05-iso.sh os/build/06-qemu-test.sh; then
  echo "FAIL: scripts do not source artifact-name.sh" >&2; fail=1
fi
exit "$fail"
