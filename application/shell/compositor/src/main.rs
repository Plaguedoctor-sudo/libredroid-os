use sap_shell_compositor::backend::DrmBackend;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    info!("Starting Sovereign Wayland Compositor (SAP Shell)...");
    let backend = DrmBackend::initialize().map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    info!("Display initialized: {}x{} @ {}Hz", backend.width, backend.height, backend.refresh_hz);
    Ok(())
}
