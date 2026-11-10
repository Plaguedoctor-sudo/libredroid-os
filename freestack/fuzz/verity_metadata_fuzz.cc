/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack NFTables & Verity Parsing Fuzzers (Task 6.6)
 */

#include <stdint.h>
#include <stddef.h>
#include <string.h>

// Verity Superblock specification (RFC / dm-verity)
struct verity_sb {
    uint8_t signature[8];
    uint32_t version;
    uint32_t hash_type;
    uint32_t data_block_size;
    uint32_t hash_block_size;
    uint64_t data_blocks;
    uint16_t salt_size;
    uint8_t pad1[6];
    uint8_t salt[256];
    uint8_t pad2[168];
};

static int parse_verity_sb(const uint8_t *data, size_t size) {
    if (size < sizeof(struct verity_sb)) return 0;

    const struct verity_sb *sb = (const struct verity_sb *)data;
    if (memcmp(sb->signature, "verity\0\0", 8) != 0) {
        return -1;
    }
    if (sb->version != 1) return -1;
    if (sb->data_block_size == 0 || (sb->data_block_size & (sb->data_block_size - 1)) != 0) return -1;
    if (sb->hash_block_size == 0 || (sb->hash_block_size & (sb->hash_block_size - 1)) != 0) return -1;
    if (sb->data_blocks == 0) return -1;

    return 0;
}

#ifdef __cplusplus
extern "C" {
#endif

int LLVMFuzzerTestOneInput(const uint8_t *Data, size_t Size) {
    parse_verity_sb(Data, Size);
    return 0;
}

#ifdef FUZZ_STANDALONE_MAIN
int main(void) {
    uint8_t dummy[sizeof(struct verity_sb)];
    memset(dummy, 0, sizeof(dummy));
    memcpy(dummy, "verity\0\0", 8);
    LLVMFuzzerTestOneInput(dummy, sizeof(dummy));
    return 0;
}
#endif

#ifdef __cplusplus
}
#endif
