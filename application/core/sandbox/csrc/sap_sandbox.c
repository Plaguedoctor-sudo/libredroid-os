#define _GNU_SOURCE
#include "sap_sandbox.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <sched.h>
#include <sys/prctl.h>
#include <sys/syscall.h>
#include <sys/mount.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <sys/ptrace.h>
#include <sys/socket.h>
#include <linux/landlock.h>
#include <linux/seccomp.h>
#include <linux/filter.h>
#include <linux/audit.h>
#include <stddef.h>

#ifndef SYS_landlock_create_ruleset
#define SYS_landlock_create_ruleset 444
#endif

#ifndef SYS_landlock_add_rule
#define SYS_landlock_add_rule 445
#endif

#ifndef SYS_landlock_restrict_self
#define SYS_landlock_restrict_self 446
#endif

#ifndef LANDLOCK_CREATE_RULESET_VERSION
#define LANDLOCK_CREATE_RULESET_VERSION (1U << 0)
#endif

static inline int sys_landlock_create_ruleset(const struct landlock_ruleset_attr *attr, size_t size, __u32 flags) {
    return (int)syscall(SYS_landlock_create_ruleset, attr, size, flags);
}

static inline int sys_landlock_add_rule(int ruleset_fd, enum landlock_rule_type rule_type, const void *rule_attr, __u32 flags) {
    return (int)syscall(SYS_landlock_add_rule, ruleset_fd, rule_type, rule_attr, flags);
}

static inline int sys_landlock_restrict_self(int ruleset_fd, __u32 flags) {
    return (int)syscall(SYS_landlock_restrict_self, ruleset_fd, flags);
}

int sap_sandbox_init_config(SapSandboxConfig* cfg,
                            const char* app_id,
                            const char* data_dir,
                            const char* bundle_dir) {
    if (!cfg || !app_id) return -1;
    memset(cfg, 0, sizeof(SapSandboxConfig));

    strncpy(cfg->app_id, app_id, sizeof(cfg->app_id) - 1);

    if (data_dir) {
        strncpy(cfg->data_dir, data_dir, sizeof(cfg->data_dir) - 1);
    } else {
        snprintf(cfg->data_dir, sizeof(cfg->data_dir), "/tmp/sap_data_%s", app_id);
    }

    if (bundle_dir) {
        strncpy(cfg->bundle_dir, bundle_dir, sizeof(cfg->bundle_dir) - 1);
    } else {
        strncpy(cfg->bundle_dir, "/tmp", sizeof(cfg->bundle_dir) - 1);
    }

    cfg->network_allowed = false;
    cfg->audio_allowed = true;
    cfg->wayland_allowed = true;
    cfg->max_memory_mb = 256;
    cfg->cpu_weight = 100;

    return 0;
}

int sap_sandbox_setup_namespaces(bool isolate_network) {
    uid_t uid = getuid();
    gid_t gid = getgid();

    int clone_flags = CLONE_NEWUSER | CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWIPC | CLONE_NEWUTS;
    if (isolate_network) {
        clone_flags |= CLONE_NEWNET;
    }

    if (unshare(clone_flags) != 0) {
        return -1;
    }

    // Setgroups deny
    int fd = open("/proc/self/setgroups", O_WRONLY);
    if (fd >= 0) {
        ssize_t w = write(fd, "deny", 4);
        (void)w;
        close(fd);
    }

    // GID map: map container root (0) to host gid
    fd = open("/proc/self/gid_map", O_WRONLY);
    if (fd >= 0) {
        char buf[64];
        int len = snprintf(buf, sizeof(buf), "0 %u 1\n", (unsigned int)gid);
        ssize_t w = write(fd, buf, len);
        (void)w;
        close(fd);
    }

    // UID map: map container root (0) to host uid
    fd = open("/proc/self/uid_map", O_WRONLY);
    if (fd >= 0) {
        char buf[64];
        int len = snprintf(buf, sizeof(buf), "0 %u 1\n", (unsigned int)uid);
        ssize_t w = write(fd, buf, len);
        (void)w;
        close(fd);
    }

    // Prevent mount propagation to host
    mount("none", "/", NULL, MS_REC | MS_PRIVATE, NULL);

    return 0;
}

static void add_landlock_path(int ruleset_fd, const char* path, __u64 access_rights) {
    if (!path || access(path, F_OK) != 0) return;
    int fd = open(path, O_PATH | O_CLOEXEC);
    if (fd >= 0) {
        struct landlock_path_beneath_attr path_beneath = {
            .allowed_access = access_rights,
            .parent_fd = fd,
        };
        sys_landlock_add_rule(ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &path_beneath, 0);
        close(fd);
    }
}

