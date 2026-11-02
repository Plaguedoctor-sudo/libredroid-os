# LibreDroid OS — Termux "parasite" install (I1)

Runs the full LibreDroid shell + bridge on an **unmodified, unlocked-bootloader-free,
non-rooted** Android device. Nothing outside Termux is touched except installing APKs.

    curl-free: everything is in this tree.

## What gets installed
  ~/.lrd/app          shell (dist/) + bridge (server.js) + backends
  ~/.lrd/etc/lrd.env  config
  ~/.lrd/state        sqlite/json state, icon cache, install queue
  ~/.lrd/domains      proot-distro roots: work, dispos, vault(gocryptfs)
  ~/storage/shared/LibreDroid   user files + nightly backups (survives Termux reinstall)
  $PREFIX/var/service/{lrd,tor,watchdog}   runit services (autostart, respawn)

## Guarantees
  * binds 127.0.0.1 only  ->  secure context (camera/WebGPU work), no LAN exposure
  * never writes outside Termux home + /sdcard/LibreDroid
  * uninstall.sh removes everything, zero residue
  * survives reboot (Termux:Boot), survives app kill (wake lock + runit)
  * survives Termux uninstall (backups on /sdcard)

## Requirements
  Android 8+ , arm64 or x86_64, ~4 GB free (2 GB if you skip local models)
  Apps: Termux (F-Droid build, NOT Play), Termux:API, Termux:Boot

## Install
  # on the desktop, once:
  ./build.sh && tar czf lrd-i1.tgz -C . os/termux dist server.js package.json
  adb push lrd-i1.tgz /sdcard/
  # on the device, in Termux:
  termux-setup-storage
  cd ~ && tar xzf /sdcard/lrd-i1.tgz && cd os/termux
  ./install.sh

## Verify
  lrd-termux-doctor.sh          # must be all green
  lrd-fullscreen.sh             # opens the shell as a PWA

## Recover
  lrd-recover.sh                # server dead / white screen / boot loop
  lrd-backup.sh --restore <tar>

## Uninstall
  ./uninstall.sh                # add --purge-shared to nuke /sdcard/LibreDroid too

## Limits (be honest with yourself)
  * Tor is app-level (SOCKS5h + DNSPort), not kernel REDIRECT. A native app that
    ignores proxy env leaks. `lrd-termux-doctor.sh` proves the *managed* path is Tor.
  * No netns -> no "root compromise cannot see the host IP". proot is a lie about
    namespaces and it always will be.
  * `pm install` needs no root on most devices; on locked-down OEM ROMs it falls
    back to the system installer UI (one extra tap). Probe decides.
  * Waydroid does not run here. The host Android *is* the android domain.
