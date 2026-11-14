#ifndef SAP_TRANSFORMER_H
#define SAP_TRANSFORMER_H

#include "sap_tensor_int4.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    int dim;            // Transformer hidden dimension (e.g. 960 for SmolLM2-360M)
    int hidden_dim;     // Feed-forward intermediate dimension (e.g. 2560)
    int n_layers;       // Number of transformer layers (e.g. 32)
    int n_heads;        // Number of query attention heads (e.g. 15)
    int n_kv_heads;     // Number of key/value heads for GQA (e.g. 5)
    int vocab_size;     // Vocabulary size (e.g. 49152)
    int seq_len;        // Maximum sequence length (e.g. 2048)
} TransformerConfig;

typedef struct {
    // Token embeddings: [vocab_size x dim]
    float* token_embedding_table;

    // Layer weights: array of pointers per layer
    float** rms_att_weight;  // [n_layers][dim]
    float** rms_ffn_weight;  // [n_layers][dim]

    // Attention weights in INT4 Q4_0:
    block_q4_0** wq; // [n_layers][dim x (n_heads * head_size)]
    block_q4_0** wk; // [n_layers][dim x (n_kv_heads * head_size)]
    block_q4_0** wv; // [n_layers][dim x (n_kv_heads * head_size)]
    block_q4_0** wo; // [n_layers][(n_heads * head_size) x dim]

    // FFN weights in INT4 Q4_0:
    block_q4_0** w_gate; // [n_layers][dim x hidden_dim]
    block_q4_0** w_up;   // [n_layers][dim x hidden_dim]
    block_q4_0** w_down; // [n_layers][hidden_dim x dim]

    // Final normalization and classifier head
    float* rms_final_weight; // [dim]
    block_q4_0* wcls;        // [dim x vocab_size] in Q4_0
} TransformerWeights;

typedef struct {
    // Current activations
    float* x;      // [dim]
    float* xb;     // [dim]
    float* xb2;    // [dim]
    float* hb;     // [hidden_dim]
    float* hb2;    // [hidden_dim]
    float* q;      // [n_heads * head_size]
    float* k;      // [n_kv_heads * head_size]
    float* v;      // [n_kv_heads * head_size]
    float* att;    // [n_heads * seq_len]
    float* logits; // [vocab_size]

    // Ring-buffer Key-Value Cache
    float* key_cache;   // [n_layers * seq_len * (n_kv_heads * head_size)]
    float* value_cache; // [n_layers * seq_len * (n_kv_heads * head_size)]
} RunState;

typedef struct {
    TransformerConfig config;
    TransformerWeights weights;
    RunState state;
    size_t total_memory_bytes;
} TransformerModel;

// Allocate and initialize transformer model state
int transformer_init(TransformerModel* model, const TransformerConfig* config);

// Free model allocations
void transformer_free(TransformerModel* model);

// Forward single token pass through transformer
float* transformer_forward(TransformerModel* model, int token, int pos, int num_threads);

// Save model weights to binary file
int transformer_save_file(const TransformerModel* model, const char* filepath);

// Load model weights from binary file
int transformer_load_file(TransformerModel* model, const char* filepath);

// Sampling
int sample_next_token(const float* logits, int vocab_size, float temperature);

#ifdef __cplusplus
}
#endif

#endif // SAP_TRANSFORMER_H
