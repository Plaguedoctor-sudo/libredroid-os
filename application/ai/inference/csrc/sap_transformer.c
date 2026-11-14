#include "sap_transformer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

static void rmsnorm(float* o, const float* x, const float* weight, int size) {
    float ss = 0.0f;
    for (int j = 0; j < size; j++) {
        ss += x[j] * x[j];
    }
    ss /= size;
    ss += 1e-5f;
    const float inv_ss = 1.0f / sqrtf(ss);
    for (int j = 0; j < size; j++) {
        o[j] = weight[j] * (inv_ss * x[j]);
    }
}

static void apply_rope(float* q, float* k, int pos, int head_size, int n_heads, int n_kv_heads) {
    for (int i = 0; i < n_heads; i++) {
        float* q_head = q + i * head_size;
        for (int j = 0; j < head_size; j += 2) {
            float freq = 1.0f / powf(10000.0f, (float)j / (float)head_size);
            float val = pos * freq;
            float cos_val = cosf(val);
            float sin_val = sinf(val);

            float q0 = q_head[j];
            float q1 = q_head[j + 1];
            q_head[j] = q0 * cos_val - q1 * sin_val;
            q_head[j + 1] = q0 * sin_val + q1 * cos_val;
        }
    }

    for (int i = 0; i < n_kv_heads; i++) {
        float* k_head = k + i * head_size;
        for (int j = 0; j < head_size; j += 2) {
            float freq = 1.0f / powf(10000.0f, (float)j / (float)head_size);
            float val = pos * freq;
            float cos_val = cosf(val);
            float sin_val = sinf(val);

            float k0 = k_head[j];
            float k1 = k_head[j + 1];
            k_head[j] = k0 * cos_val - k1 * sin_val;
            k_head[j + 1] = k0 * sin_val + k1 * cos_val;
        }
    }
}

static void softmax(float* x, int size) {
    float max_val = x[0];
    for (int i = 1; i < size; i++) {
        if (x[i] > max_val) max_val = x[i];
    }
    float sum = 0.0f;
    for (int i = 0; i < size; i++) {
        x[i] = expf(x[i] - max_val);
        sum += x[i];
    }
    float inv_sum = 1.0f / (sum > 0.0f ? sum : 1.0f);
    for (int i = 0; i < size; i++) {
        x[i] *= inv_sum;
    }
}

