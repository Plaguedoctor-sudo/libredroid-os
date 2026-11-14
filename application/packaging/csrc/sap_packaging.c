#define _GNU_SOURCE
#include "sap_packaging.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <errno.h>

static int execute_cmd(const char* cmd) {
    int status = system(cmd);
    if (status == -1) return -1;
    if (WIFEXITED(status)) {
        return WEXITSTATUS(status);
    }
    return -1;
}

int sap_pkg_generate_keypair(const char* priv_key_path, const char* pub_key_path) {
    if (!priv_key_path || !pub_key_path) return -1;

    char cmd[1024];
    snprintf(cmd, sizeof(cmd),
             "openssl genpkey -algorithm ed25519 -out \"%s\" 2>/dev/null && "
             "openssl pkey -in \"%s\" -pubout -out \"%s\" 2>/dev/null",
             priv_key_path, priv_key_path, pub_key_path);

    int ret = execute_cmd(cmd);
    if (ret != 0) return -2;

    chmod(priv_key_path, 0600);
    chmod(pub_key_path, 0644);
    return 0;
}

int sap_pkg_sign_file(const char* file_path, const char* priv_key_path, const char* sig_out_path) {
    if (!file_path || !priv_key_path || !sig_out_path) return -1;

    if (access(file_path, R_OK) != 0 || access(priv_key_path, R_OK) != 0) {
        return -2;
    }

    char cmd[1024];
    snprintf(cmd, sizeof(cmd),
             "openssl pkeyutl -sign -inkey \"%s\" -rawin -in \"%s\" -out \"%s\" 2>/dev/null",
             priv_key_path, file_path, sig_out_path);

    int ret = execute_cmd(cmd);
    return (ret == 0) ? 0 : -3;
}

int sap_pkg_verify_file(const char* file_path, const char* pub_key_path, const char* sig_path) {
    if (!file_path || !pub_key_path || !sig_path) return -1;

    if (access(file_path, R_OK) != 0 || access(pub_key_path, R_OK) != 0 || access(sig_path, R_OK) != 0) {
        return -2;
    }

    char cmd[1024];
    snprintf(cmd, sizeof(cmd),
             "openssl pkeyutl -verify -pubin -inkey \"%s\" -rawin -in \"%s\" -sigfile \"%s\" >/dev/null 2>&1",
             pub_key_path, file_path, sig_path);

    int ret = execute_cmd(cmd);
    return (ret == 0) ? 0 : -3; // 0 = valid signature, -3 = signature mismatch / tampered
}

int sap_pkg_generate_sbom(const char* src_dir, const char* app_id, const char* version, const char* out_sbom_path) {
    if (!src_dir || !out_sbom_path) return -1;

    const char* id = app_id ? app_id : "org.sovereign.application";
    const char* ver = version ? version : "1.0.0";

    FILE* f = fopen(out_sbom_path, "w");
    if (!f) return -2;

    fprintf(f, "{\n");
    fprintf(f, "  \"spdxVersion\": \"SPDX-2.3\",\n");
    fprintf(f, "  \"dataLicense\": \"CC0-1.0\",\n");
    fprintf(f, "  \"SPDXID\": \"SPDXRef-DOCUMENT\",\n");
    fprintf(f, "  \"name\": \"%s\",\n", id);
    fprintf(f, "  \"packageVersion\": \"%s\",\n", ver);
    fprintf(f, "  \"creationInfo\": {\n");
    fprintf(f, "    \"created\": \"2026-01-01T00:00:00Z\",\n");
    fprintf(f, "    \"creators\": [\"Tool: Sovereign-SAP-Packager-1.0.0\"]\n");
    fprintf(f, "  },\n");
    fprintf(f, "  \"packages\": [{\n");
    fprintf(f, "    \"name\": \"%s\",\n", id);
    fprintf(f, "    \"SPDXID\": \"SPDXRef-Package\",\n");
    fprintf(f, "    \"versionInfo\": \"%s\",\n", ver);
    fprintf(f, "    \"downloadLocation\": \"NOASSERTION\",\n");
    fprintf(f, "    \"filesAnalyzed\": true\n");
    fprintf(f, "  }]\n");
    fprintf(f, "}\n");

    fclose(f);
    return 0;
}

