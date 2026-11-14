#ifndef SAP_MEMORY_H
#define SAP_MEMORY_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct {
    void *user_ptr;
    size_t size;
    void *mmap_base;
    size_t total_alloc_size;
} sap_secure_buf_t;

// Enforce Glibc heap hardening (M_PERTURB, M_ARENA_MAX, M_TRIM_THRESHOLD)
int sap_memory_enforce_hardening(void);

// Allocate a hardened buffer enclosed by PROT_NONE guard pages and mlocked in RAM
int sap_memory_alloc_guarded(size_t size, sap_secure_buf_t *out_buf);

// Securely wipe memory and unmap guarded buffer
void sap_memory_free_guarded(sap_secure_buf_t *buf);

// Wipe memory buffer with compiler-barrier zeroization
void sap_memory_secure_wipe(void *ptr, size_t size);

// Adjust Linux OOM score (-1000 for critical core, 0 for normal, +500 for untrusted apps)
int sap_memory_set_oom_score(int score);

// Read current resident set size in kilobytes from /proc/self/status
size_t sap_memory_get_current_rss_kb(void);

#endif // SAP_MEMORY_H