int transformer_init(TransformerModel* model, const TransformerConfig* config) {
    model->config = *config;
    const int dim = config->dim;
    const int hidden_dim = config->hidden_dim;
    const int n_layers = config->n_layers;
    const int n_heads = config->n_heads;
    const int n_kv_heads = config->n_kv_heads;
    const int head_size = dim / n_heads;
    const int kv_dim = n_kv_heads * head_size;
    const int vocab_size = config->vocab_size;
    const int seq_len = config->seq_len;

    size_t total_bytes = 0;

    // 1. Allocate RunState buffers
    RunState* s = &model->state;
    s->x = (float*)calloc(dim, sizeof(float));
    s->xb = (float*)calloc(dim, sizeof(float));
    s->xb2 = (float*)calloc(dim, sizeof(float));
    s->hb = (float*)calloc(hidden_dim, sizeof(float));
    s->hb2 = (float*)calloc(hidden_dim, sizeof(float));
    s->q = (float*)calloc(dim, sizeof(float));
    s->k = (float*)calloc(kv_dim, sizeof(float));
    s->v = (float*)calloc(kv_dim, sizeof(float));
    s->att = (float*)calloc(n_heads * seq_len, sizeof(float));
    s->logits = (float*)calloc(vocab_size, sizeof(float));

    // KV Cache
    const size_t kv_cache_size = (size_t)n_layers * seq_len * kv_dim * sizeof(float);
    s->key_cache = (float*)calloc(n_layers * seq_len * kv_dim, sizeof(float));
    s->value_cache = (float*)calloc(n_layers * seq_len * kv_dim, sizeof(float));

    total_bytes += (dim * 3 + hidden_dim * 2 + dim + kv_dim * 2 + n_heads * seq_len + vocab_size) * sizeof(float);
    total_bytes += kv_cache_size * 2;

    // 2. Allocate TransformerWeights
    TransformerWeights* w = &model->weights;
    w->token_embedding_table = (float*)calloc((size_t)vocab_size * dim, sizeof(float));
    total_bytes += (size_t)vocab_size * dim * sizeof(float);

    w->rms_att_weight = (float**)calloc(n_layers, sizeof(float*));
    w->rms_ffn_weight = (float**)calloc(n_layers, sizeof(float*));

    w->wq = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));
    w->wk = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));
    w->wv = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));
    w->wo = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));

    w->w_gate = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));
    w->w_up = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));
    w->w_down = (block_q4_0**)calloc(n_layers, sizeof(block_q4_0*));

    const size_t q4_0_block_size = sizeof(block_q4_0); // 18 bytes for 32 weights
    const size_t q_blocks = (size_t)dim * (dim / QK4_0);
    const size_t kv_blocks = (size_t)dim * (kv_dim / QK4_0);
    const size_t gate_blocks = (size_t)dim * (hidden_dim / QK4_0);
    const size_t down_blocks = (size_t)hidden_dim * (dim / QK4_0);

    for (int l = 0; l < n_layers; ++l) {
        w->rms_att_weight[l] = (float*)calloc(dim, sizeof(float));
        w->rms_ffn_weight[l] = (float*)calloc(dim, sizeof(float));
        total_bytes += dim * 2 * sizeof(float);

        w->wq[l] = (block_q4_0*)calloc(q_blocks, q4_0_block_size);
        w->wk[l] = (block_q4_0*)calloc(kv_blocks, q4_0_block_size);
        w->wv[l] = (block_q4_0*)calloc(kv_blocks, q4_0_block_size);
        w->wo[l] = (block_q4_0*)calloc(q_blocks, q4_0_block_size);
        total_bytes += (q_blocks * 2 + kv_blocks * 2) * q4_0_block_size;

        w->w_gate[l] = (block_q4_0*)calloc(gate_blocks, q4_0_block_size);
        w->w_up[l] = (block_q4_0*)calloc(gate_blocks, q4_0_block_size);
        w->w_down[l] = (block_q4_0*)calloc(down_blocks, q4_0_block_size);
        total_bytes += (gate_blocks * 2 + down_blocks) * q4_0_block_size;
    }

    w->rms_final_weight = (float*)calloc(dim, sizeof(float));
    total_bytes += dim * sizeof(float);

    const size_t cls_blocks = (size_t)vocab_size * (dim / QK4_0);
    w->wcls = (block_q4_0*)calloc(cls_blocks, q4_0_block_size);
    total_bytes += cls_blocks * q4_0_block_size;

    model->total_memory_bytes = total_bytes;
    return 0;
}

void transformer_free(TransformerModel* model) {
    RunState* s = &model->state;
    free(s->x); free(s->xb); free(s->xb2);
    free(s->hb); free(s->hb2);
    free(s->q); free(s->k); free(s->v);
    free(s->att); free(s->logits);
    free(s->key_cache); free(s->value_cache);

    TransformerWeights* w = &model->weights;
    free(w->token_embedding_table);
    for (int l = 0; l < model->config.n_layers; ++l) {
        free(w->rms_att_weight[l]); free(w->rms_ffn_weight[l]);
        free(w->wq[l]); free(w->wk[l]); free(w->wv[l]); free(w->wo[l]);
        free(w->w_gate[l]); free(w->w_up[l]); free(w->w_down[l]);
    }
    free(w->rms_att_weight); free(w->rms_ffn_weight);
    free(w->wq); free(w->wk); free(w->wv); free(w->wo);
    free(w->w_gate); free(w->w_up); free(w->w_down);
    free(w->rms_final_weight); free(w->wcls);
}

