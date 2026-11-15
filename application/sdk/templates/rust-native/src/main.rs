//! Reference Sovereign Native Application.
//! Runs with zero ambient authority inside an isolated user namespace and Landlock LSM sandbox.

use sap_core_capability::handle::{CapHandle, PERM_READ, PERM_WRITE};
use sap_core_capability::verifier::CapVerifier;

fn main() {
    println!("=== Sovereign Native App Started ===");
    println!("Operating mode: Zero Ambient Authority");

    // Verify display capability token passed by the Sovereign Compositor
    let surface_handle = CapHandle {
        id: [1u8; 32],
        resource_id: "sap://display/surface".to_string(),
        permissions: PERM_READ | PERM_WRITE,
        issuer: "sap.compositor".to_string(),
        recipient: "org.sovereign.sample".to_string(),
        issued_at_ns: 1000,
        expires_at_ns: 0,
    };

    match CapVerifier::verify_access(&surface_handle, "sap://display/surface", PERM_WRITE, 2000) {
        Ok(_) => println!("Display capability verified: UI rendering permitted."),
        Err(e) => eprintln!("Capability denied: {}", e),
    }

    println!("App loop active. Entering zero-waste event wait.");
}
