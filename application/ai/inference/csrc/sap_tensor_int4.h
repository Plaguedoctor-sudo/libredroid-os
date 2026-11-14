#ifndef SAP_TENSOR_INT4_H
#define SAP_TENSOR_INT4_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define QK4_0 32

// Standard Q4_0 quantized block format matching GGML / GGUF
// 2 bytes FP16 delta + 16 bytes for 32 4-bit weights = 18 bytes total (4.5 bits/param)
typedef struct {
    uint16_t d;          // delta scale (FP16)
    uint8_t qs[QK4_0 / 2]; // 16 bytes containing 32 4-bit signed nibbles (-8 to +7)
} block_q4_0;

// Quantize float array to Q4_0 block
void quantize_row_q4_0(const float* src, block_q4_0* dst, int64_t n);

// Dequantize Q4_0 blocks back to float array
void dequantize_row_q4_0(const block_q4_0* src, float* dst, int64_t n);

// Vectorized dot product between FP32 vector and Q4_0 quantized row (with AVX2 / NEON)
float vec_dot_q4_0_f32(const block_q4_0* row, const float* x, int64_t k);

// Matrix-Vector multiplication: y = W * x
// W is [rows x cols] in Q4_0 format
// x is [cols] in FP32 format
// y is [rows] in FP32 format
void mat_vec_mul_q4_0(float* y, const block_q4_0* W, const float* x, int rows, int cols, int num_threads);

// Fast half-precision float conversions
static inline float fp16_to_fp32(uint16_t h) {
    uint32_t sign = (h & 0x8000) << 16;
    uint32_t exp = (h & 0x7C00) >> 10;
    uint32_t mant = (h & 0x03FF) << 13;

    if (exp == 0) {
        if (mant == 0) {
            union { uint32_t u; float f; } val = { sign };
            return val.f;
        }
        while (!(mant & 0x00800000)) {
            mant <<= 1;
            exp--;
        }
        exp++;
        mant &= ~0x00800000;
    } else if (exp == 31) {
        union { uint32_t u; float f; } val = { sign | 0x7F800000 | mant };
        return val.f;
    }

    exp = (exp + (127 - 15)) << 23;
    union { uint32_t u; float f; } val = { sign | exp | mant };
    return val.f;
}

static inline uint16_t fp32_to_fp16(float f) {
    union { float f; uint32_t u; } val = { f };
    uint32_t x = val.u;
    uint32_t sign = (x >> 16) & 0x8000;
    int32_t exp = ((x >> 23) & 0xFF) - 127 + 15;
    uint32_t mant = x & 0x007FFFFF;

    if (exp <= 0) {
        return (uint16_t)sign;
    } else if (exp >= 31) {
        return (uint16_t)(sign | 0x7C00);
    }
    return (uint16_t)(sign | (exp << 10) | (mant >> 13));
}

#ifdef __cplusplus
}
#endif

#endif // SAP_TENSOR_INT4_H
