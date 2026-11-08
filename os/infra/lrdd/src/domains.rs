use crate::ipc::DomainInfo;
use crate::cgroups::CgroupController;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct DomainManager {
    cgroups: CgroupController,
    domains: Arc<Mutex<HashMap<String, DomainInfo>>>,
}

impl DomainManager {
    pub fn new() -> Self {
        let mut map = HashMap::new();
        // Seed default sovereign domains
        map.insert("vault".to_string(), DomainInfo {
            name: "vault".to_string(),
            tier: "tier2_microvm".to_string(),
            state: "isolated".to_string(),
            memory_current_mb: 48,
            memory_max_mb: 256,
            wayland_socket: "/run/user/1000/wayland-domain-vault".to_string(),
        });
        map.insert("tor-gateway".to_string(), DomainInfo {
            name: "tor-gateway".to_string(),
            tier: "tier2_microvm".to_string(),
            state: "running".to_string(),
            memory_current_mb: 64,
            memory_max_mb: 512,
            wayland_socket: "/run/user/1000/wayland-domain-tor".to_string(),
        });
        map.insert("waydroid".to_string(), DomainInfo {
            name: "waydroid".to_string(),
            tier: "tier1_container".to_string(),
            state: "running".to_string(),
            memory_current_mb: 180,
            memory_max_mb: 2048,
            wayland_socket: "/run/user/1000/wayland-waydroid".to_string(),
        });
        map.insert("workstation".to_string(), DomainInfo {
            name: "workstation".to_string(),
            tier: "tier1_container".to_string(),
            state: "running".to_string(),
            memory_current_mb: 110,
            memory_max_mb: 4096,
            wayland_socket: "/run/user/1000/wayland-domain-workstation".to_string(),
        });

        Self {
            cgroups: CgroupController::new(),
            domains: Arc::new(Mutex::new(map)),
        }
    }

    pub async fn list_domains(&self) -> Vec<DomainInfo> {
        let lock = self.domains.lock().await;
        let mut list: Vec<DomainInfo> = lock.values().cloned().collect();
        // Update memory from cgroups if active
        for dom in &mut list {
            let used = self.cgroups.read_domain_memory_usage(&dom.name);
            if used > 0 {
                dom.memory_current_mb = used;
            }
        }
        list
    }

    pub async fn start_domain(&self, name: &str) -> Result<String, String> {
        let mut lock = self.domains.lock().await;
        if let Some(dom) = lock.get_mut(name) {
            dom.state = "running".to_string();
            let _ = self.cgroups.setup_domain_cgroup(name, dom.memory_max_mb, 100);
            Ok(format!("Domain '{}' started successfully", name))
        } else {
            Err(format!("Domain '{}' not found in registry", name))
        }
    }

    pub async fn stop_domain(&self, name: &str) -> Result<String, String> {
        let mut lock = self.domains.lock().await;
        if let Some(dom) = lock.get_mut(name) {
            dom.state = "stopped".to_string();
            Ok(format!("Domain '{}' stopped", name))
        } else {
            Err(format!("Domain '{}' not found", name))
        }
    }
}
