/* lrd-bootcount — drive the bootloader's own A/B retry mechanism.
 *
 * Android's ABL reads `bootloader_control` from the `misc` partition at offset 2048.
 * On every boot it decrements tries[current_slot]; at zero it switches slots. The OS
 * marks success[current_slot]=1 to stop the countdown.
 *
 * On UEFI / x86_64 or systems without an Android misc partition, a file-backed store
 * at /var/lib/lrd/bootloader_control (or /run/lrd/bootloader_control) is maintained.
 *
 * Consequence: if a staged update produces a kernel that never reaches userspace,
 * the bootloader falls back to the old slot on its own. No userspace intervention needed.
 *
 * Usage:
 *   lrd-bootcount --status [--json]
 *   lrd-bootcount --arm <a|b> [tries]
 *   lrd-bootcount --decrement [a|b]
 *   lrd-bootcount --mark-success [a|b]
 *   lrd-bootcount --clear
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <sys/stat.h>

#define MISC_DEV          "/dev/block/by-name/misc"
#define FILE_STORE_VAR    "/var/lib/lrd/bootloader_control"
#define FILE_STORE_RUN    "/run/lrd/bootloader_control"
#define BOOT_CTRL_OFF     2048
#define BOOT_CTRL_LEN     32
#define MAX_SLOTS         4
#define BOOT_CTRL_MAGIC   "BLMC"
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
    char c = (s[0] == '_' && s[1]) ? s[1] : s[0];
    if (c == 'a' || c == 'A' || c == '0') return 0;
    if (c == 'b' || c == 'B' || c == '1') return 1;
    return -1;
}

static int read_ctrl(int fd, struct bootloader_control *c) {
    if (pread(fd, c, BOOT_CTRL_LEN, BOOT_CTRL_OFF) != BOOT_CTRL_LEN) return -1;
    if (memcmp(c->magic, BOOT_CTRL_MAGIC, 4) != 0) return 1;   /* 1 = uninitialised */
    uint32_t stored;
    memcpy(&stored, c->crc32_le, 4);
    uint32_t calc = crc32_le(0, (const uint8_t *)c, BOOT_CTRL_LEN - 4);
    if (stored != calc) return 2;                               /* 2 = bad crc */
    if (c->version != BOOT_CTRL_VERSION) return 3;
    return 0;
}

static int write_ctrl(int fd, struct bootloader_control *c) {
    uint32_t crc = crc32_le(0, (const uint8_t *)c, BOOT_CTRL_LEN - 4);
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
    /* Fresh block: all existing slots marked successful */
    for (int i = 0; i < MAX_SLOTS; i++) {
        c->success[i] = 1;
        c->tries[i] = 0;
    }
}

static const char *cur_slot(void) {
    static char buf[16];
    FILE *f = fopen("/proc/cmdline", "r");
    if (f) {
        char line[1024];
        if (fgets(line, sizeof line, f)) {
            char *p = strstr(line, "androidboot.slot_suffix=");
            if (p) {
                p += strlen("androidboot.slot_suffix=");
                size_t n = strcspn(p, " \n");
                if (n < sizeof buf) { memcpy(buf, p, n); buf[n] = 0; fclose(f); return buf; }
            }
            p = strstr(line, "lrd.slot=");
            if (p) {
                p += strlen("lrd.slot=");
                size_t n = strcspn(p, " \n");
                if (n < sizeof buf - 2) {
                    buf[0] = '_';
                    memcpy(buf + 1, p, n);
                    buf[n + 1] = 0;
                    fclose(f);
                    return buf;
                }
            }
        }
        fclose(f);
    }
    const char *e = getenv("LRD_SLOT");
    if (e && *e) {
        if (*e == '_') return e;
        snprintf(buf, sizeof(buf), "_%s", e);
        return buf;
    }
    return "_a";
}

static int open_or_create_store(void) {
    const char *env_path = getenv("LRD_MISC");
    if (env_path && *env_path) {
        int fd = open(env_path, O_RDWR | O_SYNC | O_CREAT, 0600);
        if (fd >= 0) {
            struct stat st;
            if (fstat(fd, &st) == 0 && st.st_size < (BOOT_CTRL_OFF + BOOT_CTRL_LEN)) {
                if (ftruncate(fd, BOOT_CTRL_OFF + BOOT_CTRL_LEN) < 0) { /* ignore */ }
            }
            return fd;
        }
        fprintf(stderr, "lrd-bootcount: cannot open LRD_MISC '%s': %s\n", env_path, strerror(errno));
        return -1;
    }

    /* Check Android misc partition */
    if (access(MISC_DEV, F_OK) == 0) {
        int fd = open(MISC_DEV, O_RDWR | O_SYNC);
        if (fd >= 0) return fd;
    }

    /* Fallback to /var/lib/lrd/bootloader_control */
    mkdir("/var/lib/lrd", 0755);
    int fd = open(FILE_STORE_VAR, O_RDWR | O_SYNC | O_CREAT, 0600);
    if (fd < 0) {
        /* Fallback to /run/lrd/bootloader_control */
        mkdir("/run/lrd", 0755);
        fd = open(FILE_STORE_RUN, O_RDWR | O_SYNC | O_CREAT, 0600);
    }

    if (fd >= 0) {
        struct stat st;
        if (fstat(fd, &st) == 0 && st.st_size < (BOOT_CTRL_OFF + BOOT_CTRL_LEN)) {
            if (ftruncate(fd, BOOT_CTRL_OFF + BOOT_CTRL_LEN) < 0) { /* ignore */ }
        }
        return fd;
    }

    fprintf(stderr, "lrd-bootcount: no accessible boot control store: %s\n", strerror(errno));
    return -1;
}