float* transformer_forward(TransformerModel* model, int token, int pos, int num_threads) {
    const TransformerConfig* p = &model->config;
    TransformerWeights* w = &model->weights;
    RunState* s = &model->state;

    const int dim = p->dim;
    const int hidden_dim = p->hidden_dim;
    const int head_size = dim / p->n_heads;
    const int kv_dim = p->n_kv_heads * head_size;
    const int kv_mul = p->n_heads / p->n_kv_heads;

    // 1. Copy token embedding into x
    float* content_row = w->token_embedding_table + token * dim;
    memcpy(s->x, content_row, dim * sizeof(float));

    // 2. Loop through transformer layers
    for (int l = 0; l < p->n_layers; l++) {
        // Attention RMSNorm
        rmsnorm(s->xb, s->x, w->rms_att_weight[l], dim);

        // Q, K, V Projections via INT4 Q4_0 MatMul
        mat_vec_mul_q4_0(s->q, w->wq[l], s->xb, dim, dim, num_threads);
        mat_vec_mul_q4_0(s->k, w->wk[l], s->xb, kv_dim, dim, num_threads);
        mat_vec_mul_q4_0(s->v, w->wv[l], s->xb, kv_dim, dim, num_threads);

        // RoPE positional embeddings
        apply_rope(s->q, s->k, pos, head_size, p->n_heads, p->n_kv_heads);

        // Cache Key & Value
        const int loff = l * p->seq_len * kv_dim;
        float* key_cache_row = s->key_cache + loff + pos * kv_dim;
        float* value_cache_row = s->value_cache + loff + pos * kv_dim;
        memcpy(key_cache_row, s->k, kv_dim * sizeof(float));
        memcpy(value_cache_row, s->v, kv_dim * sizeof(float));

        // Multi-head Attention
        const float sqrt_head_size = sqrtf((float)head_size);
        for (int h = 0; h < p->n_heads; h++) {
            float* q_head = s->q + h * head_size;
            float* att_head = s->att + h * p->seq_len;
            const int kv_h = h / kv_mul;

            // Score Q * K
            for (int t = 0; t <= pos; t++) {
                float* k_past = s->key_cache + loff + t * kv_dim + kv_h * head_size;
                float score = 0.0f;
                for (int i = 0; i < head_size; i++) {
                    score += q_head[i] * k_past[i];
                }
                att_head[t] = score / sqrt_head_size;
            }

            // Softmax scores
            softmax(att_head, pos + 1);

            // Weighted sum over V
            float* xb_head = s->xb + h * head_size;
            memset(xb_head, 0, head_size * sizeof(float));
            for (int t = 0; t <= pos; t++) {
                float* v_past = s->value_cache + loff + t * kv_dim + kv_h * head_size;
                const float a = att_head[t];
                for (int i = 0; i < head_size; i++) {
                    xb_head[i] += a * v_past[i];
                }
            }
        }

        // Out projection: xb2 = wo * xb
        mat_vec_mul_q4_0(s->xb2, w->wo[l], s->xb, dim, dim, num_threads);

        // Residual connection: x += xb2
        for (int i = 0; i < dim; i++) {
            s->x[i] += s->xb2[i];
        }

        // FFN RMSNorm
        rmsnorm(s->xb, s->x, w->rms_ffn_weight[l], dim);

        // FFN SwiGLU: hb = SiLU(w_gate * xb) * (w_up * xb)
        mat_vec_mul_q4_0(s->hb, w->w_gate[l], s->xb, hidden_dim, dim, num_threads);
        mat_vec_mul_q4_0(s->hb2, w->w_up[l], s->xb, hidden_dim, dim, num_threads);

        // SiLU activation: x / (1 + exp(-x))
        for (int i = 0; i < hidden_dim; i++) {
            const float silu = s->hb[i] / (1.0f + expf(-s->hb[i]));
            s->hb[i] = silu * s->hb2[i];
        }

        // FFN Down projection: xb = w_down * hb
        mat_vec_mul_q4_0(s->xb, w->w_down[l], s->hb, dim, hidden_dim, num_threads);

        // Residual connection: x += xb
        for (int i = 0; i < dim; i++) {
            s->x[i] += s->xb[i];
        }
    }

    // 3. Final RMSNorm
    rmsnorm(s->x, s->x, w->rms_final_weight, dim);

    // 4. Classifier Head: logits = wcls * x
    mat_vec_mul_q4_0(s->logits, w->wcls, s->x, p->vocab_size, dim, num_threads);

    return s->logits;
}

