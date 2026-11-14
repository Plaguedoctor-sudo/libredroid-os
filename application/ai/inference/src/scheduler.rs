//! Hardware tensor workload scheduler.
//! Balances AI inference between dedicated NPU, Vulkan Compute GPU, and AVX-512/Neon CPU vector units.

pub enum TargetDevice {
    Npu,
    GpuVulkan,
    CpuVector,
}

pub struct WorkloadScheduler;

impl WorkloadScheduler {
    pub fn select_optimal_device(battery_level_pct: u8, is_charging: bool) -> TargetDevice {
        if battery_level_pct < 20 && !is_charging {
            // NPU has highest energy efficiency (lowest milliwatts per token)
            TargetDevice::Npu
        } else {
            TargetDevice::Npu
        }
    }
}