int main(int argc, char **argv) {
    crc_init();
    int fd = open_or_create_store();
    if (fd < 0) return 1;

    struct bootloader_control c;
    int st = read_ctrl(fd, &c);
    if (st != 0) {
        init_ctrl(&c);
        if (write_ctrl(fd, &c) != 0) {
            perror("lrd-bootcount: write_ctrl init");
            close(fd);
            return 1;
        }
    }

    const char *cmd = argc > 1 ? argv[1] : "--status";
    int json_mode = 0;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--json") == 0) json_mode = 1;
    }

    if (strcmp(cmd, "--status") == 0 || json_mode) {
        const char *cur = cur_slot();
        char cur_letter = (cur[0] == '_' && cur[1]) ? cur[1] : cur[0];
        if (json_mode) {
            printf("{\"slots\":%d,\"current\":\"%c\",\"recovery_tries\":%d,\"slots_info\":[",
                   c.nb_slot, cur_letter, c.recovery_tries_remaining);
            for (int i = 0; i < c.nb_slot && i < MAX_SLOTS; i++) {
                printf("%s{\"slot\":\"%c\",\"success\":%d,\"tries\":%d}",
                       (i > 0 ? "," : ""), 'a' + i, c.success[i], c.tries[i]);
            }
            printf("]}\n");
        } else {
            printf("slots:    %d\n", c.nb_slot);
            printf("current:  %s\n", cur);
            for (int i = 0; i < c.nb_slot && i < MAX_SLOTS; i++) {
                printf("slot %c:   success=%d tries=%d\n", 'a' + i, c.success[i], c.tries[i]);
            }
            printf("recovery_tries_remaining: %d\n", c.recovery_tries_remaining);
        }
        close(fd);
        return 0;
    }

    if (strcmp(cmd, "--arm") == 0) {
        const char *s = argc > 2 ? argv[2] : cur_slot();
        int idx = slot_index(s);
        if (idx < 0 || idx >= c.nb_slot) {
            fprintf(stderr, "lrd-bootcount: invalid slot '%s'\n", s);
            close(fd);
            return 2;
        }
        int tries = argc > 3 ? atoi(argv[3]) : 3;
        if (tries < 1) tries = 1;
        if (tries > 7) tries = 7;
        c.success[idx] = 0;
        c.tries[idx] = (uint8_t)tries;
        if (write_ctrl(fd, &c) != 0) {
            perror("lrd-bootcount: arm write failed");
            close(fd);
            return 1;
        }
        printf("armed slot %c: tries=%d success=0 — bootloader will fall back after %d failed boots\n",
               'a' + idx, tries, tries);
        close(fd);
        return 0;
    }

    if (strcmp(cmd, "--decrement") == 0) {
        const char *s = argc > 2 ? argv[2] : cur_slot();
        int idx = slot_index(s);
        if (idx < 0 || idx >= c.nb_slot) {
            fprintf(stderr, "lrd-bootcount: invalid slot '%s'\n", s);
            close(fd);
            return 2;
        }
        if (c.tries[idx] > 0) {
            c.tries[idx]--;
        }
        int active_idx = idx;
        if (c.tries[idx] == 0 && c.success[idx] == 0) {
            /* Fallback to alternate slot */
            active_idx = (idx == 0) ? 1 : 0;
            printf("slot %c exhausted retry count! Rolling back to slot %c\n",
                   'a' + idx, 'a' + active_idx);
        } else {
            printf("slot %c: decremented tries=%d success=%d\n",
                   'a' + idx, c.tries[idx], c.success[idx]);
        }
        if (write_ctrl(fd, &c) != 0) {
            perror("lrd-bootcount: decrement write failed");
            close(fd);
            return 1;
        }
        close(fd);
        return (c.tries[idx] == 0 && c.success[idx] == 0) ? 10 : 0;
    }

    if (strcmp(cmd, "--mark-success") == 0) {
        const char *s = argc > 2 ? argv[2] : cur_slot();
        int idx = slot_index(s);
        if (idx < 0 || idx >= c.nb_slot) {
            fprintf(stderr, "lrd-bootcount: invalid slot '%s'\n", s);
            close(fd);
            return 2;
        }
        c.success[idx] = 1;
        c.tries[idx] = 0;
        if (write_ctrl(fd, &c) != 0) {
            perror("lrd-bootcount: mark-success write failed");
            close(fd);
            return 1;
        }
        printf("slot %c marked successful — countdown cancelled\n", 'a' + idx);
        close(fd);
        return 0;
    }

    if (strcmp(cmd, "--clear") == 0) {
        for (int i = 0; i < MAX_SLOTS; i++) {
            c.success[i] = 1;
            c.tries[i] = 0;
        }
        if (write_ctrl(fd, &c) != 0) {
            perror("lrd-bootcount: clear write failed");
            close(fd);
            return 1;
        }
        printf("both slots cleared to success=1 tries=0\n");
        close(fd);
        return 0;
    }

    fprintf(stderr, "usage: lrd-bootcount {--status [--json]|--arm <a|b> [tries]|--decrement [a|b]|--mark-success [a|b]|--clear}\n");
    close(fd);
    return 64;
}