int sample_next_token(const float* logits, int vocab_size, float temperature) {
    if (temperature <= 0.0f) {
        // Greedy argmax
        int best_token = 0;
        float best_val = logits[0];
        for (int i = 1; i < vocab_size; i++) {
            if (logits[i] > best_val) {
                best_val = logits[i];
                best_token = i;
            }
        }
        return best_token;
    }

    // Top-1 sample with temperature
    float* scaled = (float*)malloc(vocab_size * sizeof(float));
    for (int i = 0; i < vocab_size; i++) {
        scaled[i] = logits[i] / temperature;
    }
    softmax(scaled, vocab_size);

    float coin = (float)rand() / (float)RAND_MAX;
    float cdf = 0.0f;
    int sampled = 0;
    for (int i = 0; i < vocab_size; i++) {
        cdf += scaled[i];
        if (coin <= cdf) {
            sampled = i;
            break;
        }
    }
    free(scaled);
    return sampled;
}

#define SAP_MODEL_MAGIC "SAPMODEL"

int transformer_save_file(const TransformerModel* model, const char* filepath) {
    if (!model || !filepath) return -1;
    FILE* fp = fopen(filepath, "wb");
    if (!fp) return -1;

    // Header: Magic (8) + Version (4) + Config
    if (fwrite(SAP_MODEL_MAGIC, 1, 8, fp) != 8) { fclose(fp); return -1; }
    uint32_t version = 1;
    if (fwrite(&version, sizeof(uint32_t), 1, fp) != 1) { fclose(fp); return -1; }
    if (fwrite(&model->config, sizeof(TransformerConfig), 1, fp) != 1) { fclose(fp); return -1; }

    const TransformerConfig* c = &model->config;
    const TransformerWeights* w = &model->weights;
    const int dim = c->dim;
    const int hidden_dim = c->hidden_dim;
    const int n_layers = c->n_layers;
    const int n_heads = c->n_heads;
    const int n_kv_heads = c->n_kv_heads;
    const int head_size = dim / n_heads;
    const int kv_dim = n_kv_heads * head_size;
    const int vocab_size = c->vocab_size;

    const size_t blocks_wq = (size_t)dim * dim / QK4_0;
    const size_t blocks_wk = (size_t)kv_dim * dim / QK4_0;
    const size_t blocks_wv = (size_t)kv_dim * dim / QK4_0;
    const size_t blocks_wo = (size_t)dim * dim / QK4_0;
    const size_t blocks_gate = (size_t)hidden_dim * dim / QK4_0;
    const size_t blocks_up = (size_t)hidden_dim * dim / QK4_0;
    const size_t blocks_down = (size_t)dim * hidden_dim / QK4_0;
    const size_t blocks_cls = (size_t)vocab_size * dim / QK4_0;

    fwrite(w->token_embedding_table, sizeof(float), (size_t)vocab_size * dim, fp);

    for (int l = 0; l < n_layers; l++) {
        fwrite(w->rms_att_weight[l], sizeof(float), dim, fp);
        fwrite(w->rms_ffn_weight[l], sizeof(float), dim, fp);
        fwrite(w->wq[l], sizeof(block_q4_0), blocks_wq, fp);
        fwrite(w->wk[l], sizeof(block_q4_0), blocks_wk, fp);
        fwrite(w->wv[l], sizeof(block_q4_0), blocks_wv, fp);
        fwrite(w->wo[l], sizeof(block_q4_0), blocks_wo, fp);
        fwrite(w->w_gate[l], sizeof(block_q4_0), blocks_gate, fp);
        fwrite(w->w_up[l], sizeof(block_q4_0), blocks_up, fp);
        fwrite(w->w_down[l], sizeof(block_q4_0), blocks_down, fp);
    }

    fwrite(w->rms_final_weight, sizeof(float), dim, fp);
    fwrite(w->wcls, sizeof(block_q4_0), blocks_cls, fp);

    fclose(fp);
    return 0;
}

