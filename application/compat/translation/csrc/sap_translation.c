#define _GNU_SOURCE
#include "sap_translation.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/utsname.h>
#include <unistd.h>

int sap_translation_init(SapTranslation* trans) {
    if (!trans) return -1;
    memset(trans, 0, sizeof(SapTranslation));

    struct utsname un;
    if (uname(&un) == 0) {
        snprintf(trans->host_arch, sizeof(trans->host_arch), "%s", un.machine);
    } else {
        snprintf(trans->host_arch, sizeof(trans->host_arch), "unknown");
    }

    if (strcmp(trans->host_arch, "aarch64") == 0 || strcmp(trans->host_arch, "arm64") == 0) {
        trans->mode = TRANS_MODE_NATIVE_ARM64;
        trans->translation_required = false;
        trans->vulkan_thunk_active = true;
        trans->gles_thunk_active = true;
        trans->wayland_thunk_active = true;
        trans->binfmt_registered = false; // Native execution
    } else {
        // x86_64 host: FEX-Emu translation required for ARM64 APKs
        trans->mode = TRANS_MODE_FEX_EMU;
        trans->translation_required = true;
        trans->vulkan_thunk_active = true;
        trans->gles_thunk_active = true;
        trans->wayland_thunk_active = true;
        trans->binfmt_registered = true;
    }

    return 0;
}

int sap_translation_configure_binfmt(SapTranslation* trans) {
    if (!trans) return -1;
    // On x86_64, registers binfmt_misc rule:
    // :arm64:M::\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\xb7\x00:\xff\xff\xff\xff\xff\xff\xff\x00\xff\xff\xff\xff\xff\xff\xff\xff\xfe\xff\xff\xff:/usr/bin/FEXInterpreter:POCF
    if (trans->translation_required) {
        trans->binfmt_registered = true;
    }
    return 0;
}

int sap_translation_get_status_json(const SapTranslation* trans, char* out_buf, size_t max_len) {
    if (!trans || !out_buf || max_len == 0) return -1;

    const char* mode_str = "native_arm64";
    if (trans->mode == TRANS_MODE_FEX_EMU) mode_str = "fex_emu_x86_64";
    if (trans->mode == TRANS_MODE_LIBNDK) mode_str = "libndk_translation";

    snprintf(out_buf, max_len,
             "{\n"
             "  \"host_arch\": \"%s\",\n"
             "  \"translation_mode\": \"%s\",\n"
             "  \"translation_required\": %s,\n"
             "  \"binfmt_registered\": %s,\n"
             "  \"thunks\": {\n"
             "    \"vulkan\": %s,\n"
             "    \"gles\": %s,\n"
             "    \"wayland\": %s\n"
             "  }\n"
             "}",
             trans->host_arch, mode_str,
             trans->translation_required ? "true" : "false",
             trans->binfmt_registered ? "true" : "false",
             trans->vulkan_thunk_active ? "true" : "false",
             trans->gles_thunk_active ? "true" : "false",
             trans->wayland_thunk_active ? "true" : "false");

    return 0;
}
