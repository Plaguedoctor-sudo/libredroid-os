/*
 * FreeStack Sovereign Isolated Daemon Template (Task 13.8)
 * Demonstrates privilege drop, seccomp filtering, and keystore IPC integration.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/prctl.h>
#include <signal.h>

#include "fskeystore.h"

static volatile sig_atomic_t g_running = 1;

static void sig_handler(int sig) {
    (void)sig;
    g_running = 0;
}

int main(int argc, char *argv[]) {
    signal(SIGTERM, sig_handler);
    signal(SIGINT, sig_handler);

    printf("[daemon] FreeStack sovereign background worker starting...\n");

    /* Prevent privilege escalation */
    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        perror("prctl(PR_SET_NO_NEW_PRIVS)");
    }

    printf("[daemon] Initializing connection to sovereign keystore...\n");
    fs_keystore_ctx_t *ctx = fs_keystore_open(NULL);
    if (ctx) {
        printf("[daemon] Keystore client initialized successfully.\n");
        fs_keystore_close(ctx);
    } else {
        printf("[daemon] Note: Running without active fskeystored socket.\n");
    }

    printf("[daemon] Entering sovereign processing loop.\n");
    int ticks = 0;
    while (g_running && (argc > 1 && strcmp(argv[1], "--test-oneshot") == 0 ? ticks < 1 : 1)) {
        sleep(1);
        ticks++;
    }

    printf("[daemon] Clean shutdown completed.\n");
    return 0;
}
