/* lrd-bootcount — drive the bootloader's own A/B retry mechanism.
 *
 * Android's ABL reads `bootloader_control` from the `misc` partition at offset 2048.
 * On every boot it decrements tries[current_slot]; at zero it switches slots. The OS
 * marks success[current_slot]=1 to stop the countdown.
 *
 * Consequence: if a staged update produces a kernel that never reaches userspace,
 * the bootloader falls back to the old slot on its own. No userspace involved.
 *
 * Build: gcc -O2 -o lrd-bootcount lrd-bootcount.c
 *   --status                 show slots, tries, success
 *   --arm <a|b> [tries]      tries=N, success=0  (call before rebooting into an update)
 *   --mark-success [a|b]     success=1           (call once the OS is healthy)
 *   --clear                  reset both slots to success=1, tries=0
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>

#define MISC_DEV       "/dev/block/by-name/misc"
#define BOOT_CTRL_OFF  2048
#define BOOT_CTRL_LEN  32
#define MAX_SLOTS      4
#define BOOT_CTRL_MAGIC "BLMC"
#define BOOT_CTRL_VERSION 1

struct bootloader_control {
    uint8_t slot_suffix[4];
    uint8_t magic[4];
    uint8_t version;
    uint8_t nb_slot : 3;
    uint8_t recovery_tries_remaining : 3;
    uint8_t reserved0[2];
    uint8_t success[MAX_SLOTS];
    uint8_t tries[MAX_SLOTS];
    uint8_t reserved1[8];
    uint8_t crc32_le[4];
} __attribute__((packed));

static uint32_t crc_table[256];
static void crc_init(void) {
    for (uint32_t i = 0; i < 256; i++) {
        uint32_t c = i;
        for (int k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320u ^ (c >> 1)) : (c >> 1);
        crc_table[i] = c;
    }
}
static uint32_t crc32_le(uint32_t crc, const uint8_t *buf, size_t len) {
    crc = ~crc;
    for (size_t i = 0; i < len; i++) crc = crc_table[(crc ^ buf[i]) & 0xFF] ^ (crc >> 8);
    return ~crc;
}

static int slot_index(const char *s) {
    if (!s || !*s) return -1;
    if (*s == 'a' || *s == 'A' || *s == '_') {
        char c = (s[0] == '_' && s[1]) ? s[1] : s[0];
        if (c == 'a' || c == 'A') return 0;
        if (c == 'b' || c == 'B') return 1;
    }
    if (strcmp(s, "0") == 0) return 0;
    if (strcmp(s, "1") == 0) return 1;
    return -1;
}

static int read_ctrl(int fd, struct bootloader_control *c) {
    if (pread(fd, c, BOOT_CTRL_LEN, BOOT_CTRL_OFF) != BOOT_CTRL_LEN) return -1;
    if (memcmp(c->magic, BOOT_CTRL_MAGIC, 4) != 0) return 1;   /* 1 = uninitialised */
    uint32_t stored; memcpy(&stored, c->crc32_le, 4);
    uint32_t calc = crc32_le(0, (uint8_t *)c, BOOT_CTRL_LEN - 4);
    if (stored != calc) return 2;                               /* 2 = bad crc */
    if (c->version != BOOT_CTRL_VERSION) return 3;
    return 0;
}

static int write_ctrl(int fd, struct bootloader_control *c) {
    uint32_t crc = crc32_le(0, (uint8_t *)c, BOOT_CTRL_LEN - 4);
    memcpy(c->crc32_le, &crc, 4);
    if (pwrite(fd, c, BOOT_CTRL_LEN, BOOT_CTRL_OFF) != BOOT_CTRL_LEN) return -1;
    fsync(fd);
    return 0;
}

static void init_ctrl(struct bootloader_control *c) {
    memset(c, 0, sizeof *c);
    memcpy(c->magic, BOOT_CTRL_MAGIC, 4);
    c->version = BOOT_CTRL_VERSION;
    c->nb_slot = 2;
    c->recovery_tries_remaining = 3;
    /* a freshly initialised block must not trigger a fallback: everything succeeded */
    for (int i = 0; i < MAX_SLOTS; i++) c->success[i] = 1;
}

