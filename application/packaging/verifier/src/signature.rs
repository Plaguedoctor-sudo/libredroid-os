//! Ed25519 & Dilithium cryptographic signature verification.

use ed25519_dalek::{Signature, VerifyingKey};

pub struct PackageVerifier;

impl PackageVerifier {
    pub fn verify_ed25519(
        message_bytes: &[u8],
        signature_bytes: &[u8; 64],
        public_key_bytes: &[u8; 32],
    ) -> Result<(), &'static str> {
        let verifying_key = VerifyingKey::from_bytes(public_key_bytes)
            .map_err(|_| "Invalid public key bytes")?;
        let signature = Signature::from_bytes(signature_bytes);

        verifying_key
            .verify_strict(message_bytes, &signature)
            .map_err(|_| "Signature verification failed")
    }
}
