#define _GNU_SOURCE
#include "sap_compositor.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <poll.h>
#include <time.h>

static double get_monotonic_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1000000.0;
}

int sap_compositor_init(SapCompositor* comp, const char* socket_name, uint32_t width, uint32_t height, uint32_t refresh_hz) {
    if (!comp) return -1;
    memset(comp, 0, sizeof(SapCompositor));

    comp->display_width = width ? width : 1920;
    comp->display_height = height ? height : 1080;
    comp->refresh_rate_hz = refresh_hz ? refresh_hz : 120;
    comp->form_factor = FORM_FACTOR_DESKTOP_DOCKED;
    comp->hinge_angle_deg = 180.0f;
    comp->is_running = true;

    // Resolve socket path
    const char* sock = socket_name ? socket_name : "wayland-sap";
    if (sock[0] == '/') {
        snprintf(comp->socket_path, sizeof(comp->socket_path), "%s", sock);
    } else {
        const char* runtime_dir = getenv("XDG_RUNTIME_DIR");
        if (runtime_dir && strlen(runtime_dir) > 0) {
            snprintf(comp->socket_path, sizeof(comp->socket_path), "%s/%s", runtime_dir, sock);
        } else {
            snprintf(comp->socket_path, sizeof(comp->socket_path), "/tmp/%s", sock);
        }
    }

    unlink(comp->socket_path);

    comp->server_fd = socket(AF_UNIX, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, 0);
    if (comp->server_fd < 0) {
        return -2;
    }

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    snprintf(addr.sun_path, sizeof(addr.sun_path), "%s", comp->socket_path);

    if (bind(comp->server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        close(comp->server_fd);
        return -3;
    }

    if (listen(comp->server_fd, 16) < 0) {
        close(comp->server_fd);
        return -4;
    }

    chmod(comp->socket_path, 0660);
    comp->last_frame_time_ms = get_monotonic_ms();
    comp->avg_frame_latency_ms = 1000.0 / (double)comp->refresh_rate_hz;

    return 0;
}

int sap_compositor_set_form_factor(SapCompositor* comp, SapFormFactorMode mode, float hinge_angle_deg) {
    if (!comp) return -1;
    comp->form_factor = mode;
    comp->hinge_angle_deg = hinge_angle_deg;

    // Recompute layout for all active surfaces
    for (uint32_t i = 0; i < comp->surface_count; i++) {
        SapSurface* s = &comp->surfaces[i];
        if (s->is_layer_surface) continue;

        switch (mode) {
            case FORM_FACTOR_HANDSET:
                // Fullscreen minus top status and bottom gesture pill
                s->x = 0;
                s->y = 28;
                s->width = comp->display_width;
                s->height = comp->display_height - 76;
                s->is_maximized = true;
                break;
            case FORM_FACTOR_FOLDABLE_OPEN:
                // Dual column split
                s->x = (i % 2 == 0) ? 0 : (comp->display_width / 2);
                s->y = 28;
                s->width = comp->display_width / 2;
                s->height = comp->display_height - 56;
                s->is_maximized = false;
                break;
            case FORM_FACTOR_TABLET:
                s->x = (int32_t)(comp->display_width * 0.1f);
                s->y = 40;
                s->width = (uint32_t)(comp->display_width * 0.8f);
                s->height = comp->display_height - 80;
                break;
            case FORM_FACTOR_DESKTOP_DOCKED:
            default:
                // Floating staggered windows
                s->x = 80 + (i * 40);
                s->y = 80 + (i * 40);
                s->width = 960;
                s->height = 640;
                s->is_maximized = false;
                break;
        }
    }
    return 0;
}

uint64_t sap_compositor_create_surface(SapCompositor* comp, const char* app_id, uint32_t w, uint32_t h, bool is_layer) {
    if (!comp || comp->surface_count >= MAX_SAP_SURFACES) return 0;

    uint64_t sid = (uint64_t)(comp->surface_count + 1);
    SapSurface* s = &comp->surfaces[comp->surface_count++];
    memset(s, 0, sizeof(SapSurface));

    s->surface_id = sid;
    strncpy(s->app_id, app_id ? app_id : "org.sovereign.app", sizeof(s->app_id) - 1);
    s->width = w ? w : 800;
    s->height = h ? h : 600;
    s->stride = s->width * 4;
    s->is_layer_surface = is_layer;
    s->shm_fd = -1;

    // Apply convergence bounds
    sap_compositor_set_form_factor(comp, comp->form_factor, comp->hinge_angle_deg);
    return sid;
}

int sap_compositor_commit_surface(SapCompositor* comp, uint64_t surface_id, const void* pixel_data, uint32_t w, uint32_t h) {
    (void)pixel_data;
    if (!comp) return -1;

    SapSurface* target = NULL;
    for (uint32_t i = 0; i < comp->surface_count; i++) {
        if (comp->surfaces[i].surface_id == surface_id) {
            target = &comp->surfaces[i];
            break;
        }
    }

    if (!target) return -2;

    if (w > 0 && h > 0) {
        target->width = w;
        target->height = h;
        target->stride = w * 4;
    }

    target->frame_count++;

    // Frame pacing measurement
    double now = get_monotonic_ms();
    double frame_dt = now - comp->last_frame_time_ms;
    comp->last_frame_time_ms = now;
    comp->avg_frame_latency_ms = (comp->avg_frame_latency_ms * 0.9) + (frame_dt * 0.1);

    return 0;
}

int sap_compositor_dispatch(SapCompositor* comp, int timeout_ms) {
    if (!comp || comp->server_fd < 0) return -1;

    struct pollfd pfd;
    pfd.fd = comp->server_fd;
    pfd.events = POLLIN;

    int ret = poll(&pfd, 1, timeout_ms);
    if (ret > 0 && (pfd.revents & POLLIN)) {
        // Accept new client socket
        int client_fd = accept4(comp->server_fd, NULL, NULL, SOCK_NONBLOCK | SOCK_CLOEXEC);
        if (client_fd >= 0) {
            // Emulate client surface registration
            char client_tag[32];
            snprintf(client_tag, sizeof(client_tag), "client-fd-%d", client_fd);
            sap_compositor_create_surface(comp, client_tag, 800, 600, false);
            close(client_fd);
            return 1;
        }
    }
    return 0;
}

#include <sys/ioctl.h>
#include <sys/mman.h>
#include <drm/drm.h>
#include <drm/drm_mode.h>
#include <linux/input.h>

int sap_compositor_init_drm(SapCompositor* comp, const char* card_node) {
    if (!comp) return -1;
    memset(&comp->drm, 0, sizeof(SapDrmKmsState));
    comp->drm.drm_fd = -1;
    comp->drm.touch_fd = -1;

    const char* card = card_node ? card_node : "/dev/dri/card1";
    comp->drm.drm_fd = open(card, O_RDWR | O_CLOEXEC);
    if (comp->drm.drm_fd < 0) {
        card = "/dev/dri/card0";
        comp->drm.drm_fd = open(card, O_RDWR | O_CLOEXEC);
    }

    if (comp->drm.drm_fd >= 0) {
        // Query resources from Linux DRM driver
        struct drm_mode_card_res res;
        memset(&res, 0, sizeof(res));
        if (ioctl(comp->drm.drm_fd, DRM_IOCTL_MODE_GETRESOURCES, &res) == 0) {
            comp->drm.is_drm_active = true;
        }

        // Allocate double-buffered hardware dumb buffers
        for (int i = 0; i < 2; i++) {
            struct drm_mode_create_dumb create_req;
            memset(&create_req, 0, sizeof(create_req));
            create_req.width = comp->display_width;
            create_req.height = comp->display_height;
            create_req.bpp = 32;

            if (ioctl(comp->drm.drm_fd, DRM_IOCTL_MODE_CREATE_DUMB, &create_req) == 0) {
                comp->drm.dumb_handle[i] = create_req.handle;
                comp->drm.stride = create_req.pitch;
                comp->drm.size = create_req.size;

                struct drm_mode_fb_cmd fb_cmd;
                memset(&fb_cmd, 0, sizeof(fb_cmd));
                fb_cmd.width = comp->display_width;
                fb_cmd.height = comp->display_height;
                fb_cmd.pitch = create_req.pitch;
                fb_cmd.bpp = 32;
                fb_cmd.depth = 24;
                fb_cmd.handle = create_req.handle;

                if (ioctl(comp->drm.drm_fd, DRM_IOCTL_MODE_ADDFB, &fb_cmd) == 0) {
                    comp->drm.fb_id[i] = fb_cmd.fb_id;
                }

                struct drm_mode_map_dumb map_req;
                memset(&map_req, 0, sizeof(map_req));
                map_req.handle = create_req.handle;
                if (ioctl(comp->drm.drm_fd, DRM_IOCTL_MODE_MAP_DUMB, &map_req) == 0) {
                    comp->drm.mapped_buf[i] = (uint8_t*)mmap(0, create_req.size,
                        PROT_READ | PROT_WRITE, MAP_SHARED, comp->drm.drm_fd, (off_t)map_req.offset);
                }
            }
        }
    }

    // If DRM dumb buffers could not be created via hardware ioctl, initialize virtual double buffer
    if (!comp->drm.mapped_buf[0]) {
        size_t bsize = (size_t)comp->display_width * comp->display_height * 4;
        comp->drm.stride = comp->display_width * 4;
        comp->drm.size = bsize;
        for (int i = 0; i < 2; i++) {
            comp->drm.mapped_buf[i] = (uint8_t*)mmap(NULL, bsize,
                PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        }
    }

    // Probe Linux evdev input nodes (/dev/input/event*)
    for (int ev = 0; ev < 32; ev++) {
        char ev_path[64];
        snprintf(ev_path, sizeof(ev_path), "/dev/input/event%d", ev);
        int tfd = open(ev_path, O_RDONLY | O_NONBLOCK | O_CLOEXEC);
        if (tfd >= 0) {
            comp->drm.touch_fd = tfd;
            break;
        }
    }

    return 0;
}

int sap_compositor_poll_input(SapCompositor* comp, int timeout_ms) {
    if (!comp) return -1;
    (void)timeout_ms;

    if (comp->drm.touch_fd >= 0) {
        struct input_event ev[16];
        ssize_t n = read(comp->drm.touch_fd, ev, sizeof(ev));
        if (n > 0) {
            size_t count = (size_t)n / sizeof(struct input_event);
            for (size_t i = 0; i < count; i++) {
                if (ev[i].type == EV_ABS) {
                    if (ev[i].code == ABS_X || ev[i].code == ABS_MT_POSITION_X) {
                        comp->drm.last_touch_x = ev[i].value;
                    } else if (ev[i].code == ABS_Y || ev[i].code == ABS_MT_POSITION_Y) {
                        comp->drm.last_touch_y = ev[i].value;
                    }
                } else if (ev[i].type == EV_KEY) {
                    if (ev[i].code == BTN_TOUCH || ev[i].code == BTN_LEFT) {
                        comp->drm.touch_down = (ev[i].value != 0);
                    }
                }
            }
            return (int)count;
        }
    }
    return 0;
}

int sap_compositor_page_flip(SapCompositor* comp) {
    if (!comp) return -1;

    // Swap double buffer index (0 <-> 1)
    uint32_t next_idx = (comp->drm.front_idx == 0) ? 1 : 0;

    if (comp->drm.is_drm_active && comp->drm.drm_fd >= 0 && comp->drm.fb_id[next_idx] > 0) {
        struct drm_mode_crtc_page_flip flip;
        memset(&flip, 0, sizeof(flip));
        flip.crtc_id = comp->drm.crtc_id;
        flip.fb_id = comp->drm.fb_id[next_idx];
        flip.flags = DRM_MODE_PAGE_FLIP_EVENT;
        ioctl(comp->drm.drm_fd, DRM_IOCTL_MODE_PAGE_FLIP, &flip);
    }

    comp->drm.front_idx = next_idx;
    return 0;
}

void sap_compositor_cleanup_drm(SapCompositor* comp) {
    if (!comp) return;

    for (int i = 0; i < 2; i++) {
        if (comp->drm.mapped_buf[i] && comp->drm.size > 0) {
            munmap(comp->drm.mapped_buf[i], comp->drm.size);
            comp->drm.mapped_buf[i] = NULL;
        }
        if (comp->drm.drm_fd >= 0 && comp->drm.dumb_handle[i] > 0) {
            struct drm_mode_destroy_dumb destroy_req;
            memset(&destroy_req, 0, sizeof(destroy_req));
            destroy_req.handle = comp->drm.dumb_handle[i];
            ioctl(comp->drm.drm_fd, DRM_IOCTL_MODE_DESTROY_DUMB, &destroy_req);
        }
    }

    if (comp->drm.drm_fd >= 0) {
        close(comp->drm.drm_fd);
        comp->drm.drm_fd = -1;
    }
    if (comp->drm.touch_fd >= 0) {
        close(comp->drm.touch_fd);
        comp->drm.touch_fd = -1;
    }
    comp->drm.is_drm_active = false;
}

void sap_compositor_destroy(SapCompositor* comp) {
    if (!comp) return;
    comp->is_running = false;
    sap_compositor_cleanup_drm(comp);
    if (comp->server_fd >= 0) {
        close(comp->server_fd);
        comp->server_fd = -1;
    }
    unlink(comp->socket_path);
}
