/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack Manifest Parser Fuzzing Harness (Task 6.6)
 * Target: libFuzzer / ClusterFuzzLite
 */

#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>
#include <stdbool.h>

// Simulated parser entrypoint for FreeStack YAML/JSON manifests
static int parse_manifest_data(const uint8_t *data, size_t size) {
    if (size < 4) return 0;

    // Check header tokens
    if (data[0] == '{' && data[size - 1] == '}') {
        // JSON format path
        size_t depth = 0;
        for (size_t i = 0; i < size; ++i) {
            if (data[i] == '{' || data[i] == '[') depth++;
            else if (data[i] == '}' || data[i] == ']') {
                if (depth > 0) depth--;
            }
            if (depth > 64) {
                // Reject excessive recursion
                return -1;
            }
        }
    } else {
        // YAML line scanner path
        size_t line_len = 0;
        for (size_t i = 0; i < size; ++i) {
            if (data[i] == '\n') {
                line_len = 0;
            } else {
                line_len++;
                if (line_len > 4096) return -1; // Max line length guard
            }
        }
    }

    return 0;
}

#ifdef __cplusplus
extern "C" {
#endif

int LLVMFuzzerTestOneInput(const uint8_t *Data, size_t Size) {
    parse_manifest_data(Data, Size);
    return 0;
}

#ifdef FUZZ_STANDALONE_MAIN
int main(int argc, char **argv) {
    const char sample[] = "name: freestack-core\nversion: 0.1.0\ntier: core\n";
    LLVMFuzzerTestOneInput((const uint8_t*)sample, strlen(sample));
    return 0;
}
#endif

#ifdef __cplusplus
}
#endif
