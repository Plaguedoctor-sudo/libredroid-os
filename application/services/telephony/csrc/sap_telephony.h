#ifndef SAP_TELEPHONY_H
#define SAP_TELEPHONY_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    CALL_IDLE = 0,
    CALL_DIALING = 1,
    CALL_RINGING = 2,
    CALL_ACTIVE_VOLTE = 3,
    CALL_ACTIVE_VONR = 4,
    CALL_HELD = 5,
    CALL_DISCONNECTED = 6
} SapCallState;

typedef enum {
    RADIO_TECH_NONE = 0,
    RADIO_TECH_GSM_2G = 1,
    RADIO_TECH_UMTS_3G = 2,
    RADIO_TECH_LTE_VOLTE = 3,
    RADIO_TECH_5G_VONR = 4
} SapRadioTech;

typedef struct {
    uint32_t call_id;
    char remote_number[32];
    SapCallState state;
    bool is_emergency;
    time_t start_time;
    double duration_seconds;
} SapActiveCall;

typedef struct {
    uint64_t message_id;
    char sender_or_recipient[32];
    char body[160];
    time_t timestamp;
    bool is_incoming;
} SapSmsMessage;

#define MAX_SMS_HISTORY 64

typedef struct {
    char modem_device[64];
    char carrier_name[64];
    SapRadioTech radio_tech;
    int signal_rsrp_dbm;
    int signal_bars;
    bool is_radio_powered;
    bool is_airplane_mode;
    bool is_sim_locked;
    SapActiveCall current_call;
    SapSmsMessage sms_store[MAX_SMS_HISTORY];
    uint32_t sms_count;
    char socket_path[104];
    int server_fd;
} SapTelephony;

// Initialize native cellular telephony daemon
int sap_telephony_init(SapTelephony* tel, const char* modem_device, const char* sock_path);

// Check if a dialed number is a recognized regulatory emergency number (112, 911, 999, 000, etc.)
bool sap_telephony_is_emergency(const char* phone_number);

// Dial a phone call (with automatic lockscreen/SIM bypass if emergency number)
int sap_telephony_dial(SapTelephony* tel, const char* phone_number);

// Answer an incoming call
int sap_telephony_answer(SapTelephony* tel);

// Terminate / hang up active call
int sap_telephony_hangup(SapTelephony* tel);

// Send SMS message
int sap_telephony_send_sms(SapTelephony* tel, const char* recipient, const char* body);

// Receive incoming SMS simulation / PDU decode
int sap_telephony_receive_sms(SapTelephony* tel, const char* sender, const char* body);

// Cleanup telephony subsystem
void sap_telephony_destroy(SapTelephony* tel);

#ifdef __cplusplus
}
#endif

#endif // SAP_TELEPHONY_H
