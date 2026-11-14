#define _GNU_SOURCE
#include "sap_audio.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int sap_audio_init(SapAudio* audio, const char* sound_card) {
    if (!audio) return -1;
    memset(audio, 0, sizeof(SapAudio));

    const char* card = sound_card ? sound_card : "rk3399-pinephone-pro";
    strncpy(audio->sound_card, card, sizeof(audio->sound_card) - 1);
    audio->active_route = SAP_ROUTE_SPEAKER;
    strncpy(audio->route_name, "Loudspeaker", sizeof(audio->route_name) - 1);
    audio->is_ducked = false;
    audio->hardware_mic_kill_active = false;
    audio->call_audio_active = false;
    audio->volume_pct = 75;

    return 0;
}

int sap_audio_set_route(SapAudio* audio, SapAudioRoute route) {
    if (!audio) return -1;
    audio->active_route = route;

    switch (route) {
        case SAP_ROUTE_EARPIECE:
            strncpy(audio->route_name, "Earpiece Handset", sizeof(audio->route_name) - 1);
            break;
        case SAP_ROUTE_SPEAKER:
            strncpy(audio->route_name, "Loudspeaker", sizeof(audio->route_name) - 1);
            break;
        case SAP_ROUTE_HEADSET_35MM:
            strncpy(audio->route_name, "3.5mm TRRS Headset", sizeof(audio->route_name) - 1);
            break;
        case SAP_ROUTE_BLUETOOTH_HFP:
            strncpy(audio->route_name, "Bluetooth HFP (mSBC)", sizeof(audio->route_name) - 1);
            break;
    }
    return 0;
}

int sap_audio_set_ducking(SapAudio* audio, bool duck) {
    if (!audio) return -1;
    audio->is_ducked = duck;
    return 0;
}

int sap_audio_set_privacy_mic_kill(SapAudio* audio, bool kill) {
    if (!audio) return -1;
    audio->hardware_mic_kill_active = kill;
    return 0;
}

int sap_audio_set_volume(SapAudio* audio, int volume_pct) {
    if (!audio) return -1;
    if (volume_pct < 0) volume_pct = 0;
    if (volume_pct > 100) volume_pct = 100;
    audio->volume_pct = volume_pct;
    return 0;
}

void sap_audio_destroy(SapAudio* audio) {
    if (!audio) return;
    audio->is_ducked = false;
}
