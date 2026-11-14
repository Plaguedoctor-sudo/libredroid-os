#ifndef SAP_TRANSLATION_H
#define SAP_TRANSLATION_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    TRANS_MODE_NATIVE_ARM64 = 0, // Direct execution on ARM64 hardware (PinePhone Pro, Reform, RPi5)
    TRANS_MODE_FEX_EMU = 1,      // FEX-Emu ARM64-to-x86_64 fast JIT translation
    TRANS_MODE_LIBNDK = 2        // Android NDK translation layer
} SapTranslationMode;

typedef struct {
    char host_arch[65];
    SapTranslationMode mode;
    bool translation_required;
    bool vulkan_thunk_active;
    bool gles_thunk_active;
    bool wayland_thunk_active;
    bool binfmt_registered;
} SapTranslation;

// Initialize binary translation subsystem based on host silicon architecture
int sap_translation_init(SapTranslation* trans);

// Configure binfmt_misc kernel ELF interpreter rule for ARM64 execution
int sap_translation_configure_binfmt(SapTranslation* trans);

// Format translation status into JSON string
int sap_translation_get_status_json(const SapTranslation* trans, char* out_buf, size_t max_len);

#ifdef __cplusplus
}
#endif

#endif // SAP_TRANSLATION_H
