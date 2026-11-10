/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack Keystore IPC Packet Fuzzer (Task 6.6)
 * Target: libFuzzer / ClusterFuzzLite / ASan
 */

#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>

#define FS_KEYSTORE_CMD_GENERATE 1
#define FS_KEYSTORE_CMD_SIGN     2
#define FS_KEYSTORE_CMD_VERIFY   3
#define FS_KEYSTORE_CMD_ENCRYPT  4
#define FS_KEYSTORE_CMD_DECRYPT  5
#define FS_KEYSTORE_CMD_DELETE   6
#define FS_KEYSTORE_CMD_GET_DESC 7
#define FS_KEYSTORE_CMD_ATTEST   8

typedef struct {
    uint32_t cmd;
    char alias[64];
    uint32_t algorithm;
    uint32_t purposes;
    uint32_t hardware_backed;
    uint32_t in_len;
    uint8_t in_payload[256];
    uint32_t sig_len;
    uint8_t sig_payload[128];
} __attribute__((packed)) fuzz_ipc_req_t;

static int process_keystore_ipc(const uint8_t *data, size_t size) {
    if (size < sizeof(uint32_t)) return 0;

    fuzz_ipc_req_t req;
    memset(&req, 0, sizeof(req));
    size_t copy_len = size < sizeof(req) ? size : sizeof(req);
    memcpy(&req, data, copy_len);

    // Guard string boundaries
    req.alias[sizeof(req.alias) - 1] = '\0';

    switch (req.cmd) {
        case FS_KEYSTORE_CMD_GENERATE:
        case FS_KEYSTORE_CMD_SIGN:
        case FS_KEYSTORE_CMD_VERIFY:
        case FS_KEYSTORE_CMD_ENCRYPT:
        case FS_KEYSTORE_CMD_DECRYPT:
        case FS_KEYSTORE_CMD_DELETE:
        case FS_KEYSTORE_CMD_GET_DESC:
        case FS_KEYSTORE_CMD_ATTEST:
            break;
        default:
            return -1;
    }

    if (req.in_len > sizeof(req.in_payload)) {
        return -1;
    }
    if (req.sig_len > sizeof(req.sig_payload)) {
        return -1;
    }

    return 0;
}

#ifdef __cplusplus
extern "C" {
#endif

int LLVMFuzzerTestOneInput(const uint8_t *Data, size_t Size) {
    process_keystore_ipc(Data, Size);
    return 0;
}

#ifdef FUZZ_STANDALONE_MAIN
int main(void) {
    uint8_t dummy[128] = {1, 0, 0, 0};
    LLVMFuzzerTestOneInput(dummy, sizeof(dummy));
    return 0;
}
#endif

#ifdef __cplusplus
}
#endif