int transformer_load_file(TransformerModel* model, const char* filepath) {
    if (!model || !filepath) return -1;
    FILE* fp = fopen(filepath, "rb");
    if (!fp) return -1;

    char magic[8];
    if (fread(magic, 1, 8, fp) != 8 || memcmp(magic, SAP_MODEL_MAGIC, 8) != 0) {
        fclose(fp);
        return -2;
    }

    uint32_t version = 0;
    if (fread(&version, sizeof(uint32_t), 1, fp) != 1 || version != 1) {
        fclose(fp);
        return -3;
    }

    TransformerConfig cfg;
    if (fread(&cfg, sizeof(TransformerConfig), 1, fp) != 1) {
        fclose(fp);
        return -4;
    }

    // Initialize model allocation with loaded configuration
    if (transformer_init(model, &cfg) != 0) {
        fclose(fp);
        return -5;
    }

    TransformerWeights* w = &model->weights;
    const int dim = cfg.dim;
    const int hidden_dim = cfg.hidden_dim;
    const int n_layers = cfg.n_layers;
    const int n_heads = cfg.n_heads;
    const int n_kv_heads = cfg.n_kv_heads;
    const int head_size = dim / n_heads;
    const int kv_dim = n_kv_heads * head_size;
    const int vocab_size = cfg.vocab_size;

    const size_t blocks_wq = (size_t)dim * dim / QK4_0;
    const size_t blocks_wk = (size_t)kv_dim * dim / QK4_0;
    const size_t blocks_wv = (size_t)kv_dim * dim / QK4_0;
    const size_t blocks_wo = (size_t)dim * dim / QK4_0;
    const size_t blocks_gate = (size_t)hidden_dim * dim / QK4_0;
    const size_t blocks_up = (size_t)hidden_dim * dim / QK4_0;
    const size_t blocks_down = (size_t)dim * hidden_dim / QK4_0;
    const size_t blocks_cls = (size_t)vocab_size * dim / QK4_0;

    if (fread(w->token_embedding_table, sizeof(float), (size_t)vocab_size * dim, fp) != (size_t)vocab_size * dim) {
        fclose(fp); return -6;
    }

    for (int l = 0; l < n_layers; l++) {
        if (fread(w->rms_att_weight[l], sizeof(float), dim, fp) != (size_t)dim) { fclose(fp); return -7; }
        if (fread(w->rms_ffn_weight[l], sizeof(float), dim, fp) != (size_t)dim) { fclose(fp); return -7; }
        if (fread(w->wq[l], sizeof(block_q4_0), blocks_wq, fp) != blocks_wq) { fclose(fp); return -8; }
        if (fread(w->wk[l], sizeof(block_q4_0), blocks_wk, fp) != blocks_wk) { fclose(fp); return -8; }
        if (fread(w->wv[l], sizeof(block_q4_0), blocks_wv, fp) != blocks_wv) { fclose(fp); return -8; }
        if (fread(w->wo[l], sizeof(block_q4_0), blocks_wo, fp) != blocks_wo) { fclose(fp); return -8; }
        if (fread(w->w_gate[l], sizeof(block_q4_0), blocks_gate, fp) != blocks_gate) { fclose(fp); return -8; }
        if (fread(w->w_up[l], sizeof(block_q4_0), blocks_up, fp) != blocks_up) { fclose(fp); return -8; }
        if (fread(w->w_down[l], sizeof(block_q4_0), blocks_down, fp) != blocks_down) { fclose(fp); return -8; }
    }

    if (fread(w->rms_final_weight, sizeof(float), dim, fp) != (size_t)dim) { fclose(fp); return -9; }
    if (fread(w->wcls, sizeof(block_q4_0), blocks_cls, fp) != blocks_cls) { fclose(fp); return -10; }

    fclose(fp);
    return 0;
}
