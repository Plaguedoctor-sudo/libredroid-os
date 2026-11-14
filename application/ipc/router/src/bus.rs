use std::collections::HashMap;
use tokio::net::UnixListener;
use tracing::{info, warn};

pub struct MessageBusRouter {
    socket_path: String,
    active_channels: HashMap<String, u64>,
}

impl MessageBusRouter {
    pub fn new(socket_path: &str) -> Self {
        Self {
            socket_path: socket_path.to_string(),
            active_channels: HashMap::new(),
        }
    }

    pub async fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let _ = std::fs::remove_file(&self.socket_path);
        let listener = UnixListener::bind(&self.socket_path)?;
        info!("SAP IPC Message Bus listening on {}", self.socket_path);

        loop {
            match listener.accept().await {
                Ok((stream, _addr)) => {
                    info!("Accepted incoming IPC client connection");
                    tokio::spawn(async move {
                        // Handle Cap'n Proto RPC sessions
                        drop(stream);
                    });
                }
                Err(e) => {
                    warn!("Failed accepting connection: {}", e);
                    break;
                }
            }
        }

        Ok(())
    }
}
