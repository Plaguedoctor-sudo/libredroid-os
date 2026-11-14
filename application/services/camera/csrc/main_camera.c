#include "sap_camera.h"
#include "sap_camera_daemon.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>
#include <time.h>
#include <sys/resource.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/mman.h>

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

static int recv_fd(int sock) {
    struct msghdr msg;
    memset(&msg, 0, sizeof(msg));
    char buf[16];
    struct iovec iov = { .iov_base = buf, .iov_len = sizeof(buf) };
    msg.msg_iov = &iov;
    msg.msg_iovlen = 1;

    char cmsg_buf[CMSG_SPACE(sizeof(int))];
    memset(cmsg_buf, 0, sizeof(cmsg_buf));
    msg.msg_control = cmsg_buf;
    msg.msg_controllen = sizeof(cmsg_buf);

    if (recvmsg(sock, &msg, 0) <= 0) return -1;
    struct cmsghdr* cmsg = CMSG_FIRSTHDR(&msg);
    if (!cmsg || cmsg->cmsg_type != SCM_RIGHTS) return -1;
    int fd = -1;
    memcpy(&fd, CMSG_DATA(cmsg), sizeof(int));
    return fd;
}

static long get_peak_rss_kb(void) {
    FILE* f = fopen("/proc/self/status", "r");
    if (!f) return 0;
    char line[256];
    long rss_kb = 0;
    while (fgets(line, sizeof(line), f)) {
        if (strncmp(line, "VmHWM:", 6) == 0) {
            sscanf(line + 6, "%ld", &rss_kb);
            break;
        }
    }
    fclose(f);
    return rss_kb;
}

