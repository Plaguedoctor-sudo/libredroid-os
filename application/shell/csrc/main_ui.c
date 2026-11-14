#include "sap_ui.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <time.h>
#include <unistd.h>

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

static long get_peak_rss_kb(void) {
    FILE* f = fopen("/proc/self/status", "r");
    if (!f) return 0;
    char line[256];
    long rss_kb = 0;
    while (fgets(line, sizeof(line), f)) {
        if (strncmp(line, "VmHWM:", 6) == 0) {
            sscanf(line + 6, "%ld", &rss_kb);
            break;
        }
    }
    fclose(f);
    return rss_kb;
}

int main(void) {
    printf("=================================================================\n");
    printf("Sovereign Application Platform — Native Sovereign UI Client\n");
    printf("=================================================================\n");

    // 1. Initialize Converged Wayland Compositor (1920x1080 @ 120Hz)
    SapCompositor comp;
    int ret = sap_compositor_init(&comp, "wayland-sap-ui", 1920, 1080, 120);
    assert(ret == 0);

    // 2. Initialize Native Sovereign Window Component
    printf("--> 1. Initializing Sovereign Window Component...\n");
    SapWindow win;
    ret = sap_ui_window_init(&win, "org.sovereign.dashboard", "Sovereign Control", 1920, 1080);
    assert(ret == 0);
    assert(win.canvas.pixels != NULL);
    printf("    Window App ID:   %s\n", win.app_id);
    printf("    Canvas Geometry: %ux%u (Stride: %u pixels, RGBA32)\n",
           win.width, win.height, win.canvas.stride);
    printf("    [PASS] Sovereign Window Initialized!\n");

    // 3. Render 60 Frames in Desktop Docked Posture (Dual-Column Convergence)
    printf("\n--> 2. Rendering 60 Frames in Desktop Dual-Column Convergence (120Hz Target)...\n");
    sap_compositor_set_form_factor(&comp, FORM_FACTOR_DESKTOP_DOCKED, 0.0f);

    double t0 = get_time_ms();
    for (int i = 0; i < 60; i++) {
        ret = sap_ui_window_render_dashboard(&win,
            "SmolLM2-360M INT4 | 6.28 ms/token | 287.9 MB (AVX2/NEON)",
            "Slot A ACTIVE | SHA-256 Merkle Root Verified | RSA-4096 Signed",
            "VoLTE IMS Active (-85 dBm) | UCM2 Audio Ducking: -18dB | E911 Ready",
            "Sony IMX258 (1080p@30) | Privacy Shutter: ACTIVE | 0 Photons Leaked",
            "Waydroid isolated (netns: lrd-android0) | FEX-Emu ARM64 JIT | GPU Thunked");
        assert(ret == 0);

        ret = sap_ui_window_commit(&win, &comp);
        assert(ret == 0);
    }
    double elapsed_ms = get_time_ms() - t0;
    double avg_render_ms = elapsed_ms / 60.0;
    printf("    Frames Committed: 60 frames rendered in %.2f ms (%.2f ms/frame)\n",
           elapsed_ms, avg_render_ms);
    printf("    120Hz Budget:     8.33 ms (Actual: %.2f ms -> %.1fx faster than budget!)\n",
           avg_render_ms, 8.33 / (avg_render_ms > 0.01 ? avg_render_ms : 0.01));
    assert(avg_render_ms < 8.33); // Strict 120Hz VRR latency assertion
    printf("    [PASS] Desktop Posture 120Hz Rendering Verified!\n");

    // 4. Test Dynamic Posture Convergence: Switch to Handset (720x1440 Single-Column)
    printf("\n--> 3. Testing Dynamic Posture Convergence (Handset Reachability Mode)...\n");
    sap_compositor_set_form_factor(&comp, FORM_FACTOR_HANDSET, 0.0f);
    ret = sap_ui_window_resize(&win, 720, 1440);
    assert(ret == 0);
    assert(win.width == 720 && win.height == 1440);

    t0 = get_time_ms();
    for (int i = 0; i < 30; i++) {
        ret = sap_ui_window_render_dashboard(&win, NULL, NULL, NULL, NULL, NULL);
        assert(ret == 0);
        ret = sap_ui_window_commit(&win, &comp);
        assert(ret == 0);
    }
    elapsed_ms = get_time_ms() - t0;
    avg_render_ms = elapsed_ms / 30.0;
    printf("    Handset Geometry: 720x1440 Single-Column Layout\n");
    printf("    Handset Pacing:   30 frames in %.2f ms (%.2f ms/frame)\n", elapsed_ms, avg_render_ms);
    assert(avg_render_ms < 8.33);
    printf("    [PASS] Dynamic Handset Posture Convergence Verified!\n");

    // 5. Memory Telemetry & Binary Verification
    sap_ui_window_destroy(&win);
    sap_compositor_destroy(&comp);

    long peak_rss = get_peak_rss_kb();
    printf("\n--> Memory Telemetry: Peak RSS = %ld KB (%.2f MB)\n", peak_rss, peak_rss / 1024.0);
    assert(peak_rss < 32768); // Strict mobile memory ceiling (<32MB)

    printf("\n=================================================================\n");
    printf("ALL NATIVE SOVEREIGN UI CLIENT TESTS PASSED (100%% GREEN)!\n");
    printf("=================================================================\n");

    return 0;
}
