use std::fs::File;
use std::io::Read;

#[derive(Debug, Clone, Copy)]
pub struct PressureMetrics {
    pub some_avg10: f32,
    pub full_avg10: f32,
}

pub struct OomGuard;

impl OomGuard {
    pub const PRESSURE_FILE: &'static str = "/proc/pressure/memory";

    pub fn read_psi_pressure() -> Result<PressureMetrics, &'static str> {
        let mut file = File::open(Self::PRESSURE_FILE).map_err(|_| "PSI not available in kernel")?;
        let mut content = String::new();
        file.read_to_string(&mut content).map_err(|_| "Failed reading PSI")?;

        let mut some_avg10 = 0.0;
        let mut full_avg10 = 0.0;

        for line in content.lines() {
            if line.starts_with("some ") {
                for token in line.split_whitespace() {
                    if let Some(val) = token.strip_prefix("avg10=") {
                        some_avg10 = val.parse().unwrap_or(0.0);
                    }
                }
            } else if line.starts_with("full ") {
                for token in line.split_whitespace() {
                    if let Some(val) = token.strip_prefix("avg10=") {
                        full_avg10 = val.parse().unwrap_or(0.0);
                    }
                }
            }
        }

        Ok(PressureMetrics {
            some_avg10,
            full_avg10,
        })
    }

    pub fn should_reclaim_background_apps(metrics: &PressureMetrics) -> bool {
        // If full stall average exceeds 15% in last 10s, initiate aggressive background freezing
        metrics.full_avg10 > 15.0 || metrics.some_avg10 > 40.0
    }
}
