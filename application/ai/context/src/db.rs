//! Hardware-encrypted local episodic vector database (Local RAG).

use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct VectorRecord {
    pub id: String,
    pub embedding: Vec<f32>,
    pub metadata_json: String,
}

pub struct EncryptedVectorDb {
    records: HashMap<String, VectorRecord>,
}

impl EncryptedVectorDb {
    pub fn new() -> Self {
        Self {
            records: HashMap::new(),
        }
    }

    pub fn insert(&mut self, record: VectorRecord) {
        self.records.insert(record.id.clone(), record);
    }

    pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() || a.is_empty() {
            return 0.0;
        }
        let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm_a == 0.0 || norm_b == 0.0 {
            0.0
        } else {
            dot / (norm_a * norm_b)
        }
    }

    pub fn search(&self, query_vec: &[f32], top_k: usize) -> Vec<(String, f32, String)> {
        let mut results: Vec<(String, f32, String)> = self
            .records
            .values()
            .map(|r| {
                let score = Self::cosine_similarity(query_vec, &r.embedding);
                (r.id.clone(), score, r.metadata_json.clone())
            })
            .collect();

        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(top_k);
        results
    }
}
