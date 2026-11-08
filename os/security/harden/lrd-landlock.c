/*
 * LibreDroid Landlock LSM Sandboxing Enforcer (lrd-landlock)
 * Applies unprivileged Linux Landlock LSM restrictions (Kernel 5.13+)
 * confining processes to read-only rootfs and designated read-write paths.
 */

#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/syscall.h>
#include <sys/prctl.h>
#include <linux/landlock.h>
#include <linux/prctl.h>

#ifndef __NR_landlock_create_ruleset
#if defined(__x86_64__)
#define __NR_landlock_create_ruleset 444
#define __NR_landlock_add_rule 445
#define __NR_landlock_restrict_self 446
#elif defined(__aarch64__)
#define __NR_landlock_create_ruleset 444
#define __NR_landlock_add_rule 445
#define __NR_landlock_restrict_self 446
#endif
#endif

#ifndef LANDLOCK_ACCESS_FS_EXECUTE
#define LANDLOCK_ACCESS_FS_EXECUTE (1ULL << 0)
#define LANDLOCK_ACCESS_FS_WRITE_FILE (1ULL << 1)
#define LANDLOCK_ACCESS_FS_READ_FILE (1ULL << 2)
#define LANDLOCK_ACCESS_FS_READ_DIR (1ULL << 3)
#define LANDLOCK_ACCESS_FS_REMOVE_DIR (1ULL << 4)
#define LANDLOCK_ACCESS_FS_REMOVE_FILE (1ULL << 5)
#define LANDLOCK_ACCESS_FS_MAKE_CHAR (1ULL << 6)
#define LANDLOCK_ACCESS_FS_MAKE_DIR (1ULL << 7)
#define LANDLOCK_ACCESS_FS_MAKE_REG (1ULL << 8)
#define LANDLOCK_ACCESS_FS_MAKE_SOCK (1ULL << 9)
#define LANDLOCK_ACCESS_FS_MAKE_FIFO (1ULL << 10)
#define LANDLOCK_ACCESS_FS_MAKE_BLOCK (1ULL << 11)
#define LANDLOCK_ACCESS_FS_MAKE_SYM (1ULL << 12)
#endif

static int landlock_create_ruleset(const struct landlock_ruleset_attr *attr, size_t size, __u32 flags) {
    return syscall(__NR_landlock_create_ruleset, attr, size, flags);
}

static int landlock_add_rule(int ruleset_fd, enum landlock_rule_type rule_type, const void *rule_attr, __u32 flags) {
    return syscall(__NR_landlock_add_rule, ruleset_fd, rule_type, rule_attr, flags);
}

static int landlock_restrict_self(int ruleset_fd, __u32 flags) {
    return syscall(__NR_landlock_restrict_self, ruleset_fd, flags);
}

int main(int argc, char **argv) {
    if (argc < 3) {
        printf("Usage: %s <rw_directory> <command> [args...]\n", argv[0]);
        printf("Enforces Linux Landlock LSM sandboxing on target command.\n");
        return 1;
    }

    const char *rw_dir = argv[1];
    char **cmd_argv = &argv[2];

    // Check Landlock ABI support in kernel
    int abi = landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);
    if (abi < 0) {
        // Kernel does not support Landlock; fall back cleanly with warning
        fprintf(stderr, "[lrd-landlock] Notice: Kernel Landlock LSM not active (ABI=%d); falling back to normal execution\n", abi);
        execvp(cmd_argv[0], cmd_argv);
        perror("execvp");
        return 1;
    }

    struct landlock_ruleset_attr ruleset_attr = {
        .handled_access_fs = LANDLOCK_ACCESS_FS_EXECUTE |
                             LANDLOCK_ACCESS_FS_READ_FILE |
                             LANDLOCK_ACCESS_FS_READ_DIR |
                             LANDLOCK_ACCESS_FS_WRITE_FILE |
                             LANDLOCK_ACCESS_FS_REMOVE_FILE |
                             LANDLOCK_ACCESS_FS_MAKE_REG |
                             LANDLOCK_ACCESS_FS_MAKE_DIR,
    };

    int ruleset_fd = landlock_create_ruleset(&ruleset_attr, sizeof(ruleset_attr), 0);
    if (ruleset_fd >= 0) {
        // 1. Grant Read-Only access to system directories (/usr, /lib, /etc, /bin)
        const char *ro_paths[] = {"/usr", "/lib", "/etc", "/bin", "/dev", NULL};
        for (int i = 0; ro_paths[i]; i++) {
            int fd = open(ro_paths[i], O_PATH | O_CLOEXEC);
            if (fd >= 0) {
                struct landlock_path_beneath_attr path_attr = {
                    .allowed_access = LANDLOCK_ACCESS_FS_EXECUTE | LANDLOCK_ACCESS_FS_READ_FILE | LANDLOCK_ACCESS_FS_READ_DIR,
                    .parent_fd = fd,
                };
                landlock_add_rule(ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path_attr, 0);
                close(fd);
            }
        }

        // 2. Grant Read-Write access ONLY to the designated user directory
        int rw_fd = open(rw_dir, O_PATH | O_CLOEXEC);
        if (rw_fd >= 0) {
            struct landlock_path_beneath_attr path_attr = {
                .allowed_access = ruleset_attr.handled_access_fs,
                .parent_fd = rw_fd,
            };
            landlock_add_rule(ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path_attr, 0);
            close(rw_fd);
        }

        // Prevent acquiring new privileges
        prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);

        // Restrict self
        if (landlock_restrict_self(ruleset_fd, 0) == 0) {
            printf("[lrd-landlock] Landlock LSM sandboxing active (RW restricted to: %s)\n", rw_dir);
        }
        close(ruleset_fd);
    }

    execvp(cmd_argv[0], cmd_argv);
    perror("execvp");
    return 1;
}
