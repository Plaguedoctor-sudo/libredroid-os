#include "sap_packaging.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>
#include <sys/stat.h>

static void compute_sha256(const char* file_path, char* out_hex) {
    char cmd[512];
    snprintf(cmd, sizeof(cmd), "sha256sum \"%s\" | awk '{print $1}'", file_path);
    FILE* fp = popen(cmd, "r");
    assert(fp != NULL);
    if (fgets(out_hex, 65, fp)) {
        out_hex[64] = '\0';
    }
    pclose(fp);
}

int main(int argc, char* argv[]) {
    // If CLI arguments passed (e.g. sap_pkg sign / verify / build)
    if (argc >= 4 && strcmp(argv[1], "sign") == 0) {
        return sap_pkg_sign_file(argv[2], argv[3], (argc >= 5) ? argv[4] : "sap.manifest.json.sig");
    }
    if (argc >= 4 && strcmp(argv[1], "verify") == 0) {
        return sap_pkg_verify_package(argv[2], argv[3]);
    }
    if (argc >= 4 && strcmp(argv[1], "build") == 0) {
        return sap_pkg_build(argv[2], argv[3], (argc >= 5) ? argv[4] : NULL);
    }

    printf("=================================================================\n");
    printf("Sovereign Application Platform — Cryptographic Packaging Engine\n");
    printf("=================================================================\n");

    const char* priv_key = "/tmp/sap_test_dev.key";
    const char* pub_key = "/tmp/sap_test_dev.pub";
    const char* app_dir = "/tmp/sap_test_app";
    const char* pkg1_path = "/tmp/sap_test_app1.sap";
    const char* pkg2_path = "/tmp/sap_test_app2.sap";

    // 1. Generate Ed25519 Cryptographic Developer Keypair
    printf("--> 1. Generating Ed25519 Developer Keypair...\n");
    unlink(priv_key);
    unlink(pub_key);
    int ret = sap_pkg_generate_keypair(priv_key, pub_key);
    assert(ret == 0);
    printf("    [PASS] Ed25519 Keypair Generated: %s & %s\n", priv_key, pub_key);

    // 2. Setup Test Application Directory
    mkdir(app_dir, 0755);
    char sub_bin[256];
    snprintf(sub_bin, sizeof(sub_bin), "%s/bin", app_dir);
    mkdir(sub_bin, 0755);

    char manifest_path[256];
    snprintf(manifest_path, sizeof(manifest_path), "%s/sap.manifest.json", app_dir);
    FILE* mf = fopen(manifest_path, "w");
    assert(mf != NULL);
    fprintf(mf, "{\n"
                "  \"schemaVersion\": \"1.0.0\",\n"
                "  \"appId\": \"org.sovereign.gallery\",\n"
                "  \"version\": \"1.0.0\",\n"
                "  \"name\": \"Sovereign Private Gallery\",\n"
                "  \"entrypoint\": \"bin/gallery_app\"\n"
                "}\n");
    fclose(mf);

    char binary_path[256];
    snprintf(binary_path, sizeof(binary_path), "%s/bin/gallery_app", app_dir);
    FILE* bf = fopen(binary_path, "wb");
    assert(bf != NULL);
    const unsigned char elf_hdr[] = {
        0x7f, 'E', 'L', 'F', 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        2, 0, 0x3e, 0, 1, 0, 0, 0, 0x78, 0x00, 0x40, 0, 0, 0, 0, 0,
        0x40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 64, 0, 56, 0, 1, 0, 0, 0, 0, 0, 0, 0
    };
    fwrite(elf_hdr, 1, sizeof(elf_hdr), bf);
    fclose(bf);
    chmod(binary_path, 0755);

    // 3. Test Manifest Signing & Positive Verification
    printf("\n--> 2. Testing Cryptographic Manifest Signing (Ed25519)...\n");
    char sig_path[256];
    snprintf(sig_path, sizeof(sig_path), "%s/sap.manifest.json.sig", app_dir);
    ret = sap_pkg_sign_file(manifest_path, priv_key, sig_path);
    assert(ret == 0);

    ret = sap_pkg_verify_file(manifest_path, pub_key, sig_path);
    assert(ret == 0);
    printf("    Signature File:   %s\n", sig_path);
    printf("    [PASS] Ed25519 Signature Verified Cleanly!\n");

    // 4. Test Negative 1-Byte Mutation Tamper Gate
    printf("\n--> 3. Testing Negative Tamper Gate (1-Byte Mutation Detection)...\n");
    // Mutate 1 character in the manifest
    char tampered_manifest[256];
    snprintf(tampered_manifest, sizeof(tampered_manifest), "%s/sap.manifest.tampered.json", app_dir);
    mf = fopen(tampered_manifest, "w");
    assert(mf != NULL);
    fprintf(mf, "{\n"
                "  \"schemaVersion\": \"1.0.0\",\n"
                "  \"appId\": \"org.sovereign.gallery\",\n"
                "  \"version\": \"1.0.1\",\n" // 1-byte mutation: '0' -> '1'
                "  \"name\": \"Sovereign Private Gallery\",\n"
                "  \"entrypoint\": \"bin/gallery_app\"\n"
                "}\n");
    fclose(mf);

    ret = sap_pkg_verify_file(tampered_manifest, pub_key, sig_path);
    assert(ret != 0); // MUST FAIL
    printf("    Tamper Invariant: 1-byte mutated manifest correctly REJECTED by Ed25519!\n");
    printf("    [PASS] Negative Tamper Gate Verified!\n");

    // 5. Test Deterministic Bit-For-Bit Packaging Reproducibility
    printf("\n--> 4. Testing Bit-For-Bit Deterministic Package Builds...\n");
    unlink(pkg1_path);
    unlink(pkg2_path);

    ret = sap_pkg_build(app_dir, pkg1_path, priv_key);
    assert(ret == 0);

    usleep(100000); // 100ms clock skew simulation

    ret = sap_pkg_build(app_dir, pkg2_path, priv_key);
    assert(ret == 0);

    char hash1[65], hash2[65];
    compute_sha256(pkg1_path, hash1);
    compute_sha256(pkg2_path, hash2);

    printf("    Build 1 Hash:     %s (%s)\n", hash1, pkg1_path);
    printf("    Build 2 Hash:     %s (%s)\n", hash2, pkg2_path);
    assert(strcmp(hash1, hash2) == 0);
    printf("    [PASS] Bit-for-bit packaging reproducibility verified!\n");

    // 6. Test Full Package Verification
    printf("\n--> 5. Testing Complete .sap Package Invariant Verification...\n");
    ret = sap_pkg_verify_package(pkg1_path, pub_key);
    assert(ret == 0);
    printf("    Package Invariants: Ed25519 Signature, Manifest Schema & SPDX SBOM Verified!\n");
    printf("    [PASS] Complete .sap Package Verification Verified!\n");

    // Cleanup
    unlink(priv_key);
    unlink(pub_key);
    unlink(pkg1_path);
    unlink(pkg2_path);
    char clean_cmd[512];
    snprintf(clean_cmd, sizeof(clean_cmd), "rm -rf \"%s\"", app_dir);
    ret = system(clean_cmd);
    (void)ret;

    printf("\n=================================================================\n");
    printf("ALL SOVEREIGN PACKAGING & CRYPTOGRAPHIC TESTS PASSED (100%% GREEN)!\n");
    printf("=================================================================\n");

    return 0;
}
