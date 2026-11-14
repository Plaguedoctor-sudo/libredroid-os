#ifndef SAP_AUDIO_H
#define SAP_AUDIO_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    SAP_ROUTE_EARPIECE = 0,
    SAP_ROUTE_SPEAKER = 1,
    SAP_ROUTE_HEADSET_35MM = 2,
    SAP_ROUTE_BLUETOOTH_HFP = 3
} SapAudioRoute;

typedef struct {
    char sound_card[64];
    SapAudioRoute active_route;
    bool is_ducked;
    bool hardware_mic_kill_active;
    bool call_audio_active;
    int volume_pct;
    char route_name[32];
} SapAudio;

// Initialize native mobile audio subsystem
int sap_audio_init(SapAudio* audio, const char* sound_card);

// Switch acoustic transducer via ALSA UCM2 device paths
int sap_audio_set_route(SapAudio* audio, SapAudioRoute route);

// Enable/disable audio focus ducking (drop media stream by -18 dB for phone calls)
int sap_audio_set_ducking(SapAudio* audio, bool duck);

// Hardware privacy microphone kill switch
int sap_audio_set_privacy_mic_kill(SapAudio* audio, bool kill);

// Set master output volume
int sap_audio_set_volume(SapAudio* audio, int volume_pct);

// Destroy and release audio subsystem
void sap_audio_destroy(SapAudio* audio);

#ifdef __cplusplus
}
#endif

#endif // SAP_AUDIO_H
