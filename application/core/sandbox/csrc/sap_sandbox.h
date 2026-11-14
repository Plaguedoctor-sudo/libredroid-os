#ifndef SAP_SANDBOX_H
#define SAP_SANDBOX_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <sys/types.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char app_id[64];
    char bundle_dir[256];
    char data_dir[256];
    bool network_allowed;
    bool audio_allowed;
    bool wayland_allowed;
    uint64_t max_memory_mb;
    uint32_t cpu_weight;
} SapSandboxConfig;

// Initialize sandbox configuration with secure defaults
int sap_sandbox_init_config(SapSandboxConfig* cfg,
                            const char* app_id,
                            const char* data_dir,
                            const char* bundle_dir);

// Configure Linux user, PID, mount, and network namespaces
int sap_sandbox_setup_namespaces(bool isolate_network);

// Apply Landlock LSM filesystem restriction ruleset
int sap_sandbox_apply_landlock(const SapSandboxConfig* cfg);

// Compile and load Seccomp-BPF system call filtering
int sap_sandbox_apply_seccomp(bool allow_network);

// Launch target application inside the sandbox
int sap_sandbox_exec(const SapSandboxConfig* cfg, const char* executable, char* const argv[]);

// Run self-test verifying all four sandbox barriers
int sap_sandbox_run_selftest(void);

#ifdef __cplusplus
}
#endif

#endif // SAP_SANDBOX_H
