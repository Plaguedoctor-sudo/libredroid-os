LibreDroid OS — ARM64 Treble System Image
==========================================
Architecture: aarch64 (ARM64-v8a)
Partition Target: /system (A/B dynamic or standard)
Untouched Partitions:
  - /boot (Snapdragon / MediaTek Kernel) [PRESERVED]
  - /vendor (Camera, VoLTE Modem, Display HAL) [PRESERVED]
  - /odm & /product (Vendor Blobs) [PRESERVED]

Flashing Instructions:
1. Boot phone into fastboot mode:
   adb reboot bootloader
2. Flash with partition protection:
   ./installer/flash-treble-device.sh
==========================================
