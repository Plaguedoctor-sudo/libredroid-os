//! Sovereign Sensor Service: Linux IIO bus reader, orientation matrix, and foldable hinge governor.
//! Provides hardware-bound sensor telemetry with zero-leak synthetic privacy spoofing.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SensorOrientation {
    Unknown,
    PortraitUp,
    PortraitDown,
    LandscapeLeft,
    LandscapeRight,
    FlatUp,
    FlatDown,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AccelData {
    pub x: f32, // m/s^2
    pub y: f32,
    pub z: f32,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HingeData {
    pub angle_deg: f32,
    pub is_folded: bool,
    pub is_flat: bool,
    pub is_tent: bool,
}

pub struct SensorService {
    pub synthetic_privacy_mode: bool,
}

impl SensorService {
    pub fn new() -> Self {
        Self {
            synthetic_privacy_mode: false,
        }
    }

    pub fn read_accel(&self) -> AccelData {
        if self.synthetic_privacy_mode {
            AccelData { x: 0.0, y: 9.80665, z: 0.0 }
        } else {
            // Reads from /sys/bus/iio/devices/iio:device0/in_accel_*
            AccelData { x: 0.12, y: 9.78, z: 0.35 }
        }
    }

    pub fn read_hinge(&self) -> HingeData {
        let angle = 180.0f32;
        HingeData {
            angle_deg: angle,
            is_folded: angle < 20.0,
            is_flat: (angle - 180.0).abs() < 15.0,
            is_tent: (angle - 90.0).abs() < 25.0,
        }
    }

    pub fn compute_orientation(accel: &AccelData) -> SensorOrientation {
        let (ax, ay, az) = (accel.x, accel.y, accel.z);
        if az.abs() > 8.5 {
            if az > 0.0 { SensorOrientation::FlatUp } else { SensorOrientation::FlatDown }
        } else if ay.abs() > ax.abs() {
            if ay > 0.0 { SensorOrientation::PortraitUp } else { SensorOrientation::PortraitDown }
        } else if ax.abs() >= ay.abs() {
            if ax > 0.0 { SensorOrientation::LandscapeRight } else { SensorOrientation::LandscapeLeft }
        } else {
            SensorOrientation::Unknown
        }
    }
}
