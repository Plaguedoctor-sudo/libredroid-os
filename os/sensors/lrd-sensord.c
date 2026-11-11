/*
 * LibreDroid Mobile Industrial I/O (IIO) Sensor Suite Daemon (lrd-sensord)
 * os/sensors/lrd-sensord.c
 *
 * Integrates Accelerometer (auto-rotation), Proximity (ear-screen blanking),
 * Ambient Light Sensor (auto-brightness), and Magnetometer (compass).
 *
 * Memory footprint: < 1.8 MB RSS
 * Socket: /run/libredroid/sensors.sock
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <math.h>
#include <signal.h>
#include <time.h>
#include <dirent.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/stat.h>

#define SOCK_PATH "/run/libredroid/sensors.sock"
#define FALLBACK_SOCK "/tmp/libredroid/sensors.sock"
#define STATE_DIR "/run/libredroid"
#define FALLBACK_STATE_DIR "/tmp/libredroid"
#define IIO_BASE_DIR "/sys/bus/iio/devices"

static volatile sig_atomic_t g_running = 1;
static char active_sock_path[108];
static char active_state_dir[256];
static int g_hardware_iio_detected = 0;

typedef struct {
    int accel_x;
    int accel_y;
    int accel_z;
    char orientation[16];   // normal, bottom-up, left-up, right-up
    int proximity_near;     // 1 = near (ear), 0 = far
    int screen_blanked;     // 1 = blanked due to ear proximity during call
    int ambient_lux;        // lux
    int auto_brightness_pct;// 5 - 100%
    int compass_heading;    // 0 - 359 degrees
} sensor_state_t;

static sensor_state_t g_sensors = {
    .accel_x = 0,
    .accel_y = -9800,       // standard 1G upright
    .accel_z = 0,
    .orientation = "normal",
    .proximity_near = 0,
    .screen_blanked = 0,
    .ambient_lux = 300,
    .auto_brightness_pct = 60,
    .compass_heading = 45
};

static int read_sysfs_int(const char *path, int *out) {
    FILE *f = fopen(path, "r");
    if (!f) return -1;
    if (fscanf(f, "%d", out) != 1) {
        fclose(f);
        return -1;
    }
    fclose(f);
    return 0;
}

static void poll_physical_iio_hardware(void) {
    DIR *d = opendir(IIO_BASE_DIR);
    if (!d) return;

    struct dirent *de;
    while ((de = readdir(d)) != NULL) {
        if (strncmp(de->d_name, "iio:device", 10) != 0) continue;

        char path[512];
        int val = 0;

        // 1. Accelerometer detection (in_accel_x_raw / in_accel_y_raw / in_accel_z_raw)
        snprintf(path, sizeof(path), "%s/%s/in_accel_x_raw", IIO_BASE_DIR, de->d_name);
        if (read_sysfs_int(path, &val) == 0) {
            g_hardware_iio_detected = 1;
            g_sensors.accel_x = val;
            snprintf(path, sizeof(path), "%s/%s/in_accel_y_raw", IIO_BASE_DIR, de->d_name);
            if (read_sysfs_int(path, &val) == 0) g_sensors.accel_y = val;
            snprintf(path, sizeof(path), "%s/%s/in_accel_z_raw", IIO_BASE_DIR, de->d_name);
            if (read_sysfs_int(path, &val) == 0) g_sensors.accel_z = val;
        }

        // 2. Ambient light sensor detection (in_illuminance_input or in_illuminance_raw)
        snprintf(path, sizeof(path), "%s/%s/in_illuminance_input", IIO_BASE_DIR, de->d_name);
        if (read_sysfs_int(path, &val) == 0 || (snprintf(path, sizeof(path), "%s/%s/in_illuminance_raw", IIO_BASE_DIR, de->d_name) && read_sysfs_int(path, &val) == 0)) {
            g_hardware_iio_detected = 1;
            g_sensors.ambient_lux = (val < 0) ? 0 : val;
        }

        // 3. Proximity sensor detection (in_proximity_raw)
        snprintf(path, sizeof(path), "%s/%s/in_proximity_raw", IIO_BASE_DIR, de->d_name);
        if (read_sysfs_int(path, &val) == 0) {
            g_hardware_iio_detected = 1;
            g_sensors.proximity_near = (val > 0) ? 1 : 0;
            g_sensors.screen_blanked = g_sensors.proximity_near;
        }

        // 4. Magnetometer / Compass (in_magn_x_raw, in_magn_y_raw)
        snprintf(path, sizeof(path), "%s/%s/in_magn_x_raw", IIO_BASE_DIR, de->d_name);
        int mx = 0, my = 0;
        if (read_sysfs_int(path, &mx) == 0) {
            snprintf(path, sizeof(path), "%s/%s/in_magn_y_raw", IIO_BASE_DIR, de->d_name);
            if (read_sysfs_int(path, &my) == 0) {
                g_hardware_iio_detected = 1;
                double rad = atan2((double)my, (double)mx);
                int deg = (int)(rad * 180.0 / 3.1415926535);
                g_sensors.compass_heading = (deg % 360 + 360) % 360;
            }
        }
    }
    closedir(d);
}

static void sig_handler(int sig) {
    (void)sig;
    g_running = 0;
}

static void update_orientation(void) {
    int ax = g_sensors.accel_x;
    int ay = g_sensors.accel_y;

    if (abs(ay) >= abs(ax)) {
        if (ay < -3000) {
            snprintf(g_sensors.orientation, sizeof(g_sensors.orientation), "normal");
        } else if (ay > 3000) {
            snprintf(g_sensors.orientation, sizeof(g_sensors.orientation), "bottom-up");
        }
    } else {
        if (ax > 3000) {
            snprintf(g_sensors.orientation, sizeof(g_sensors.orientation), "left-up");
        } else if (ax < -3000) {
            snprintf(g_sensors.orientation, sizeof(g_sensors.orientation), "right-up");
        }
    }
}

static void update_brightness(void) {
    int lux = g_sensors.ambient_lux;
    if (lux < 15) {
        g_sensors.auto_brightness_pct = 15;
    } else if (lux < 100) {
        g_sensors.auto_brightness_pct = 35;
    } else if (lux < 500) {
        g_sensors.auto_brightness_pct = 60;
    } else if (lux < 1500) {
        g_sensors.auto_brightness_pct = 80;
    } else {
        g_sensors.auto_brightness_pct = 100;
    }
}

static void update_proximity(int near) {
    g_sensors.proximity_near = near;
    // If near ear, blank the display to prevent accidental touches
    if (near) {
        g_sensors.screen_blanked = 1;
    } else {
        g_sensors.screen_blanked = 0;
    }
}

static void handle_client(int cfd) {
    char buf[1024];
    memset(buf, 0, sizeof(buf));
    ssize_t n = read(cfd, buf, sizeof(buf) - 1);
    if (n <= 0) return;

    while (n > 0 && (buf[n-1] == '\n' || buf[n-1] == '\r')) {
        buf[n-1] = '\0';
        n--;
    }

    char cmd[64] = {0};
    int v1 = 0, v2 = 0, v3 = 0;
    sscanf(buf, "%63s %d %d %d", cmd, &v1, &v2, &v3);

    char resp[2048];
    memset(resp, 0, sizeof(resp));

    if (strcmp(cmd, "status") == 0) {
        poll_physical_iio_hardware();
        if (g_hardware_iio_detected) {
            update_orientation();
            update_brightness();
        }
        snprintf(resp, sizeof(resp),
            "{\"status\":\"ok\",\"hardware_iio_active\":%s,\"orientation\":\"%s\",\"accel\":{\"x\":%d,\"y\":%d,\"z\":%d},"
            "\"proximity\":{\"near\":%s,\"screen_blanked\":%s},"
            "\"ambient_light\":{\"lux\":%d,\"brightness_pct\":%d},"
            "\"compass\":{\"heading_deg\":%d}}\n",
            g_hardware_iio_detected ? "true" : "false",
            g_sensors.orientation, g_sensors.accel_x, g_sensors.accel_y, g_sensors.accel_z,
            g_sensors.proximity_near ? "true" : "false",
            g_sensors.screen_blanked ? "true" : "false",
            g_sensors.ambient_lux, g_sensors.auto_brightness_pct,
            g_sensors.compass_heading);
    }
    else if (strcmp(cmd, "set-accel") == 0) {
        g_sensors.accel_x = v1;
        g_sensors.accel_y = v2;
        g_sensors.accel_z = v3;
        update_orientation();
        snprintf(resp, sizeof(resp), "{\"status\":\"ok\",\"orientation\":\"%s\"}\n", g_sensors.orientation);
    }
    else if (strcmp(cmd, "set-proximity") == 0) {
        update_proximity(v1 ? 1 : 0);
        snprintf(resp, sizeof(resp), "{\"status\":\"ok\",\"proximity_near\":%s,\"screen_blanked\":%s}\n",
            g_sensors.proximity_near ? "true" : "false",
            g_sensors.screen_blanked ? "true" : "false");
    }
    else if (strcmp(cmd, "set-lux") == 0) {
        g_sensors.ambient_lux = v1;
        update_brightness();
        snprintf(resp, sizeof(resp), "{\"status\":\"ok\",\"lux\":%d,\"brightness_pct\":%d}\n",
            g_sensors.ambient_lux, g_sensors.auto_brightness_pct);
    }
    else if (strcmp(cmd, "set-compass") == 0) {
        g_sensors.compass_heading = (v1 % 360 + 360) % 360;
        snprintf(resp, sizeof(resp), "{\"status\":\"ok\",\"heading_deg\":%d}\n", g_sensors.compass_heading);
    }
    else {
        snprintf(resp, sizeof(resp), "{\"status\":\"error\",\"message\":\"Unknown sensor command\"}\n");
    }

    if (write(cfd, resp, strlen(resp)) < 0) {
        // Ignored
    }
}

int main(int argc, char **argv) {
    (void)argc; (void)argv;
    signal(SIGINT, sig_handler);
    signal(SIGTERM, sig_handler);
    signal(SIGPIPE, SIG_IGN);

    mkdir(STATE_DIR, 0775);
    mkdir(FALLBACK_STATE_DIR, 0775);

    snprintf(active_sock_path, sizeof(active_sock_path), "%s", SOCK_PATH);
    snprintf(active_state_dir, sizeof(active_state_dir), "%s", STATE_DIR);

    int sfd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sfd < 0) {
        perror("socket");
        return 1;
    }

    struct sockaddr_un saddr;
    memset(&saddr, 0, sizeof(saddr));
    saddr.sun_family = AF_UNIX;
    snprintf(saddr.sun_path, sizeof(saddr.sun_path), "%s", active_sock_path);
    unlink(active_sock_path);

    if (bind(sfd, (struct sockaddr *)&saddr, sizeof(saddr)) < 0) {
        snprintf(active_sock_path, sizeof(active_sock_path), "%s", FALLBACK_SOCK);
        snprintf(active_state_dir, sizeof(active_state_dir), "%s", FALLBACK_STATE_DIR);
        unlink(active_sock_path);
        memset(&saddr, 0, sizeof(saddr));
        saddr.sun_family = AF_UNIX;
        snprintf(saddr.sun_path, sizeof(saddr.sun_path), "%s", active_sock_path);
        if (bind(sfd, (struct sockaddr *)&saddr, sizeof(saddr)) < 0) {
            perror("bind sensors.sock");
            close(sfd);
            return 1;
        }
    }

    chmod(active_sock_path, 0660);

    if (listen(sfd, 16) < 0) {
        perror("listen sensors");
        close(sfd);
        return 1;
    }

    printf("[lrd-sensord] LibreDroid Linux IIO Sensor Suite running on %s\n", active_sock_path);
    printf("[lrd-sensord] Accelerometer (Auto-Rotation), Proximity (Blanking), ALS (Auto-Brightness)\n");
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
    unlink(active_sock_path);
    printf("[lrd-sensord] Stopped cleanly\n");
    return 0;
}