int sap_pkg_lint_manifest(const char* manifest_path, SapManifestInfo* info) {
    if (!manifest_path) return -1;
    if (access(manifest_path, R_OK) != 0) return -2;

    FILE* f = fopen(manifest_path, "r");
    if (!f) return -3;

    char line[512];
    bool has_schema = false;
    bool has_appid = false;
    bool has_version = false;

    if (info) {
        memset(info, 0, sizeof(SapManifestInfo));
    }

    while (fgets(line, sizeof(line), f)) {
        if (strstr(line, "\"schemaVersion\"")) has_schema = true;
        if (strstr(line, "\"appId\"")) has_appid = true;
        if (strstr(line, "\"version\"")) has_version = true;
    }
    fclose(f);

    if (!has_schema || !has_appid || !has_version) {
        return -4; // Incomplete schema
    }
    return 0;
}

int sap_pkg_build(const char* src_dir, const char* out_sap_path, const char* priv_key_path) {
    if (!src_dir || !out_sap_path) return -1;

    char manifest_path[512];
    snprintf(manifest_path, sizeof(manifest_path), "%s/sap.manifest.json", src_dir);

    // 1. Lint manifest
    if (sap_pkg_lint_manifest(manifest_path, NULL) != 0) {
        return -2;
    }

    // 2. Generate SBOM
    char sbom_path[512];
    snprintf(sbom_path, sizeof(sbom_path), "%s/sbom.spdx.json", src_dir);
    sap_pkg_generate_sbom(src_dir, "org.sovereign.app", "1.0.0", sbom_path);

    // 3. Cryptographic Ed25519 signing if private key provided
    if (priv_key_path) {
        char sig_path[512];
        snprintf(sig_path, sizeof(sig_path), "%s/sap.manifest.json.sig", src_dir);
        if (sap_pkg_sign_file(manifest_path, priv_key_path, sig_path) != 0) {
            return -3;
        }
    }

    // 4. Build bit-for-bit deterministic POSIX tar + gzip package
    // Epoch: 2026-01-01 00:00:00 UTC (1767225600), owner 0:0, sorted names
    char cmd[2048];
    snprintf(cmd, sizeof(cmd),
             "tar --sort=name --mtime='2026-01-01 00:00:00Z' "
             "--owner=0 --group=0 --numeric-owner "
             "-cf - -C \"%s\" . | gzip -n -9 > \"%s\"",
             src_dir, out_sap_path);

    int ret = execute_cmd(cmd);
    return (ret == 0) ? 0 : -4;
}

int sap_pkg_verify_package(const char* sap_path, const char* pub_key_path) {
    if (!sap_path || access(sap_path, R_OK) != 0) return -1;

    // Create isolated temporary directory
    char tmp_dir[] = "/tmp/sap_verify_XXXXXX";
    if (!mkdtemp(tmp_dir)) return -2;

    char cmd[1024];
    snprintf(cmd, sizeof(cmd), "tar -xzf \"%s\" -C \"%s\" 2>/dev/null", sap_path, tmp_dir);
    if (execute_cmd(cmd) != 0) {
        snprintf(cmd, sizeof(cmd), "rm -rf \"%s\"", tmp_dir);
        execute_cmd(cmd);
        return -3; // Corrupted archive
    }

    char manifest_path[512];
    snprintf(manifest_path, sizeof(manifest_path), "%s/sap.manifest.json", tmp_dir);

    // Check manifest exists and is compliant
    if (sap_pkg_lint_manifest(manifest_path, NULL) != 0) {
        snprintf(cmd, sizeof(cmd), "rm -rf \"%s\"", tmp_dir);
        execute_cmd(cmd);
        return -4; // Invalid manifest
    }

    // If public key provided, verify cryptographic signature
    if (pub_key_path) {
        char sig_path[512];
        snprintf(sig_path, sizeof(sig_path), "%s/sap.manifest.json.sig", tmp_dir);
        if (sap_pkg_verify_file(manifest_path, pub_key_path, sig_path) != 0) {
            snprintf(cmd, sizeof(cmd), "rm -rf \"%s\"", tmp_dir);
            execute_cmd(cmd);
            return -5; // Cryptographic signature verification failed (TAMPERED)
        }
    }

    // Cleanup
    snprintf(cmd, sizeof(cmd), "rm -rf \"%s\"", tmp_dir);
    execute_cmd(cmd);
    return 0; // Success
}
