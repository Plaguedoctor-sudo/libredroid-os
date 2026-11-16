/*
 * LibreDroid Cellular Telephony Controller CLI (lrd-telephony)
 * os/telephony/lrd-telephony.c
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>

#define SOCK_PATH "/run/libredroid/telephony.sock"
#define FALLBACK_SOCK "/tmp/libredroid/telephony.sock"

static int connect_telephony(void) {
    int fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (fd < 0) return -1;

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, SOCK_PATH, sizeof(addr.sun_path) - 1);

    if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) == 0) {
        return fd;
    }

    // Try fallback
    strncpy(addr.sun_path, FALLBACK_SOCK, sizeof(addr.sun_path) - 1);
    if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) == 0) {
        return fd;
    }

    close(fd);
    return -1;
}

static void send_and_print(const char *cmd) {
    int fd = connect_telephony();
    if (fd < 0) {
        fprintf(stderr, "Error: Could not connect to lrd-telephonyd daemon (telephony.sock)\n");
        exit(1);
    }

    if (write(fd, cmd, strlen(cmd)) < 0 || write(fd, "\n", 1) < 0) {
        perror("write");
        close(fd);
        exit(1);
    }

    char buf[4096];
    ssize_t n = read(fd, buf, sizeof(buf) - 1);
    if (n > 0) {
        buf[n] = '\0';
        printf("%s", buf);
    }
    close(fd);
}

int main(int argc, char **argv) {
    if (argc < 2) {
        printf("Usage: %s <command> [args...]\n", argv[0]);
        printf("Commands:\n");
        printf("  status                - View cellular network & call state\n");
        printf("  signal                - View signal strength (RSRP, bars, tech)\n");
        printf("  call <number>         - Initiate voice call (VoLTE/VoNR)\n");
        printf("  hangup                - End active call\n");
        printf("  call-status           - Check duration and active call info\n");
        printf("  emergency <number>    - Emergency call bypass (911/112/999)\n");
        printf("  sms <number> <text>   - Send SMS message\n");
        printf("  sms-list              - View received/stored SMS messages\n");
        printf("  sim-unlock <pin>      - Unlock SIM card\n");
        return 1;
    }

    const char *action = argv[1];
    char cmd[2048] = {0};

    if (strcmp(action, "status") == 0 || strcmp(action, "signal") == 0) {
        snprintf(cmd, sizeof(cmd), "status");
    } else if (strcmp(action, "call") == 0) {
        if (argc < 3) { fprintf(stderr, "Error: missing phone number\n"); return 1; }
        snprintf(cmd, sizeof(cmd), "call-dial %s", argv[2]);
    } else if (strcmp(action, "hangup") == 0) {
        snprintf(cmd, sizeof(cmd), "call-hangup");
    } else if (strcmp(action, "call-status") == 0) {
        snprintf(cmd, sizeof(cmd), "call-status");
    } else if (strcmp(action, "emergency") == 0) {
        if (argc < 3) { fprintf(stderr, "Error: missing emergency number\n"); return 1; }
        snprintf(cmd, sizeof(cmd), "emergency-dial %s", argv[2]);
    } else if (strcmp(action, "sms") == 0) {
        if (argc < 4) { fprintf(stderr, "Error: usage: sms <number> <message>\n"); return 1; }
        // Reconstruct message from argv[3...]
        char msg[1024] = {0};
        for (int i = 3; i < argc; i++) {
            strncat(msg, argv[i], sizeof(msg) - strlen(msg) - 2);
            if (i < argc - 1) strncat(msg, " ", sizeof(msg) - strlen(msg) - 1);
        }
        snprintf(cmd, sizeof(cmd), "sms-send %s %s", argv[2], msg);
    } else if (strcmp(action, "sms-list") == 0) {
        snprintf(cmd, sizeof(cmd), "sms-list");
    } else if (strcmp(action, "sim-unlock") == 0) {
        if (argc < 3) { fprintf(stderr, "Error: missing PIN\n"); return 1; }
        snprintf(cmd, sizeof(cmd), "sim-unlock %s", argv[2]);
    } else {
        snprintf(cmd, sizeof(cmd), "%s", action);
    }

    send_and_print(cmd);
    return 0;
}