static const char *cur_slot(void) {
    static char buf[16];
    FILE *f = fopen("/proc/cmdline", "r");
    if (f) {
        char line[1024];
        if (fgets(line, sizeof line, f)) {
            char *p = strstr(line, "androidboot.slot_suffix=");
            if (p) { p += strlen("androidboot.slot_suffix="); size_t n = strcspn(p, " \n");
                     if (n < sizeof buf) { memcpy(buf, p, n); buf[n] = 0; fclose(f); return buf; } }
        }
        fclose(f);
    }
    const char *e = getenv("LRD_SLOT");
    return e ? e : "_a";
}

int main(int argc, char **argv) {
    crc_init();
    const char *dev = getenv("LRD_MISC") ?: MISC_DEV;
    int fd = open(dev, O_RDWR | O_SYNC);
    if (fd < 0) { fprintf(stderr, "lrd-bootcount: %s: %s\n", dev, strerror(errno)); return 1; }

    struct bootloader_control c;
    int st = read_ctrl(fd, &c);
    if (st == 1 || st == 2 || st == 3) {
        fprintf(stderr, "lrd-bootcount: initialising bootloader_control (reason %d)\n", st);
        init_ctrl(&c);
        if (write_ctrl(fd, &c) != 0) { perror("write"); return 1; }
    }

    const char *cmd = argc > 1 ? argv[1] : "--status";

    if (strcmp(cmd, "--status") == 0) {
        printf("slots:    %d\n", c.nb_slot);
        printf("current:  %s\n", cur_slot());
        for (int i = 0; i < c.nb_slot && i < MAX_SLOTS; i++)
            printf("slot %c:   success=%d tries=%d\n", 'a' + i, c.success[i], c.tries[i]);
        printf("recovery_tries_remaining: %d\n", c.recovery_tries_remaining);
        close(fd); return 0;
    }

    if (strcmp(cmd, "--arm") == 0) {
        const char *s = argc > 2 ? argv[2] : cur_slot();
        int idx = slot_index(s);
        if (idx < 0 || idx >= c.nb_slot) { fprintf(stderr, "bad slot '%s'\n", s); return 2; }
        int tries = argc > 3 ? atoi(argv[3]) : 6;
        if (tries < 1) tries = 1;
        if (tries > 7) tries = 7;                       /* 3-bit field */
        c.success[idx] = 0;
        c.tries[idx] = (uint8_t)tries;
        if (write_ctrl(fd, &c) != 0) { perror("write"); return 1; }
        printf("armed slot %c: tries=%d success=0 — the bootloader will fall back after %d failed boots\n",
               'a' + idx, tries, tries);
        close(fd); return 0;
    }

    if (strcmp(cmd, "--mark-success") == 0) {
        const char *s = argc > 2 ? argv[2] : cur_slot();
        int idx = slot_index(s);
        if (idx < 0 || idx >= c.nb_slot) { fprintf(stderr, "bad slot '%s'\n", s); return 2; }
        if (c.success[idx] == 1 && c.tries[idx] == 0) { printf("slot %c already marked\n", 'a' + idx); close(fd); return 0; }
        c.success[idx] = 1;
        c.tries[idx] = 0;
        if (write_ctrl(fd, &c) != 0) { perror("write"); return 1; }
        printf("slot %c marked successful — countdown cancelled\n", 'a' + idx);
        close(fd); return 0;
    }

    if (strcmp(cmd, "--clear") == 0) {
        for (int i = 0; i < MAX_SLOTS; i++) { c.success[i] = 1; c.tries[i] = 0; }
        if (write_ctrl(fd, &c) != 0) { perror("write"); return 1; }
        printf("both slots cleared to success\n");
        close(fd); return 0;
    }

    fprintf(stderr, "usage: lrd-bootcount {--status|--arm <a|b> [tries]|--mark-success [a|b]|--clear}\n");
    close(fd); return 64;
}
