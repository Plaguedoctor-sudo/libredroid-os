/*
 * LibreDroid System Daemon CLI Controller (lrdd-ctl)
 * Command-line utility to query and control lrdd over UNIX domain socket
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>

#define SOCK_PRIMARY "/run/libredroid/lrdd.sock"
#define SOCK_FALLBACK "/tmp/lrdd.sock"

static void print_usage(const char *prog) {
    printf("LibreDroid lrdd-ctl Controller (Phase 1 Sovereign Daemon)\n");
    printf("Usage: %s <command> [args]\n", prog);
    printf("Commands:\n");
    printf("  status                Query daemon status, uptime, PID, memory\n");
    printf("  version               Query system API version and build metadata\n");
    printf("  power-info            Query battery, charging, voltage, thermal stats\n");
    printf("  power <action>        Execute power action (reboot, poweroff, suspend, lock)\n");
    printf("  brightness [get|set]  Query or set backlight level (0-100)\n");
    printf("  volume [get|set]      Query or set volume level (0-100)\n");
    printf("  network               Query active network interface and IP\n");
    printf("  domains [list|start|stop <domain>] Manage isolation domains\n");
    printf("  launch <pkg>          Launch Waydroid application by package name\n");
    printf("  killswitch            Query hardware/software killswitch states\n");
    printf("  raw <json>            Send raw JSON payload to lrdd\n");
}

int main(int argc, char **argv) {
    if (argc < 2 || strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
        print_usage(argv[0]);
        return 1;
    }

    const char *cmd = argv[1];
    char req[1024] = {0};

    if (strcmp(cmd, "status") == 0) {
        snprintf(req, sizeof(req), "{\"method\":\"system.status\"}\n");
    } else if (strcmp(cmd, "version") == 0) {
        snprintf(req, sizeof(req), "{\"method\":\"system.version\"}\n");
    } else if (strcmp(cmd, "power-info") == 0) {
        snprintf(req, sizeof(req), "{\"method\":\"system.power.info\"}\n");
    } else if (strcmp(cmd, "power") == 0) {
        const char *act = (argc > 2) ? argv[2] : "reboot";
        snprintf(req, sizeof(req), "{\"method\":\"system.power\",\"params\":{\"action\":\"%s\"}}\n", act);
    } else if (strcmp(cmd, "brightness") == 0) {
        if (argc > 2 && strcmp(argv[2], "set") == 0 && argc > 3) {
            snprintf(req, sizeof(req), "{\"method\":\"system.brightness.set\",\"params\":{\"level\":%d}}\n", atoi(argv[3]));
        } else {
            snprintf(req, sizeof(req), "{\"method\":\"system.brightness.get\"}\n");
        }
    } else if (strcmp(cmd, "volume") == 0) {
        if (argc > 2 && strcmp(argv[2], "set") == 0 && argc > 3) {
            snprintf(req, sizeof(req), "{\"method\":\"system.volume.set\",\"params\":{\"level\":%d}}\n", atoi(argv[3]));
        } else if (argc > 2 && atoi(argv[2]) > 0) {
            snprintf(req, sizeof(req), "{\"method\":\"system.volume.set\",\"params\":{\"level\":%d}}\n", atoi(argv[2]));
        } else {
            snprintf(req, sizeof(req), "{\"method\":\"system.volume.get\"}\n");
        }
    } else if (strcmp(cmd, "network") == 0) {
        snprintf(req, sizeof(req), "{\"method\":\"system.wifi.status\"}\n");
    } else if (strcmp(cmd, "domains") == 0) {
        if (argc > 3 && strcmp(argv[2], "start") == 0) {
            snprintf(req, sizeof(req), "{\"method\":\"domains.start\",\"params\":{\"domain\":\"%s\"}}\n", argv[3]);
        } else if (argc > 3 && strcmp(argv[2], "stop") == 0) {
            snprintf(req, sizeof(req), "{\"method\":\"domains.stop\",\"params\":{\"domain\":\"%s\"}}\n", argv[3]);
        } else {
            snprintf(req, sizeof(req), "{\"method\":\"domains.list\"}\n");
        }
    } else if (strcmp(cmd, "launch") == 0 && argc > 2) {
        snprintf(req, sizeof(req), "{\"method\":\"waydroid.app.launch\",\"params\":{\"package\":\"%s\"}}\n", argv[2]);
    } else if (strcmp(cmd, "killswitch") == 0) {
        snprintf(req, sizeof(req), "{\"method\":\"system.killswitch.get\"}\n");
    } else if (strcmp(cmd, "raw") == 0 && argc > 2) {
        snprintf(req, sizeof(req), "%s\n", argv[2]);
    } else {
        snprintf(req, sizeof(req), "{\"method\":\"%s\"}\n", cmd);
    }

    const char *sock_path = SOCK_PRIMARY;
    if (access(SOCK_PRIMARY, F_OK) != 0) {
        sock_path = SOCK_FALLBACK;
    }

    int sfd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sfd < 0) {
        perror("socket");
        return 1;
    }

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, sock_path, sizeof(addr.sun_path) - 1);

    if (connect(sfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        fprintf(stderr, "Error: Cannot connect to lrdd daemon on %s (is lrdd running?)\n", sock_path);
        close(sfd);
        return 1;
    }

    if (write(sfd, req, strlen(req)) < 0) {
        perror("write to lrdd");
        close(sfd);
        return 1;
    }

    char buf[8192];
    memset(buf, 0, sizeof(buf));
    ssize_t n = read(sfd, buf, sizeof(buf) - 1);
    if (n > 0) {
        printf("%s\n", buf);
    }

    close(sfd);
    return 0;
}
