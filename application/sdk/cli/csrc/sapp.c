#include "../../core/sandbox/csrc/sap_sandbox.h"
#include "../../packaging/csrc/sap_packaging.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>

void print_help(void) {
    printf("Sovereign Application Platform Developer Tool (sapp v1.0.0)\n");
    printf("\nCommands:\n");
    printf("  sapp create <app_id>                   Scaffold a new sovereign app\n");
    printf("  sapp keygen <priv_key> <pub_key>       Generate developer Ed25519 keypair\n");
    printf("  sapp build <dir> [out.sap] [priv_key]  Build bit-for-bit deterministic .sap package\n");
    printf("  sapp sign <manifest> <priv_key> [sig]  Sign manifest with Ed25519 key\n");
    printf("  sapp verify <package.sap> [pub_key]    Verify signatures, manifest, and SBOM\n");
    printf("  sapp run <app_id> [exec] [args...]     Launch inside Landlock + Seccomp sandbox\n");
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        print_help();
        return 1;
    }

    const char* cmd = argv[1];

    if (strcmp(cmd, "create") == 0) {
        const char* app_id = (argc >= 3) ? argv[2] : "org.sovereign.sample";
        printf("==> Scaffolding sovereign project '%s'...\n", app_id);
        mkdir(app_id, 0755);

        char bin_dir[256];
        snprintf(bin_dir, sizeof(bin_dir), "%s/bin", app_id);
        mkdir(bin_dir, 0755);

        char manifest_path[256];
        snprintf(manifest_path, sizeof(manifest_path), "%s/sap.manifest.json", app_id);
        FILE* f = fopen(manifest_path, "w");
        if (f) {
            fprintf(f, "{\n"
                       "  \"schemaVersion\": \"1.0.0\",\n"
                       "  \"appId\": \"%s\",\n"
                       "  \"version\": \"1.0.0\",\n"
                       "  \"name\": \"Sovereign Sample App\",\n"
                       "  \"entrypoint\": \"bin/app\",\n"
                       "  \"capabilities\": [\"CAP_AI_INFERENCE\", \"CAP_AUDIO_OUTPUT\"]\n"
                       "}\n", app_id);
            fclose(f);
            printf("    Created manifest: %s\n", manifest_path);
        }
        return 0;
    }

    if (strcmp(cmd, "keygen") == 0) {
        const char* priv = (argc >= 3) ? argv[2] : "developer.key";
        const char* pub = (argc >= 4) ? argv[3] : "developer.pub";
        printf("==> Generating Ed25519 Keypair: %s & %s...\n", priv, pub);
        int ret = sap_pkg_generate_keypair(priv, pub);
        if (ret == 0) {
            printf("    Keys generated successfully!\n");
        } else {
            fprintf(stderr, "    Error generating keys: %d\n", ret);
        }
        return ret;
    }

    if (strcmp(cmd, "build") == 0) {
        const char* src_dir = (argc >= 3) ? argv[2] : ".";
        const char* out_sap = (argc >= 4) ? argv[3] : "out/app.sap";
        const char* priv_key = (argc >= 5) ? argv[4] : NULL;

        printf("==> Building deterministic .sap package from '%s'...\n", src_dir);
        mkdir("out", 0755);
        int ret = sap_pkg_build(src_dir, out_sap, priv_key);
        if (ret == 0) {
            printf("    [PASS] Package built: %s\n", out_sap);
        } else {
            fprintf(stderr, "    [FAIL] Build error: %d\n", ret);
        }
        return ret;
    }

    if (strcmp(cmd, "sign") == 0) {
        if (argc < 4) {
            fprintf(stderr, "Usage: sapp sign <manifest_path> <priv_key_path> [sig_out_path]\n");
            return 1;
        }
        const char* mf = argv[2];
        const char* key = argv[3];
        const char* sig = (argc >= 5) ? argv[4] : "sap.manifest.json.sig";

        printf("==> Signing '%s' with Ed25519 key '%s'...\n", mf, key);
        int ret = sap_pkg_sign_file(mf, key, sig);
        if (ret == 0) {
            printf("    [PASS] Signature written to: %s\n", sig);
        } else {
            fprintf(stderr, "    [FAIL] Signing error: %d\n", ret);
        }
        return ret;
    }

    if (strcmp(cmd, "verify") == 0) {
        const char* pkg = (argc >= 3) ? argv[2] : "out/app.sap";
        const char* pub_key = (argc >= 4) ? argv[3] : NULL;

        printf("==> Verifying package '%s'...\n", pkg);
        int ret = sap_pkg_verify_package(pkg, pub_key);
        if (ret == 0) {
            printf("    [PASS] All cryptographic, manifest, and SBOM invariants VERIFIED!\n");
        } else {
            fprintf(stderr, "    [FAIL] Verification failed (code: %d)!\n", ret);
        }
        return ret;
    }

    if (strcmp(cmd, "run") == 0) {
        const char* app_id = (argc >= 3) ? argv[2] : "org.sovereign.demo";
        const char* exec_target = (argc >= 4) ? argv[3] : "/bin/echo";

        printf("==> Launching '%s' in Sovereign Landlock + Seccomp sandbox...\n", app_id);

        SapSandboxConfig cfg;
        char data_dir[256];
        snprintf(data_dir, sizeof(data_dir), "/tmp/sap_data_%s", app_id);
        sap_sandbox_init_config(&cfg, app_id, data_dir, "/tmp");

        char* sub_argv[8];
        int sub_argc = 0;
        sub_argv[sub_argc++] = (char*)exec_target;
        if (argc >= 4) {
            for (int i = 4; i < argc && sub_argc < 7; i++) {
                sub_argv[sub_argc++] = argv[i];
            }
        } else {
            sub_argv[sub_argc++] = (char*)"[SAPP RUN] Process running inside Landlock/Seccomp sandbox!";
        }
        sub_argv[sub_argc] = NULL;

        int ret = sap_sandbox_exec(&cfg, exec_target, sub_argv);
        printf("==> Application exited with code: %d\n", ret);
        return ret;
    }

    fprintf(stderr, "Unknown command: %s\n", cmd);
    print_help();
    return 1;
}
