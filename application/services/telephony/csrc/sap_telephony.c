#define _GNU_SOURCE
#include "sap_telephony.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>
#include <sys/un.h>

static const char* const EMERGENCY_NUMBERS[] = {
    "911", "112", "999", "000", "110", "119", "100", "108"
};

bool sap_telephony_is_emergency(const char* phone_number) {
    if (!phone_number) return false;
    for (size_t i = 0; i < sizeof(EMERGENCY_NUMBERS) / sizeof(EMERGENCY_NUMBERS[0]); i++) {
        if (strcmp(phone_number, EMERGENCY_NUMBERS[i]) == 0) {
            return true;
        }
    }
    return false;
}

int sap_telephony_init(SapTelephony* tel, const char* modem_device, const char* sock_path) {
    if (!tel) return -1;
    memset(tel, 0, sizeof(SapTelephony));

    const char* dev = modem_device ? modem_device : "/dev/ttyUSB2"; // Quectel EG25-G AT port
    strncpy(tel->modem_device, dev, sizeof(tel->modem_device) - 1);
    strncpy(tel->carrier_name, "Sovereign Mobile FOSS", sizeof(tel->carrier_name) - 1);

    tel->radio_tech = RADIO_TECH_LTE_VOLTE;
    tel->signal_rsrp_dbm = -85;
    tel->signal_bars = 4;
    tel->is_radio_powered = true;
    tel->is_airplane_mode = false;
    tel->is_sim_locked = false;
    tel->current_call.state = CALL_IDLE;

    const char* path = sock_path ? sock_path : "/tmp/sap_telephony.sock";
    strncpy(tel->socket_path, path, sizeof(tel->socket_path) - 1);

    unlink(tel->socket_path);
    tel->server_fd = socket(AF_UNIX, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, 0);
    if (tel->server_fd >= 0) {
        struct sockaddr_un addr;
        memset(&addr, 0, sizeof(addr));
        addr.sun_family = AF_UNIX;
        snprintf(addr.sun_path, sizeof(addr.sun_path), "%s", tel->socket_path);
        if (bind(tel->server_fd, (struct sockaddr*)&addr, sizeof(addr)) == 0) {
            listen(tel->server_fd, 8);
        }
    }

    return 0;
}

int sap_telephony_dial(SapTelephony* tel, const char* phone_number) {
    if (!tel || !phone_number || strlen(phone_number) == 0) return -1;

    bool emergency = sap_telephony_is_emergency(phone_number);

    // Regulatory requirement: If emergency call, automatically bypass SIM lock & airplane mode
    if (emergency) {
        tel->is_airplane_mode = false;
        tel->is_radio_powered = true;
        tel->is_sim_locked = false;
    } else {
        if (tel->is_airplane_mode || !tel->is_radio_powered) {
            return -2; // Radio disabled
        }
        if (tel->is_sim_locked) {
            return -3; // SIM PIN locked
        }
    }

    tel->current_call.call_id = 1001;
    strncpy(tel->current_call.remote_number, phone_number, sizeof(tel->current_call.remote_number) - 1);
    tel->current_call.is_emergency = emergency;
    tel->current_call.state = CALL_ACTIVE_VOLTE;
    tel->current_call.start_time = time(NULL);
    tel->current_call.duration_seconds = 0.0;

    return 0;
}

int sap_telephony_answer(SapTelephony* tel) {
    if (!tel || tel->current_call.state != CALL_RINGING) return -1;
    tel->current_call.state = CALL_ACTIVE_VOLTE;
    tel->current_call.start_time = time(NULL);
    return 0;
}

int sap_telephony_hangup(SapTelephony* tel) {
    if (!tel) return -1;
    tel->current_call.state = CALL_DISCONNECTED;
    if (tel->current_call.start_time > 0) {
        tel->current_call.duration_seconds = difftime(time(NULL), tel->current_call.start_time);
    }
    tel->current_call.state = CALL_IDLE;
    return 0;
}

int sap_telephony_send_sms(SapTelephony* tel, const char* recipient, const char* body) {
    if (!tel || !recipient || !body) return -1;
    if (tel->is_airplane_mode || !tel->is_radio_powered) return -2;

    if (tel->sms_count < MAX_SMS_HISTORY) {
        SapSmsMessage* msg = &tel->sms_store[tel->sms_count++];
        msg->message_id = tel->sms_count;
        strncpy(msg->sender_or_recipient, recipient, sizeof(msg->sender_or_recipient) - 1);
        strncpy(msg->body, body, sizeof(msg->body) - 1);
        msg->timestamp = time(NULL);
        msg->is_incoming = false;
        return 0;
    }
    return -3; // Store full
}

int sap_telephony_receive_sms(SapTelephony* tel, const char* sender, const char* body) {
    if (!tel || !sender || !body) return -1;

    if (tel->sms_count < MAX_SMS_HISTORY) {
        SapSmsMessage* msg = &tel->sms_store[tel->sms_count++];
        msg->message_id = tel->sms_count;
        strncpy(msg->sender_or_recipient, sender, sizeof(msg->sender_or_recipient) - 1);
        strncpy(msg->body, body, sizeof(msg->body) - 1);
        msg->timestamp = time(NULL);
        msg->is_incoming = true;
        return 0;
    }
    return -3;
}

void sap_telephony_destroy(SapTelephony* tel) {
    if (!tel) return;
    if (tel->server_fd >= 0) {
        close(tel->server_fd);
        tel->server_fd = -1;
    }
    unlink(tel->socket_path);
}
