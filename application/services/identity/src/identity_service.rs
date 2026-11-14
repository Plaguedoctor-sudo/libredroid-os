//! Sovereign Identity Service: W3C Decentralized Identifiers (DID) and hardware passkeys.

pub struct IdentityService;

impl IdentityService {
    pub fn get_device_did() -> String {
        "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK".to_string()
    }
}
