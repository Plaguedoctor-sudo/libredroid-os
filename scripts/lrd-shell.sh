#!/usr/bin/env bash
set -euo pipefail
# Quick 1-click interactive shell into LibreDroid OS on the connected tablet
export ANDROID_USER_HOME="/home/nitin/fkgugal/.adb"
export ANDROID_SDK_HOME="/home/nitin/fkgugal/.adb"
export HOME="/home/nitin/fkgugal/.adb"
adb shell -t "su -c 'chroot /data/lrd_root /usr/bin/env -i HOME=/root PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin TERM=xterm-256color /bin/bash -l'"
