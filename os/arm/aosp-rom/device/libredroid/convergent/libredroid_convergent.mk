# LibreDroid Sovereign Mobile OS Make Definition (GrapheneOS/CalyxOS Model)
$(call inherit-product, $(SRC_TARGET_DIR)/product/core_64_bit.mk)
$(call inherit-product, $(SRC_TARGET_DIR)/product/generic_system.mk)

PRODUCT_NAME := libredroid_convergent
PRODUCT_DEVICE := generic_arm64
PRODUCT_BRAND := LibreDroid
PRODUCT_MODEL := LibreDroid Sovereign Mobile
PRODUCT_MANUFACTURER := LibreDroid

# Packages & System Customization
PRODUCT_PACKAGES += \
    LibreDroidLauncher \
    GmsCore \
    GsfProxy \
    FakeStore \
    FDroid \
    FDroidPrivilegedExtension

# Zero-Google Telemetry & Network Namespace Isolation
PRODUCT_SYSTEM_DEFAULT_PROPERTIES += \
    ro.libredroid.version=1.0.0-sovereign \
    ro.libredroid.isolation=domains_netns \
    ro.control_privapp_permissions=enforce \
    persist.sys.phh.no_gapps=true \
    ro.telephony.default_network=9 \
    persist.sys.usb.config=mtp
