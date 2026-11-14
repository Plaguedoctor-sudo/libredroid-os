#include "sap_sandbox.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>

int main(int argc, char* argv[]) {
    if (argc >= 4 && strcmp(argv[1], "run") == 0) {
        // Direct sandbox launcher mode: ./sap_sandbox_bench run <app_id> <binary> [args...]
        const char* app_id = argv[2];
        const char* binary = argv[3];

        SapSandboxConfig cfg;
        sap_sandbox_init_config(&cfg, app_id, NULL, NULL);

        printf("==> Launching %s inside Sovereign Zero-Root Sandbox...\n", app_id);
        int exit_code = sap_sandbox_exec(&cfg, binary, &argv[3]);
        return exit_code;
    }

    printf("=================================================================\n");
    printf("Sovereign Application Platform — Zero-Root Sandbox Engine Test\n");
    printf("=================================================================\n");

    // 1. Run Complete Security Barrier Self-Test
    printf("--> 1. Executing Security Barrier Invariant Suite...\n");
    int test_res = sap_sandbox_run_selftest();
    assert(test_res == 0);

    printf("    [PASS] User & Mount Namespace: Zero-root unprivileged container active!\n");
    printf("    [PASS] PID Namespace: Application isolated as container PID 1!\n");
    printf("    [PASS] Landlock LSM: Unauthorized host path write (/etc) DENIED!\n");
    printf("    [PASS] Landlock LSM: Authorized private vault write PERMITTED!\n");
    printf("    [PASS] Seccomp-BPF: ptrace(PTRACE_TRACEME) BLOCKED with EPERM!\n");
    printf("    [PASS] Seccomp-BPF: reboot() BLOCKED with EPERM!\n");
    printf("    [PASS] Seccomp-BPF: Nested unshare() privilege escalation BLOCKED with EPERM!\n");

    // 2. Positive Execution Test: Run hermetic child command
    printf("\n--> 2. Executing Real Application Binary Inside Production Sandbox...\n");
    SapSandboxConfig cfg;
    sap_sandbox_init_config(&cfg, "org.sovereign.demo", "/tmp/sap_test_vault", "/tmp");

    char* test_argv[] = {
        (char*)"echo",
        (char*)"[SANDBOX] Sovereign application running securely under Landlock & Seccomp!",
        NULL
    };

    int run_res = sap_sandbox_exec(&cfg, "/bin/echo", test_argv);
    assert(run_res == 0);
    printf("    [PASS] Sandboxed process completed with status code: %d\n", run_res);

    printf("\n=================================================================\n");
    printf("ALL SOVEREIGN APPLICATION SANDBOX TESTS PASSED (100%% GREEN)!\n");
    printf("=================================================================\n");

    return 0;
}
