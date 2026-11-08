# BoardConfig for LibreDroid Convergent Target
TARGET_ARCH := arm64
TARGET_ARCH_VARIANT := armv8-a
TARGET_CPU_ABI := arm64-v8a
TARGET_CPU_VARIANT := generic

TARGET_2ND_ARCH := arm
TARGET_2ND_ARCH_VARIANT := armv7-a-neon
TARGET_2ND_CPU_ABI := armeabi-v7a
TARGET_2ND_CPU_VARIANT := generic

# Kernel & Partitions
BOARD_USES_GENERIC_KERNEL_IMAGE := true
TARGET_NO_KERNEL := false
BOARD_SYSTEMIMAGE_PARTITION_TYPE := ext4
BOARD_USERDATAIMAGE_PARTITION_TYPE := f2fs

# Sepolicy & Sandboxing
BOARD_VENDOR_SEPOLICY_DIRS += os/arm/aosp-rom/sepolicy
