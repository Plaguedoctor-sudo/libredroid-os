#ifndef SOVEREIGN_NPU_HAL_H
#define SOVEREIGN_NPU_HAL_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    NPU_BACKEND_AUTO = 0,
    NPU_BACKEND_QUALCOMM_QNN = 1,
    NPU_BACKEND_MEDIATEK_NEUROPILOT = 2,
    NPU_BACKEND_APPLE_ANE = 3,
    NPU_BACKEND_VULKAN_COMPUTE = 4,
    NPU_BACKEND_CPU_FALLBACK = 5
} npu_backend_t;

typedef struct {
    npu_backend_t backend;
    uint32_t max_tensor_dims;
    uint64_t total_npu_memory_bytes;
    bool supports_int4;
    bool supports_int8;
    bool supports_fp16;
} npu_device_caps_t;

typedef void* npu_context_t;
typedef void* npu_model_handle_t;

int npu_hal_init(npu_context_t* ctx_out);
int npu_hal_get_caps(npu_context_t ctx, npu_device_caps_t* caps_out);
int npu_hal_load_model(npu_context_t ctx, const char* model_path, npu_model_handle_t* model_out);
int npu_hal_run_inference(npu_model_handle_t model, const void* input_tensors, void* output_tensors);
int npu_hal_unload_model(npu_model_handle_t model);
int npu_hal_destroy(npu_context_t ctx);

#ifdef __cplusplus
}
#endif

#endif // SOVEREIGN_NPU_HAL_H
