//! Deterministic local text embedding engine.

use sha2::{Digest, Sha256};

pub struct LocalEmbeddingGenerator;

impl LocalEmbeddingGenerator {
    pub const DIM: usize = 64;

    pub fn compute_embedding(text: &str) -> Vec<f32> {
        let mut embedding = vec![0.0f32; Self::DIM];
        for (i, word) in text.split_whitespace().enumerate() {
            let mut hasher = Sha256::new();
            hasher.update(word.as_bytes());
            let hash = hasher.finalize();
            for (j, byte) in hash.iter().enumerate().take(Self::DIM) {
                embedding[j] += (*byte as f32 / 255.0) * (1.0 / (i + 1) as f32);
            }
        }
        // Normalize
        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm > 0.0 {
            for v in &mut embedding {
                *v /= norm;
            }
        }
        embedding
    }
}
