#include "../android/csrc/sap_compat_android.h"
#include "../translation/csrc/sap_translation.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

int main(void) {
    printf("=================================================================\n");
    printf("Sovereign Application Platform — Android Subsystem Compatibility\n");
    printf("=================================================================\n");

    // 1. Test Android LXC Container Isolation & Lifecycle
    printf("--> 1. Initializing Isolated Android Container Domain...\n");
    SapAndroidContainer container;
    int ret = sap_android_init(&container, NULL);
    assert(ret == 0);
    assert(container.state == ANDROID_STATE_STOPPED);

    ret = sap_android_start(&container);
    assert(ret == 0);
    assert(container.state == ANDROID_STATE_RUNNING);
    assert(container.container_pid > 0);

    printf("    Container:       %s (PID: %d)\n", container.container_name, container.container_pid);
    printf("    Network NS:      %s (Isolated veth pair: %s <-> %s)\n",
           container.netns_name, container.host_veth, container.guest_veth);
    printf("    IP Allocation:   Container: %s | Gateway: %s\n",
           container.container_ip, container.gateway_ip);
    printf("    Wayland Socket:  %s\n", container.wayland_socket);
    printf("    DRM GPU Node:    %s\n", container.drm_render_node);
    printf("    [PASS] Isolated Android Container Domain Initialized!\n");

    // 2. Test Synthetic Privacy Sensor Spoofing
    printf("\n--> 2. Testing Zero-Trust Synthetic Sensor Spoofing...\n");
    assert(container.sensors.privacy_spoofing_active == true);
    assert(strcmp(container.sensors.imei, "000000000000000") == 0);
    assert(strcmp(container.sensors.mac_address, "02:00:00:00:00:00") == 0);
    assert(container.sensors.gps_accuracy_meters > 1000000.0);

    printf("    Quarantine IMEI: %s (Carrier/Ad tracking blocked)\n", container.sensors.imei);
    printf("    Quarantine MAC:  %s (WiFi tracking blocked)\n", container.sensors.mac_address);
    printf("    Quarantine GPS:  (%.1f, %.1f) with %.1fm uncertainty (Real location zeroed)\n",
           container.sensors.gps_latitude, container.sensors.gps_longitude,
           container.sensors.gps_accuracy_meters);
    printf("    [PASS] Synthetic Sensor Spoofing Verified!\n");

    // 3. Test Binary Translation Engine (FEX-Emu / Native ARM64)
    printf("\n--> 3. Testing Binary Translation Subsystem (FEX-Emu)...\n");
    SapTranslation trans;
    ret = sap_translation_init(&trans);
    assert(ret == 0);

    ret = sap_translation_configure_binfmt(&trans);
    assert(ret == 0);

    printf("    Host Silicon:    %s\n", trans.host_arch);
    if (trans.translation_required) {
        assert(trans.mode == TRANS_MODE_FEX_EMU);
        assert(trans.binfmt_registered == true);
        printf("    Translation:     FEX-Emu ARM64->x86_64 JIT Active (binfmt_misc registered)\n");
    } else {
        assert(trans.mode == TRANS_MODE_NATIVE_ARM64);
        printf("    Execution:       Native ARM64 direct execution (Zero translation overhead)\n");
    }

    assert(trans.vulkan_thunk_active == true);
    assert(trans.gles_thunk_active == true);
    assert(trans.wayland_thunk_active == true);
    printf("    Hardware Thunks: Vulkan=YES, GLES=YES, Wayland=YES (Host GPU Passthrough)\n");
    printf("    [PASS] Binary Translation & Thunking Verified!\n");

    // 4. Test Container Teardown
    printf("\n--> 4. Testing Graceful Container Teardown...\n");
    ret = sap_android_stop(&container);
    assert(ret == 0);
    assert(container.state == ANDROID_STATE_STOPPED);
    printf("    Container State: Successfully returned to STOPPED\n");
    printf("    [PASS] Container Lifecycle Teardown Verified!\n");

    printf("\n=================================================================\n");
    printf("ALL ANDROID COMPATIBILITY & TRANSLATION TESTS PASSED (100%% GREEN)!\n");
    printf("=================================================================\n");

    return 0;
}
