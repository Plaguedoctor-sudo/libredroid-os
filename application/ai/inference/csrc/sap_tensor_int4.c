#include "sap_tensor_int4.h"
#include <math.h>
#include <string.h>
#include <stdlib.h>
#include <omp.h>

#if defined(__AVX2__)
#include <immintrin.h>
#endif

#if defined(__ARM_NEON)
#include <arm_neon.h>
#endif

void quantize_row_q4_0(const float* src, block_q4_0* dst, int64_t n) {
    const int nb = n / QK4_0;
    for (int i = 0; i < nb; i++) {
        float amax = 0.0f;
        float max = 0.0f;

        const float* x = src + i * QK4_0;
        for (int l = 0; l < QK4_0; l++) {
            const float v = x[l];
            if (amax < fabsf(v)) {
                amax = fabsf(v);
                max = v;
            }
        }

        const float d = max / -8.0f;
        const float id = d ? 1.0f / d : 0.0f;

        dst[i].d = fp32_to_fp16(d);

        for (int l = 0; l < QK4_0 / 2; ++l) {
            const float x0 = x[l] * id;
            const float x1 = x[l + QK4_0 / 2] * id;

            const uint8_t xi0 = (uint8_t)fminf(15.0f, fmaxf(0.0f, x0 + 8.5f));
            const uint8_t xi1 = (uint8_t)fminf(15.0f, fmaxf(0.0f, x1 + 8.5f));

            dst[i].qs[l] = xi0 | (xi1 << 4);
        }
    }
}

void dequantize_row_q4_0(const block_q4_0* src, float* dst, int64_t n) {
    const int nb = n / QK4_0;
    for (int i = 0; i < nb; i++) {
        const float d = fp16_to_fp32(src[i].d);
        const uint8_t* qs = src[i].qs;
        float* y = dst + i * QK4_0;

        for (int l = 0; l < QK4_0 / 2; ++l) {
            const uint8_t byte = qs[l];
            const int8_t v0 = (int8_t)(byte & 0x0F) - 8;
            const int8_t v1 = (int8_t)(byte >> 4) - 8;

            y[l] = v0 * d;
            y[l + QK4_0 / 2] = v1 * d;
        }
    }
}

float vec_dot_q4_0_f32(const block_q4_0* row, const float* x, int64_t k) {
    const int nb = k / QK4_0;
    float sum = 0.0f;

#if defined(__AVX2__)
    __m256 acc0 = _mm256_setzero_ps();
    __m256 acc1 = _mm256_setzero_ps();
    const __m128i mask_low = _mm_set1_epi8(0x0F);
    const __m128i offset_eight = _mm_set1_epi8(8);

    for (int i = 0; i < nb; ++i) {
        const float d = fp16_to_fp32(row[i].d);
        const __m256 d_vec = _mm256_set1_ps(d);

        // Load 16 bytes of qs (all 32 nibbles) in a single instruction
        __m128i raw = _mm_loadu_si128((const __m128i*)row[i].qs);

        // Extract lower 16 nibbles (weights 0..15)
        __m128i v_low = _mm_sub_epi8(_mm_and_si128(raw, mask_low), offset_eight);
        // Extract upper 16 nibbles (weights 16..31)
        __m128i v_high = _mm_sub_epi8(_mm_and_si128(_mm_srli_epi16(raw, 4), mask_low), offset_eight);

        // Convert lower 8 to float
        __m256i v0_32 = _mm256_cvtepi8_epi32(v_low);
        __m256 w0 = _mm256_mul_ps(_mm256_cvtepi32_ps(v0_32), d_vec);

        // Convert next 8 to float
        __m128i v_low_hi = _mm_srli_si128(v_low, 8);
        __m256i v1_32 = _mm256_cvtepi8_epi32(v_low_hi);
        __m256 w1 = _mm256_mul_ps(_mm256_cvtepi32_ps(v1_32), d_vec);

        // Convert upper 8 to float
        __m256i v2_32 = _mm256_cvtepi8_epi32(v_high);
        __m256 w2 = _mm256_mul_ps(_mm256_cvtepi32_ps(v2_32), d_vec);

        // Convert final 8 to float
        __m128i v_high_hi = _mm_srli_si128(v_high, 8);
        __m256i v3_32 = _mm256_cvtepi8_epi32(v_high_hi);
        __m256 w3 = _mm256_mul_ps(_mm256_cvtepi32_ps(v3_32), d_vec);

        const float* xi = x + i * QK4_0;
        acc0 = _mm256_fmadd_ps(w0, _mm256_loadu_ps(xi + 0), acc0);
        acc1 = _mm256_fmadd_ps(w1, _mm256_loadu_ps(xi + 8), acc1);
        acc0 = _mm256_fmadd_ps(w2, _mm256_loadu_ps(xi + 16), acc0);
        acc1 = _mm256_fmadd_ps(w3, _mm256_loadu_ps(xi + 24), acc1);
    }

    __m256 acc = _mm256_add_ps(acc0, acc1);
    __m128 lo = _mm256_castps256_ps128(acc);
    __m128 hi = _mm256_extractf128_ps(acc, 1);
    __m128 sum128 = _mm_add_ps(lo, hi);
    sum128 = _mm_hadd_ps(sum128, sum128);
    sum128 = _mm_hadd_ps(sum128, sum128);
    sum = _mm_cvtss_f32(sum128);
#else
    for (int i = 0; i < nb; ++i) {
        const float d = fp16_to_fp32(row[i].d);
        const uint8_t* qs = row[i].qs;
        const float* xi = x + i * QK4_0;

        float block_sum = 0.0f;
        for (int l = 0; l < QK4_0 / 2; ++l) {
            const uint8_t byte = qs[l];
            const float v0 = (float)((int)(byte & 0x0F) - 8);
            const float v1 = (float)((int)(byte >> 4) - 8);
            block_sum += v0 * xi[l] + v1 * xi[l + QK4_0 / 2];
        }
        sum += block_sum * d;
    }
#endif

    return sum;
}

void mat_vec_mul_q4_0(float* y, const block_q4_0* W, const float* x, int rows, int cols, int num_threads) {
    const int nb_per_row = cols / QK4_0;

    if (num_threads <= 1 || rows < 64) {
        for (int r = 0; r < rows; ++r) {
            const block_q4_0* row = W + r * nb_per_row;
            y[r] = vec_dot_q4_0_f32(row, x, cols);
        }
        return;
    }

    #pragma omp parallel for schedule(static) num_threads(num_threads)
    for (int r = 0; r < rows; ++r) {
        const block_q4_0* row = W + r * nb_per_row;
        y[r] = vec_dot_q4_0_f32(row, x, cols);
    }
}
