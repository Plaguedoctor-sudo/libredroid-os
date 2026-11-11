/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack Landlock Sandboxing Driver (Task 2.4)
 * Applies unprivileged Linux Landlock filesystem restriction before executing command.
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

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s [--test] <command> [args...]\n", argv[0]);
        return 1;
    }

    if (strcmp(argv[1], "--test") == 0) {
        int abi = syscall(__NR_landlock_create_ruleset, NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);
        if (abi >= 1) {
            printf("Landlock ABI version: %d (Supported)\n", abi);
            return 0;
        } else {
            printf("Landlock unsupported (errno %d)\n", errno);
            return 0;
        }
    }

    struct landlock_ruleset_attr attr = {
        .handled_access_fs = LANDLOCK_ACCESS_FS_EXECUTE |
                             LANDLOCK_ACCESS_FS_READ_FILE |
                             LANDLOCK_ACCESS_FS_READ_DIR,
    };

    int abi = syscall(__NR_landlock_create_ruleset, NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);
    if (abi >= 1) {
        int ruleset_fd = syscall(__NR_landlock_create_ruleset, &attr, sizeof(attr), 0);
        if (ruleset_fd >= 0) {
            // Allow read/exec for /usr, /bin, /lib, /lib64
            const char *allowed_paths[] = {"/usr", "/bin", "/lib", "/lib64", "/etc"};
            for (size_t i = 0; i < sizeof(allowed_paths)/sizeof(allowed_paths[0]); i++) {
                int pfd = open(allowed_paths[i], O_PATH | O_DIRECTORY | O_CLOEXEC);
                if (pfd >= 0) {
                    struct landlock_path_beneath_attr path_attr = {
                        .allowed_access = LANDLOCK_ACCESS_FS_EXECUTE |
                                          LANDLOCK_ACCESS_FS_READ_FILE |
                                          LANDLOCK_ACCESS_FS_READ_DIR,
                        .parent_fd = pfd,
                    };
                    syscall(__NR_landlock_add_rule, ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path_attr, 0);
                    close(pfd);
                }
            }

            prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);
            syscall(__NR_landlock_restrict_self, ruleset_fd, 0);
            close(ruleset_fd);
        }
    }

    execvp(argv[1], &argv[1]);
    perror("execvp");
    return 127;
}
