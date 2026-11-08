use zbus::{Connection, Result};
use std::collections::HashMap;

pub struct DbusManager {
    system_conn: Option<Connection>,
}

impl DbusManager {
    pub async fn new() -> Self {
        let conn = Connection::system().await.ok();
        Self { system_conn: conn }
    }

    pub async fn get_battery_info(&self) -> (u8, bool, f32) {
        if let Some(conn) = &self.system_conn {
            // Query org.freedesktop.UPower
            if let Ok(proxy) = zbus::Proxy::new(
                conn,
                "org.freedesktop.UPower",
                "/org/freedesktop/UPower/devices/DisplayDevice",
                "org.freedesktop.UPower.Device",
            ).await {
                let percentage: f64 = proxy.get_property("Percentage").await.unwrap_or(85.0);
                let state: u32 = proxy.get_property("State").await.unwrap_or(2); // 1 = charging, 2 = discharging
                let temp: f64 = proxy.get_property("Temperature").await.unwrap_or(28.5);
                return (percentage as u8, state == 1, temp as f32);
            }
        }
        (85, false, 28.5)
    }

    pub async fn power_action(&self, action: &str) -> Result<()> {
        if let Some(conn) = &self.system_conn {
            let login_proxy = zbus::Proxy::new(
                conn,
                "org.freedesktop.login1",
                "/org/freedesktop/login1",
                "org.freedesktop.login1.Manager",
            ).await?;

            match action {
                "poweroff" => {
                    let _: () = login_proxy.call("PowerOff", &(true)).await?;
                }
                "reboot" => {
                    let _: () = login_proxy.call("Reboot", &(true)).await?;
                }
                "suspend" => {
                    let _: () = login_proxy.call("Suspend", &(true)).await?;
                }
                "lock" => {
                    let _: () = login_proxy.call("LockSessions", &()).await?;
                }
                _ => {}
            }
        }
        Ok(())
    }

    pub async fn control_domain_unit(&self, domain: &str, start: bool) -> Result<()> {
        if let Some(conn) = &self.system_conn {
            let systemd_proxy = zbus::Proxy::new(
                conn,
                "org.freedesktop.systemd1",
                "/org/freedesktop/systemd1",
                "org.freedesktop.systemd1.Manager",
            ).await?;

            let unit_name = format!("libredroid-domain@{}.service", domain);
            if start {
                let _: (zbus::zvariant::OwnedObjectPath,) = systemd_proxy.call("StartUnit", &(unit_name, "replace")).await?;
            } else {
                let _: (zbus::zvariant::OwnedObjectPath,) = systemd_proxy.call("StopUnit", &(unit_name, "replace")).await?;
            }
        }
        Ok(())
    }
}
