#define _GNU_SOURCE
#include "sap_memory.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <malloc.h>
#include <sys/mman.h>
#include <unistd.h>
#include <fcntl.h>

#define PAGE_SIZE 4096

int sap_memory_enforce_hardening(void) {
    /* 1. Poison uninitialized & freed memory (catches use-after-free and uninitialized reads) */
    mallopt(M_PERTURB, 0xAA);

    /* 2. Restrict memory arenas to prevent address space fragmentation on constrained devices */
    mallopt(M_ARENA_MAX, 2);

    /* 3. Aggressive page trimming: return free memory to kernel */
    mallopt(M_TRIM_THRESHOLD, 64 * 1024);

    return 0;
}

void sap_memory_secure_wipe(void *ptr, size_t size) {
    if (!ptr || size == 0) return;
#if defined(__GLIBC__) && (__GLIBC__ > 2 || (__GLIBC__ == 2 && __GLIBC_MINOR__ >= 25))
    explicit_bzero(ptr, size);
#else
    volatile uint8_t *p = (volatile uint8_t *)ptr;
    while (size--) *p++ = 0;
#endif
}

int sap_memory_alloc_guarded(size_t size, sap_secure_buf_t *out_buf) {
    if (size == 0 || !out_buf) return -1;
    memset(out_buf, 0, sizeof(sap_secure_buf_t));

    /* Align user size up to 4096 bytes */
    size_t aligned_size = (size + PAGE_SIZE - 1) & ~(PAGE_SIZE - 1);
    /* Total size: leading guard page (4KB) + user payload pages + trailing guard page (4KB) */
    size_t total_size = aligned_size + (2 * PAGE_SIZE);

    void *base = mmap(NULL, total_size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (base == MAP_FAILED) return -1;

    /* Leading guard page: PROT_NONE (faults on underflow) */
    if (mprotect(base, PAGE_SIZE, PROT_NONE) != 0) {
        munmap(base, total_size);
        return -1;
    }

    /* Trailing guard page: PROT_NONE (faults on overflow) */
    void *trailing_guard = (char *)base + PAGE_SIZE + aligned_size;
    if (mprotect(trailing_guard, PAGE_SIZE, PROT_NONE) != 0) {
        munmap(base, total_size);
        return -1;
    }

    void *user_ptr = (char *)base + PAGE_SIZE;

    /* Lock into physical RAM to prevent swap leakage (ignore error if unprivileged RLIMIT_MEMLOCK exceeded) */
    mlock(user_ptr, aligned_size);

    out_buf->user_ptr = user_ptr;
    out_buf->size = size;
    out_buf->mmap_base = base;
    out_buf->total_alloc_size = total_size;

    return 0;
}

void sap_memory_free_guarded(sap_secure_buf_t *buf) {
    if (!buf || !buf->mmap_base) return;

    /* Wipe sensitive user data */
    sap_memory_secure_wipe(buf->user_ptr, buf->size);

    munlock(buf->user_ptr, buf->total_alloc_size - (2 * PAGE_SIZE));
    munmap(buf->mmap_base, buf->total_alloc_size);

    memset(buf, 0, sizeof(sap_secure_buf_t));
}

int sap_memory_set_oom_score(int score) {
    if (score < -1000) score = -1000;
    if (score > 1000) score = 1000;

    int fd = open("/proc/self/oom_score_adj", O_WRONLY);
    if (fd < 0) return -1;

    char buf[16];
    int len = snprintf(buf, sizeof(buf), "%d", score);
    ssize_t written = write(fd, buf, len);
    close(fd);

    return (written > 0) ? 0 : -1;
}

size_t sap_memory_get_current_rss_kb(void) {
    FILE *fp = fopen("/proc/self/status", "r");
    if (!fp) return 0;
    char line[256];
    size_t rss = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "VmRSS:", 6) == 0) {
            sscanf(line + 6, "%zu", &rss);
            break;
        }
    }
    fclose(fp);
    return rss;
}
