#ifndef SAP_PACKAGING_H
#define SAP_PACKAGING_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char app_id[64];
    char version[32];
    char name[64];
    char entrypoint[128];
    uint32_t num_capabilities;
    char capabilities[16][32];
} SapManifestInfo;

// Generate Ed25519 asymmetric cryptographic keypair
int sap_pkg_generate_keypair(const char* priv_key_path, const char* pub_key_path);

// Sign arbitrary file with Ed25519 private key
int sap_pkg_sign_file(const char* file_path, const char* priv_key_path, const char* sig_out_path);

// Verify an Ed25519 signature on a file with public key
int sap_pkg_verify_file(const char* file_path, const char* pub_key_path, const char* sig_path);

// Generate deterministic SPDX-2.3 Software Bill of Materials (SBOM) with SHA-256 digests
int sap_pkg_generate_sbom(const char* src_dir, const char* app_id, const char* version, const char* out_sbom_path);

// Build deterministic, bit-for-bit reproducible .sap package archive
int sap_pkg_build(const char* src_dir, const char* out_sap_path, const char* priv_key_path);

// Verify entire .sap package: signature, manifest schema compliance, and SBOM hash integrity
int sap_pkg_verify_package(const char* sap_path, const char* pub_key_path);

// Parse and lint manifest JSON
int sap_pkg_lint_manifest(const char* manifest_path, SapManifestInfo* info);

#ifdef __cplusplus
}
#endif

#endif // SAP_PACKAGING_H