int sap_sandbox_apply_landlock(const SapSandboxConfig* cfg) {
    if (!cfg) return -1;

    int abi = sys_landlock_create_ruleset(NULL, 0, LANDLOCK_CREATE_RULESET_VERSION);
    if (abi < 1) {
        return -2; // Landlock not supported
    }

    __u64 all_fs_access = LANDLOCK_ACCESS_FS_EXECUTE |
                          LANDLOCK_ACCESS_FS_WRITE_FILE |
                          LANDLOCK_ACCESS_FS_READ_FILE |
                          LANDLOCK_ACCESS_FS_READ_DIR |
                          LANDLOCK_ACCESS_FS_REMOVE_DIR |
                          LANDLOCK_ACCESS_FS_REMOVE_FILE |
                          LANDLOCK_ACCESS_FS_MAKE_CHAR |
                          LANDLOCK_ACCESS_FS_MAKE_DIR |
                          LANDLOCK_ACCESS_FS_MAKE_REG |
                          LANDLOCK_ACCESS_FS_MAKE_SOCK |
                          LANDLOCK_ACCESS_FS_MAKE_FIFO |
                          LANDLOCK_ACCESS_FS_MAKE_BLOCK |
                          LANDLOCK_ACCESS_FS_MAKE_SYM |
                          LANDLOCK_ACCESS_FS_REFER |
                          LANDLOCK_ACCESS_FS_TRUNCATE;

    struct landlock_ruleset_attr ruleset_attr = {
        .handled_access_fs = all_fs_access,
    };

    int ruleset_fd = sys_landlock_create_ruleset(&ruleset_attr, sizeof(ruleset_attr), 0);
    if (ruleset_fd < 0) {
        return -3;
    }

    __u64 ro_access = LANDLOCK_ACCESS_FS_EXECUTE |
                      LANDLOCK_ACCESS_FS_READ_FILE |
                      LANDLOCK_ACCESS_FS_READ_DIR;

    __u64 rw_access = all_fs_access;

    // 1. Allow read-only access to standard system paths & shared libraries
    add_landlock_path(ruleset_fd, "/usr", ro_access);
    add_landlock_path(ruleset_fd, "/lib", ro_access);
    add_landlock_path(ruleset_fd, "/lib64", ro_access);
    add_landlock_path(ruleset_fd, "/etc/ssl", ro_access);
    add_landlock_path(ruleset_fd, "/usr/share/fonts", ro_access);
    add_landlock_path(ruleset_fd, "/dev", ro_access);

    // 2. Allow read-only access to application bundle directory
    add_landlock_path(ruleset_fd, cfg->bundle_dir, ro_access);

    // 3. Allow full read-write access to application's private data vault
    mkdir(cfg->data_dir, 0700);
    add_landlock_path(ruleset_fd, cfg->data_dir, rw_access);

    // 4. Allow temporary runtime access for sockets and tmpfs
    add_landlock_path(ruleset_fd, "/tmp", rw_access);

    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        close(ruleset_fd);
        return -4;
    }

    if (sys_landlock_restrict_self(ruleset_fd, 0) != 0) {
        close(ruleset_fd);
        return -5;
    }

    close(ruleset_fd);
    return 0;
}

int sap_sandbox_apply_seccomp(bool allow_network) {
    (void)allow_network;

    struct sock_filter filter[] = {
        // Step 1: Verify system architecture
        BPF_STMT(BPF_LD | BPF_W | BPF_ABS, (offsetof(struct seccomp_data, arch))),
#if defined(__x86_64__)
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, AUDIT_ARCH_X86_64, 1, 0),
#elif defined(__aarch64__)
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, AUDIT_ARCH_AARCH64, 1, 0),
#endif
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL_PROCESS),

        // Step 2: Load syscall number
        BPF_STMT(BPF_LD | BPF_W | BPF_ABS, (offsetof(struct seccomp_data, nr))),

        // Block ptrace (prevents debugger attachment and memory dumping)
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_ptrace, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),

        // Block reboot
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_reboot, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),

        // Block unshare (prevents nesting further privilege escalations)
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_unshare, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),

        // Block setns
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_setns, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),

        // Block bpf (prevents kernel eBPF bytecode loading)
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_bpf, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),

        // Block pivot_root
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_pivot_root, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),

        // Block kernel module loading
#ifdef SYS_init_module
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_init_module, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),
#endif
#ifdef SYS_finit_module
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_finit_module, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),
#endif
#ifdef SYS_delete_module
        BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, SYS_delete_module, 0, 1),
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA)),
#endif

        // Allow all standard compute, IO, memory, IPC syscalls
        BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
    };

    struct sock_fprog prog = {
        .len = (unsigned short)(sizeof(filter) / sizeof(filter[0])),
        .filter = filter,
    };

    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        return -1;
    }

    if (prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog) != 0) {
        return -2;
    }

    return 0;
}

