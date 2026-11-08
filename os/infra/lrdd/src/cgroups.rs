use std::fs;
use std::path::Path;

pub struct CgroupController {
    base_path: String,
}

impl CgroupController {
    pub fn new() -> Self {
        let base = "/sys/fs/cgroup/libredroid".to_string();
        let _ = fs::create_dir_all(&base);
        Self { base_path: base }
    }

    pub fn setup_domain_cgroup(&self, domain: &str, max_mem_mb: u64, cpu_shares: u64) -> std::io::Result<()> {
        let domain_cg = format!("{}/{}", self.base_path, domain);
        fs::create_dir_all(&domain_cg)?;

        // Set memory limits: memory.max
        if max_mem_mb > 0 {
            let bytes = max_mem_mb * 1024 * 1024;
            let mem_file = format!("{}/memory.max", domain_cg);
            let _ = fs::write(mem_file, bytes.to_string());
        }

        // Set cpu weight: cpu.weight (1 - 10000)
        let cpu_file = format!("{}/cpu.weight", domain_cg);
        let _ = fs::write(cpu_file, cpu_shares.to_string());

        Ok(())
    }

    pub fn attach_pid(&self, domain: &str, pid: u32) -> std::io::Result<()> {
        let procs_file = format!("{}/{}/cgroup.procs", self.base_path, domain);
        fs::write(procs_file, pid.to_string())
    }

    pub fn read_domain_memory_usage(&self, domain: &str) -> u64 {
        let mem_current = format!("{}/{}/memory.current", self.base_path, domain);
        if let Ok(content) = fs::read_to_string(mem_current) {
            if let Ok(bytes) = content.trim().parse::<u64>() {
                return bytes / (1024 * 1024);
            }
        }
        0
    }
}