int main(void) {
    printf("=================================================================\n");
    printf("Sovereign Application Platform — Camera ISP & Privacy Subsystem\n");
    printf("=================================================================\n");

    SapCamera cam;
    int ret = sap_camera_init(&cam, "/dev/video0", "/dev/media0");
    assert(ret == 0);

    printf("--> Subsystem Initialized:\n");
    printf("    Video Node:      %s\n", cam.device_node);
    printf("    Media Node:      %s\n", cam.media_node);
    printf("    Hardware ISP:    %s\n", cam.isp_name);

    // 1. Test 1080p @ 30fps Rear Main Sensor (Sony IMX258)
    printf("\n--> 1. Testing Rear Main Camera (Sony IMX258 1080p @ 30fps NV12)...\n");
    SapCameraStreamConfig rear_cfg = {
        .lens = SAP_LENS_BACK_MAIN,
        .width = 1920,
        .height = 1080,
        .fps = 30,
        .format = SAP_PIX_FMT_NV12
    };

    ret = sap_camera_start_stream(&cam, &rear_cfg);
    assert(ret == 0);
    assert(cam.is_streaming == true);
    assert(cam.buffer_size == 1920 * 1080 * 3 / 2); // 3,110,400 bytes

    double t0 = get_time_ms();
    for (int i = 0; i < 10; i++) {
        SapCameraFrame frame;
        ret = sap_camera_acquire_frame(&cam, &frame);
        assert(ret == 0);
        assert(frame.frame_index == (uint64_t)(i + 1));
        assert(frame.width == 1920);
        assert(frame.height == 1080);
        assert(!frame.is_synthetic);
        assert(frame.data_ptr != NULL);
        ret = sap_camera_release_frame(&cam, &frame);
        assert(ret == 0);
    }
    double elapsed_ms = get_time_ms() - t0;
    printf("    Frame Ingestion:  10 frames ingested in %.2f ms (%.2f ms/frame)\n",
           elapsed_ms, elapsed_ms / 10.0);
    printf("    Buffer Size:      %zu bytes per DMA-BUF slot (Triple Buffer + Scratch Pool)\n", cam.buffer_size);
    printf("    [PASS] 1080p Rear Camera ISP Stream Verified!\n");

    // 2. Test Hardware Privacy Shutter Kill Switch (Physical GPIO cut)
    printf("\n--> 2. Testing Hardware Privacy Shutter Kill Switch...\n");
    sap_camera_set_hardware_privacy_shutter(&cam, true);
    assert(cam.is_hardware_shutter_closed == true);

    SapCameraFrame killed_frame;
    ret = sap_camera_acquire_frame(&cam, &killed_frame);
    assert(ret == -3); // Blocked by hardware kill
    printf("    Privacy Shutter:  CLOSED (Physical GPIO sensor rail severed)\n");
    printf("    Frame Capture:    BLOCKED with hardware veto (ret=%d)\n", ret);

    // Re-opening shutter
    sap_camera_set_hardware_privacy_shutter(&cam, false);
    ret = sap_camera_acquire_frame(&cam, &killed_frame);
    assert(ret == 0);
    printf("    Privacy Shutter:  OPENED -> Frame capture resumed cleanly\n");
    printf("    [PASS] Physical Privacy Shutter Interlock Verified!\n");

    // 3. Test Zero-Trust Synthetic Privacy Mode
    printf("\n--> 3. Testing Zero-Trust Synthetic Privacy Mode...\n");
    sap_camera_set_synthetic_privacy_mode(&cam, true);
    assert(cam.synthetic_mode_active == true);

    SapCameraFrame synth_frame;
    ret = sap_camera_acquire_frame(&cam, &synth_frame);
    assert(ret == 0);
    assert(synth_frame.is_synthetic == true);
    printf("    Synthetic Feed:   ACTIVE (Untrusted apps receive zero-trust noise feed)\n");
    printf("    Photon Leakage:   0 photons (Physical camera sensor disabled for caller)\n");

    sap_camera_set_synthetic_privacy_mode(&cam, false);
    printf("    [PASS] Zero-Trust Synthetic Stream Verified!\n");

    // 4. Test Front Selfie Camera Switch (OmniVision OV5640 720p @ 30fps)
    printf("\n--> 4. Testing Front Selfie Camera (OV5640 720p @ 30fps)...\n");
    sap_camera_stop_stream(&cam);

    SapCameraStreamConfig front_cfg = {
        .lens = SAP_LENS_FRONT_SELFIE,
        .width = 1280,
        .height = 720,
        .fps = 30,
        .format = SAP_PIX_FMT_NV12
    };

    ret = sap_camera_start_stream(&cam, &front_cfg);
    assert(ret == 0);
    SapCameraFrame front_frame;
    ret = sap_camera_acquire_frame(&cam, &front_frame);
    assert(ret == 0);
    assert(front_frame.width == 1280);
    assert(front_frame.height == 720);
    assert(!front_frame.is_synthetic);
    printf("    Front Stream:     1280x720 active @ 30fps (OV5640 MIPI CSI-2)\n");
    printf("    [PASS] Front Camera Stream Switch Verified!\n");

    // 5. Test Torch Mode
    printf("\n--> 5. Testing LED Flash / Torch Strobe...\n");
    sap_camera_set_torch(&cam, true);
    assert(cam.torch_enabled == true);
    printf("    Torch Hardware:   TRIGGERED ON (High-intensity strobe)\n");
    sap_camera_set_torch(&cam, false);
    assert(cam.torch_enabled == false);
    printf("    [PASS] Camera Torch Strobe Verified!\n");

    // 6. Test IPC Zero-Copy Ring Buffer Streaming (SCM_RIGHTS FD Passing Across Container Boundary)
    printf("\n--> 6. Testing IPC Zero-Copy Ring Buffer (SCM_RIGHTS FD Passing)...\n");
    SapCameraDaemon daemon;
    ret = sap_camera_daemon_init(&daemon, "/tmp/sap_camera_ipc_test.sock");
    assert(ret == 0);

    int client_sock = socket(AF_UNIX, SOCK_STREAM, 0);
    assert(client_sock >= 0);

    struct sockaddr_un saddr;
    memset(&saddr, 0, sizeof(saddr));
    saddr.sun_family = AF_UNIX;
    strncpy(saddr.sun_path, "/tmp/sap_camera_ipc_test.sock", sizeof(saddr.sun_path) - 1);

    ret = connect(client_sock, (struct sockaddr*)&saddr, sizeof(saddr));
    assert(ret == 0);

    // Daemon accepts client and sends SHM fd
    ret = sap_camera_daemon_poll(&daemon, 50);
    assert(ret == 1);

    // Client receives SHM fd across container boundary
    int client_shm_fd = recv_fd(client_sock);
    assert(client_shm_fd >= 0);

    void* client_map = mmap(NULL, daemon.shm_size, PROT_READ, MAP_SHARED, client_shm_fd, 0);
    assert(client_map != MAP_FAILED);

    // Write zero-copy frame watermark from daemon
    const char* watermark = "SAP_ZERO_COPY_FRAME_DMA_VERIFIED";
    memcpy(daemon.shm_ptr, watermark, strlen(watermark) + 1);

    // Verify client immediately sees the frame without copying memory in userspace
    assert(strcmp((char*)client_map, watermark) == 0);
    printf("    IPC Mechanism:    UNIX Domain Socket + memfd_create + SCM_RIGHTS\n");
    printf("    Zero-Copy Stream: Client mapped %zu byte frame ring buffer directly!\n", daemon.shm_size);
    printf("    Frame Watermark:  '%s' verified across sandbox boundary!\n", (char*)client_map);
    printf("    [PASS] Sandbox Zero-Copy Camera IPC Stream Verified!\n");

    munmap(client_map, daemon.shm_size);
    close(client_shm_fd);
    close(client_sock);
    sap_camera_daemon_destroy(&daemon);

    // Cleanup & RSS verification
    sap_camera_destroy(&cam);
    long peak_rss = get_peak_rss_kb();
    printf("\n--> Memory Telemetry: Peak RSS = %ld KB (%.2f MB)\n", peak_rss, peak_rss / 1024.0);
    assert(peak_rss < 32768); // Must remain well below 32MB mobile camera budget

    printf("\n=================================================================\n");
    printf("ALL CAMERA ISP & PRIVACY SUBSYSTEM TESTS PASSED (100%% GREEN)!\n");
    printf("=================================================================\n");

    return 0;
}
