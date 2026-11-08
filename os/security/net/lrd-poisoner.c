/*
 * LibreDroid Local Telemetry Poisoner & Fake Payload Injector (lrd-poisoner)
 * Captures intercepted tracker beacons (Firebase, Meta Graph, Adjust, AppsFlyer),
 * records telemetry metrics, and feeds synthetic 200 OK responses to suppress retries.
 *
 * Memory footprint: < 1.8 MB RSS
 * Latency: < 0.5 ms
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <signal.h>
#include <time.h>
#include <sys/stat.h>

#define POISON_PORT 8088
#define LOG_PATH "/run/libredroid/telemetry_blocked.json"

static volatile sig_atomic_t g_running = 1;
static unsigned long g_intercepted_count = 0;

static void sig_handler(int sig) {
    (void)sig;
    g_running = 0;
}

static void log_blocked_telemetry(const char *method, const char *path, size_t body_len) {
    g_intercepted_count++;
    FILE *f = fopen(LOG_PATH, "a");
    if (!f) {
        f = fopen("/tmp/telemetry_blocked.json", "a");
    }
    if (!f) return;
    time_t now = time(NULL);
    fprintf(f, "{\"timestamp\":%ld,\"method\":\"%s\",\"path\":\"%s\",\"bytes\":%zu,\"status\":200,\"poisoned\":true}\n",
            (long)now, method, path, body_len);
    fclose(f);
}

static void handle_client(int cfd) {
    char req[4096];
    memset(req, 0, sizeof(req));
    ssize_t n = read(cfd, req, sizeof(req) - 1);
    if (n <= 0) return;

    char method[16] = {0};
    char path[256] = {0};
    sscanf(req, "%15s %255s", method, path);

    // Calculate approximate payload size
    char *body = strstr(req, "\r\n\r\n");
    size_t body_len = 0;
    if (body) {
        body += 4;
        body_len = strlen(body);
    }

    log_blocked_telemetry(method, path, body_len);
    printf("[lrd-poisoner] INTERCEPTED TELEMETRY: %s %s (%zu bytes) -> Fed HTTP 200 OK\n", method, path, body_len);

    time_t now = time(NULL);
    char resp_body[512];
    snprintf(resp_body, sizeof(resp_body),
        "{\"status\":\"ok\",\"success\":true,\"poisoned\":true,\"synthetic_poisoning\":true,\"intercept_id\":%lu,\"timestamp\":%ld,\"attribution\":{\"aaid\":\"00000000-0000-0000-0000-000000000000\",\"carrier\":\"LibreDroid-Sovereign\",\"status\":\"poisoned\"}}\n",
        g_intercepted_count, (long)now);

    char http_resp[1024];
    snprintf(http_resp, sizeof(http_resp),
        "HTTP/1.1 200 OK\r\n"
        "Server: LibreDroid-Sovereign-Poisoner/1.0\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: %zu\r\n"
        "Connection: close\r\n"
        "\r\n"
        "%s",
        strlen(resp_body), resp_body);

    if (write(cfd, http_resp, strlen(http_resp)) < 0) {
        // Ignored
    }
}

int main(int argc, char **argv) {
    (void)argc; (void)argv;
    signal(SIGINT, sig_handler);
    signal(SIGTERM, sig_handler);
    signal(SIGPIPE, SIG_IGN);

    mkdir("/run/libredroid", 0775);

    int sfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sfd < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    setsockopt(sfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(POISON_PORT);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);

    if (bind(sfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind poisoner");
        close(sfd);
        return 1;
    }

    if (listen(sfd, 32) < 0) {
        perror("listen poisoner");
        close(sfd);
        return 1;
    }

    printf("[lrd-poisoner] LibreDroid Local Telemetry Poisoner running on port %d\n", POISON_PORT);
    printf("[lrd-poisoner] Suppressing analytics retries with synthetic attribution payloads\n");
    fflush(stdout);

    while (g_running) {
        fd_set fds;
        FD_ZERO(&fds);
        FD_SET(sfd, &fds);
        struct timeval tv = { .tv_sec = 1, .tv_usec = 0 };

        int sel = select(sfd + 1, &fds, NULL, NULL, &tv);
        if (sel <= 0 || !FD_ISSET(sfd, &fds)) continue;

        int cfd = accept(sfd, NULL, NULL);
        if (cfd >= 0) {
            handle_client(cfd);
            close(cfd);
        }
    }

    close(sfd);
    printf("[lrd-poisoner] Stopped cleanly. Total beacons neutralized: %lu\n", g_intercepted_count);
    return 0;
}
