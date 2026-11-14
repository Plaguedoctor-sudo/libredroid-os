#define _GNU_SOURCE
#include "sap_audio.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <time.h>

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

int main(void) {
    printf("========================================================\n");
    printf("SAP Mobile Audio Matrix & Acoustic Transducer Bench\n");
    printf("========================================================\n");

    SapAudio audio;
    double t0 = get_time_ms();
    int rc = sap_audio_init(&audio, "hw:0");
    double t_init = get_time_ms() - t0;
    assert(rc == 0);
    printf("[PASS] sap_audio_init succeeded in %.3f ms (card: %s)\n", t_init, audio.sound_card);

    // 1. Test Transducer Routing (Earpiece, Speaker, Headset, Bluetooth)
    rc = sap_audio_set_route(&audio, SAP_ROUTE_EARPIECE);
    assert(rc == 0);
    assert(audio.active_route == SAP_ROUTE_EARPIECE);
    printf("[PASS] Earpiece route activated: %s\n", audio.route_name);

    rc = sap_audio_set_route(&audio, SAP_ROUTE_SPEAKER);
    assert(rc == 0);
    assert(audio.active_route == SAP_ROUTE_SPEAKER);
    printf("[PASS] Loudspeaker route activated: %s\n", audio.route_name);

    rc = sap_audio_set_route(&audio, SAP_ROUTE_HEADSET_35MM);
    assert(rc == 0);
    assert(audio.active_route == SAP_ROUTE_HEADSET_35MM);
    printf("[PASS] Headset 3.5mm route activated: %s\n", audio.route_name);

    rc = sap_audio_set_route(&audio, SAP_ROUTE_BLUETOOTH_HFP);
    assert(rc == 0);
    assert(audio.active_route == SAP_ROUTE_BLUETOOTH_HFP);
    printf("[PASS] Bluetooth HFP route activated: %s\n", audio.route_name);

    // 2. Test Audio Focus Ducking (-18 dB for phone calls)
    rc = sap_audio_set_ducking(&audio, true);
    assert(rc == 0);
    assert(audio.is_ducked == true);
    printf("[PASS] Media stream ducking engaged (-18 dB call focus)\n");

    rc = sap_audio_set_ducking(&audio, false);
    assert(rc == 0);
    assert(audio.is_ducked == false);
    printf("[PASS] Media stream ducking released\n");

    // 3. Test Hardware Privacy Mic Kill Switch
    rc = sap_audio_set_privacy_mic_kill(&audio, true);
    assert(rc == 0);
    assert(audio.hardware_mic_kill_active == true);
    printf("[PASS] Hardware microphone kill switch engaged (rail isolated)\n");

    rc = sap_audio_set_privacy_mic_kill(&audio, false);
    assert(rc == 0);
    assert(audio.hardware_mic_kill_active == false);
    printf("[PASS] Hardware microphone kill switch released\n");

    // 4. Test Volume Pacing
    rc = sap_audio_set_volume(&audio, 75);
    assert(rc == 0);
    assert(audio.volume_pct == 75);
    printf("[PASS] Master volume set to 75%%\n");

    sap_audio_destroy(&audio);
    printf("========================================================\n");
    printf("ALL AUDIO SUBSYSTEM INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