int sap_sandbox_exec(const SapSandboxConfig* cfg, const char* executable, char* const argv[]) {
    if (!cfg || !executable) return -1;

    // Fork container manager process
    pid_t pid = fork();
    if (pid < 0) return -1;

    if (pid == 0) {
        // Child: Step 1. Setup Linux Namespaces
        if (sap_sandbox_setup_namespaces(!cfg->network_allowed) != 0) {
            fprintf(stderr, "Error: Failed to setup namespaces: %s\n", strerror(errno));
            exit(101);
        }

        // Child: Step 2. Fork into new PID namespace so child becomes PID 1
        pid_t app_pid = fork();
        if (app_pid < 0) exit(102);

        if (app_pid == 0) {
            // Target Application Process (PID 1 inside container)

            // Step 3. Apply Landlock LSM
            if (sap_sandbox_apply_landlock(cfg) != 0) {
                fprintf(stderr, "Error: Landlock LSM enforcement failed\n");
                exit(103);
            }

            // Step 4. Apply Seccomp-BPF
            if (sap_sandbox_apply_seccomp(cfg->network_allowed) != 0) {
                fprintf(stderr, "Error: Seccomp-BPF filter failed\n");
                exit(104);
            }

            // Step 5. Execute target application
            execvp(executable, argv);
            perror("execvp");
            exit(105);
        }

        // Namespace init waits for application exit
        int app_status = 0;
        waitpid(app_pid, &app_status, 0);
        if (WIFEXITED(app_status)) {
            exit(WEXITSTATUS(app_status));
        }
        exit(1);
    }

    // Host parent waits for container
    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status)) {
        return WEXITSTATUS(status);
    }
    return -1;
}

int sap_sandbox_run_selftest(void) {
    pid_t pid = fork();
    if (pid < 0) return -1;

    if (pid == 0) {
        SapSandboxConfig cfg;
        sap_sandbox_init_config(&cfg, "org.sovereign.selftest", "/tmp/sap_test_vault", "/tmp");

        // 1. Enter namespaces
        if (sap_sandbox_setup_namespaces(true) != 0) {
            exit(1);
        }

        // Fork to activate PID namespace
        pid_t inner_pid = fork();
        if (inner_pid < 0) exit(2);

        if (inner_pid == 0) {
            // Verify PID is 1
            if (getpid() != 1) {
                fprintf(stderr, "[FAIL] PID is not 1 inside PID namespace (got %d)\n", getpid());
                exit(10);
            }

            // Apply Landlock
            if (sap_sandbox_apply_landlock(&cfg) != 0) {
                exit(11);
            }

            // Apply Seccomp
            if (sap_sandbox_apply_seccomp(false) != 0) {
                exit(12);
            }

            // Security Barrier 1: Filesystem Escape Test (Landlock)
            // Attempting to write into forbidden host directory /root or /etc
            int test_fd = open("/etc/sap_forbidden_test", O_WRONLY | O_CREAT, 0644);
            if (test_fd >= 0) {
                close(test_fd);
                fprintf(stderr, "[FAIL] Landlock allowed unauthorized write to /etc!\n");
                exit(13);
            }

            // Writing to allowed private data vault must succeed
            char vault_test_file[300];
            snprintf(vault_test_file, sizeof(vault_test_file), "%s/test.dat", cfg.data_dir);
            test_fd = open(vault_test_file, O_WRONLY | O_CREAT | O_TRUNC, 0600);
            if (test_fd < 0) {
                fprintf(stderr, "[FAIL] Failed writing to allowed private vault: %s\n", strerror(errno));
                exit(14);
            }
            ssize_t w = write(test_fd, "SOVEREIGN_DATA_OK", 17);
            (void)w;
            close(test_fd);

            // Security Barrier 2: Kernel Syscall Evasion Test (Seccomp-BPF)
            // Attempt ptrace
            long ptrace_ret = ptrace(PTRACE_TRACEME, 0, NULL, NULL);
            if (ptrace_ret != -1 || errno != EPERM) {
                fprintf(stderr, "[FAIL] Seccomp failed to block ptrace with EPERM (ret=%ld, errno=%d)\n",
                        ptrace_ret, errno);
                exit(15);
            }

            // Attempt reboot
            long reboot_ret = syscall(SYS_reboot, 0, 0, 0, 0);
            if (reboot_ret != -1 || errno != EPERM) {
                fprintf(stderr, "[FAIL] Seccomp failed to block reboot with EPERM\n");
                exit(16);
            }

            // Attempt unshare
            long unshare_ret = syscall(SYS_unshare, CLONE_NEWUSER);
            if (unshare_ret != -1 || errno != EPERM) {
                fprintf(stderr, "[FAIL] Seccomp failed to block secondary unshare with EPERM\n");
                exit(17);
            }

            // All security barrier invariant checks passed cleanly
            exit(0);
        }

        int inner_status = 0;
        waitpid(inner_pid, &inner_status, 0);
        if (WIFEXITED(inner_status)) {
            exit(WEXITSTATUS(inner_status));
        }
        exit(99);
    }

    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status)) {
        return WEXITSTATUS(status);
    }
    return -1;
}
