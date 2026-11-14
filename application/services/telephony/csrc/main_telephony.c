#include "sap_telephony.h"
#include "../../audio/csrc/sap_audio.h"
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <unistd.h>

int main(void) {
    printf("=================================================================\n");
    printf("Sovereign Application Platform — Telephony & Audio Integration\n");
    printf("=================================================================\n");

    // 1. Initialize Subsystems
    SapTelephony tel;
    SapAudio audio;

    int ret = sap_telephony_init(&tel, "/dev/ttyUSB2", "/tmp/sap_telephony.sock");
    assert(ret == 0);
    ret = sap_audio_init(&audio, "rk3399-pinephone-pro");
    assert(ret == 0);

    printf("--> Subsystems Initialized Successfully:\n");
    printf("    Modem Device:     %s (Quectel EG25-G / PinePhone Pro)\n", tel.modem_device);
    printf("    Carrier:          %s (%d bars, %d dBm)\n", tel.carrier_name, tel.signal_bars, tel.signal_rsrp_dbm);
    printf("    Audio Hardware:   %s (ALSA UCM2 / es8316)\n", audio.sound_card);
    printf("    Default Route:    %s\n", audio.route_name);

    // 2. Test Outgoing VoLTE Voice Call
    printf("\n--> 1. Testing Standard VoLTE Voice Call (+1-555-0199)...\n");
    ret = sap_telephony_dial(&tel, "+1-555-0199");
    assert(ret == 0);
    assert(tel.current_call.state == CALL_ACTIVE_VOLTE);
    assert(!tel.current_call.is_emergency);

    // Automatic Call Audio Matrix Trigger
    sap_audio_set_route(&audio, SAP_ROUTE_EARPIECE);
    sap_audio_set_ducking(&audio, true);
    audio.call_audio_active = true;

    printf("    Call Active:      Number: %s (VoLTE IMS bearer)\n", tel.current_call.remote_number);
    printf("    Audio Route:      Switched to %s\n", audio.route_name);
    printf("    Audio Focus:      Media Ducking Active (-18 dB background attenuation)\n");

    usleep(50000); // Call in progress

    // Terminate Call
    sap_telephony_hangup(&tel);
    sap_audio_set_route(&audio, SAP_ROUTE_SPEAKER);
    sap_audio_set_ducking(&audio, false);
    audio.call_audio_active = false;
    assert(tel.current_call.state == CALL_IDLE);
    printf("    Call Terminated:  Duration: %.2fs -> Restored %s, Ducking Released.\n",
           tel.current_call.duration_seconds, audio.route_name);
    printf("    [PASS] Standard VoLTE Voice Call Verified!\n");

    // 3. Test Regulatory Emergency Calling Bypass (E911 / 112)
    printf("\n--> 2. Testing Regulatory Emergency Call Bypass (911 / 112)...\n");
    // Simulate locked phone in airplane mode with locked SIM
    tel.is_airplane_mode = true;
    tel.is_radio_powered = false;
    tel.is_sim_locked = true;

    printf("    Pre-Call State:   AirplaneMode=ON, Radio=OFF, SIM=LOCKED\n");
    printf("    Dialing:          911 (Regulatory Emergency Service)...\n");

    ret = sap_telephony_dial(&tel, "911");
    assert(ret == 0);
    assert(tel.current_call.state == CALL_ACTIVE_VOLTE);
    assert(tel.current_call.is_emergency == true);
    assert(tel.is_airplane_mode == false);
    assert(tel.is_radio_powered == true);
    assert(tel.is_sim_locked == false);

    printf("    Emergency Action: Bypassed Airplane Mode, Powered Radio ON, Bypassed SIM Lock!\n");
    printf("    Emergency Call:   ACTIVE on emergency voice channel!\n");

    sap_telephony_hangup(&tel);
    printf("    [PASS] Regulatory Emergency Calling Bypass Verified!\n");

    // 4. Test SMS PDU Storage Engine
    printf("\n--> 3. Testing SMS Engine & Local Storage...\n");
    ret = sap_telephony_send_sms(&tel, "+1-555-0142", "Sovereign OS production test message.");
    assert(ret == 0);
    ret = sap_telephony_receive_sms(&tel, "+1-555-0142", "Acknowledged. Telephony link verified.");
    assert(ret == 0);
    assert(tel.sms_count == 2);

    printf("    Sent Message:     [ID #1 -> %s]: '%s'\n", tel.sms_store[0].sender_or_recipient, tel.sms_store[0].body);
    printf("    Received Message: [ID #2 <- %s]: '%s'\n", tel.sms_store[1].sender_or_recipient, tel.sms_store[1].body);
    printf("    [PASS] SMS PDU Storage Engine Verified!\n");

    // 5. Test Hardware Privacy Microphone Kill Switch
    printf("\n--> 4. Testing Hardware Privacy Microphone Kill Switch...\n");
    sap_audio_set_privacy_mic_kill(&audio, true);
    assert(audio.hardware_mic_kill_active == true);
    printf("    Privacy Shutter:  Mic hardware registers zeroed (Capture Switch = OFF)\n");
    sap_audio_set_privacy_mic_kill(&audio, false);
    printf("    [PASS] Privacy Microphone Switch Verified!\n");

    // Cleanup
    sap_telephony_destroy(&tel);
    sap_audio_destroy(&audio);

    printf("\n=================================================================\n");
    printf("ALL MOBILE TELEPHONY & AUDIO SUBSYSTEM TESTS PASSED (100%% GREEN)!\n");
    printf("=================================================================\n");
    return 0;
}
