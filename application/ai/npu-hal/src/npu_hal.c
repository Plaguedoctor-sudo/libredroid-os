#include "npu_hal.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

struct internal_npu_ctx {
    npu_backend_t backend;
    uint32_t active_models;
    bool is_arm64_target;
};

int npu_hal_init(npu_context_t* ctx_out) {
    if (!ctx_out) return -1;
    struct internal_npu_ctx* ctx = (struct internal_npu_ctx*)malloc(sizeof(struct internal_npu_ctx));
    if (!ctx) return -2;

#if defined(__aarch64__)
    ctx->backend = NPU_BACKEND_VULKAN_COMPUTE;
    ctx->is_arm64_target = true;
#else
    ctx->backend = NPU_BACKEND_VULKAN_COMPUTE;
    ctx->is_arm64_target = false;
#endif

    ctx->active_models = 0;
    *ctx_out = (npu_context_t)ctx;
    return 0;
}

int npu_hal_get_caps(npu_context_t ctx, npu_device_caps_t* caps_out) {
    if (!ctx || !caps_out) return -1;
    struct internal_npu_ctx* internal = (struct internal_npu_ctx*)ctx;

    caps_out->backend = internal->backend;
    caps_out->max_tensor_dims = 4;
    // Small AI budget: 800 MB reserved pool
    caps_out->total_npu_memory_bytes = 800ULL * 1024ULL * 1024ULL;
    caps_out->supports_int4 = true;
    caps_out->supports_int8 = true;
    caps_out->supports_fp16 = true;
    return 0;
}

int npu_hal_load_model(npu_context_t ctx, const char* model_path, npu_model_handle_t* model_out) {
    if (!ctx || !model_path || !model_out) return -1;
    int* dummy_handle = (int*)malloc(sizeof(int));
    *dummy_handle = 42;
    *model_out = (npu_model_handle_t)dummy_handle;
    return 0;
}

int npu_hal_run_inference(npu_model_handle_t model, const void* input_tensors, void* output_tensors) {
    if (!model || !input_tensors || !output_tensors) return -1;
    return 0;
}

int npu_hal_unload_model(npu_model_handle_t model) {
    if (!model) return -1;
    free(model);
    return 0;
}

int npu_hal_destroy(npu_context_t ctx) {
    if (!ctx) return -1;
    free(ctx);
    return 0;
}
