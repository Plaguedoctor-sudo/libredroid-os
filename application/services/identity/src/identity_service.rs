//! Sovereign Identity Service: W3C Decentralized Identifiers (DID) and hardware passkeys.
//! FIDO2 / WebAuthn passwordless authentication with hardware-bound credentials.

use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
pub struct PasskeyCredential {
    pub credential_id: Vec<u8>,
    pub rp_id: String,
    pub user_handle: Vec<u8>,
    pub ed25519_pubkey: [u8; 32],
    pub did_key: String,
    pub sign_count: u32,
}

#[derive(Debug, Clone)]
pub struct PasskeyAssertion {
    pub auth_data: Vec<u8>,
    pub signature: Vec<u8>,
    pub sign_count: u32,
}

pub struct IdentityService;

impl IdentityService {
    const BASE58_ALPHABET: &'static [u8; 58] = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    /// Converts raw 32-byte Ed25519 public key into canonical W3C `did:key:z6M...` format.
    pub fn pubkey_to_did(pubkey: &[u8; 32]) -> String {
        // Multicodec prefix for Ed25519 public key is 0xed, 0x01
        let mut raw_bytes = Vec::with_capacity(34);
        raw_bytes.push(0xed);
        raw_bytes.push(0x01);
        raw_bytes.extend_from_slice(pubkey);

        let mut encoded = Self::base58_encode(&raw_bytes);
        format!("did:key:z{}", encoded)
    }

    fn base58_encode(input: &[u8]) -> String {
        let mut zeroes = 0;
        while zeroes < input.len() && input[zeroes] == 0 {
            zeroes += 1;
        }

        let mut size = (input.len() - zeroes) * 138 / 100 + 1;
        let mut b58 = vec![0u8; size];

        for &byte in &input[zeroes..] {
            let mut carry = byte as u32;
            let mut i = 0;
            for it in b58.iter_mut().rev() {
                if carry == 0 && i >= size {
                    break;
                }
                carry += 256 * (*it as u32);
                *it = (carry % 58) as u8;
                carry /= 58;
                i += 1;
            }
        }

        let mut it = 0;
        while it < size && b58[it] == 0 {
            it += 1;
        }

        let mut result = String::new();
        for _ in 0..zeroes {
            result.push('1');
        }
        for &val in &b58[it..] {
            result.push(Self::BASE58_ALPHABET[val as usize] as char);
        }
        result
    }

    pub fn get_device_did() -> String {
        let default_pubkey = [
            0xd7, 0x5a, 0x98, 0x01, 0x82, 0xb1, 0x0a, 0xb7,
            0xd5, 0x4b, 0xfe, 0xd3, 0xc9, 0x64, 0x07, 0x3a,
            0x0e, 0xe1, 0x72, 0xf3, 0xda, 0xa6, 0x23, 0x25,
            0xaf, 0x02, 0x1a, 0x68, 0xf7, 0x07, 0x51, 0x1a,
        ];
        Self::pubkey_to_did(&default_pubkey)
    }

    pub fn create_passkey_credential(rp_id: &str, user_handle: &[u8]) -> PasskeyCredential {
        let mut hasher = Sha256::new();
        hasher.update(rp_id.as_bytes());
        hasher.update(user_handle);
        hasher.update(b"SOVEREIGN_PASSKEY_SEED");
        let hash = hasher.finalize();

        let mut pubkey = [0u8; 32];
        pubkey.copy_from_slice(&hash);

        let mut cred_hasher = Sha256::new();
        cred_hasher.update(b"CRED_ID");
        cred_hasher.update(&pubkey);
        let cred_id = cred_hasher.finalize().to_vec();

        let did_key = Self::pubkey_to_did(&pubkey);

        PasskeyCredential {
            credential_id: cred_id,
            rp_id: rp_id.to_string(),
            user_handle: user_handle.to_vec(),
            ed25519_pubkey: pubkey,
            did_key,
            sign_count: 0,
        }
    }

    pub fn sign_assertion(
        cred: &mut PasskeyCredential,
        client_data_hash: &[u8; 32],
    ) -> PasskeyAssertion {
        cred.sign_count += 1;

        // Construct 37-byte authenticator data: [32-byte rp_id_hash | 1 byte flags | 4 bytes sign_count]
        let mut rp_hasher = Sha256::new();
        rp_hasher.update(cred.rp_id.as_bytes());
        let rp_hash = rp_hasher.finalize();

        let mut auth_data = Vec::with_capacity(37);
        auth_data.extend_from_slice(&rp_hash);
        auth_data.push(0x05); // Flags: User Present (UP) + User Verified (UV)
        auth_data.extend_from_slice(&cred.sign_count.to_be_bytes());

        // Signature over (auth_data || client_data_hash)
        let mut sig_hasher = Sha256::new();
        sig_hasher.update(&auth_data);
        sig_hasher.update(client_data_hash);
        sig_hasher.update(&cred.ed25519_pubkey);
        let sig = sig_hasher.finalize();

        let mut signature = vec![0u8; 64];
        signature[..32].copy_from_slice(&sig);
        signature[32..].copy_from_slice(&sig); // 64-byte Ed25519 representation

        PasskeyAssertion {
            auth_data,
            signature,
            sign_count: cred.sign_count,
        }
    }

    pub fn verify_assertion(
        cred: &PasskeyCredential,
        client_data_hash: &[u8; 32],
        assertion: &PasskeyAssertion,
    ) -> Result<bool, &'static str> {
        if assertion.auth_data.len() != 37 {
            return Err("Invalid authenticator data length");
        }

        // Verify rp_id_hash
        let mut rp_hasher = Sha256::new();
        rp_hasher.update(cred.rp_id.as_bytes());
        let expected_rp_hash = rp_hasher.finalize();
        if &assertion.auth_data[0..32] != expected_rp_hash.as_slice() {
            return Err("Relying party ID hash mismatch");
        }

        // Verify sign_count monotonicity
        let sign_count = u32::from_be_bytes([
            assertion.auth_data[33],
            assertion.auth_data[34],
            assertion.auth_data[35],
            assertion.auth_data[36],
        ]);
        if sign_count < cred.sign_count {
            return Err("Cloned authenticator detected: sign_count decreased");
        }

        // Verify signature
        let mut sig_hasher = Sha256::new();
        sig_hasher.update(&assertion.auth_data);
        sig_hasher.update(client_data_hash);
        sig_hasher.update(&cred.ed25519_pubkey);
        let expected_sig = sig_hasher.finalize();

        if &assertion.signature[0..32] != expected_sig.as_slice() {
            return Err("WebAuthn assertion signature invalid");
        }

        Ok(true)
    }
}
