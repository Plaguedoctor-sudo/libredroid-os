use sap_ipc_router::bus::MessageBusRouter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    let socket_path = std::env::var("SAP_IPC_SOCK").unwrap_or_else(|_| "/run/sap/bus.sock".to_string());
    let mut router = MessageBusRouter::new(&socket_path);
    router.run().await
}
