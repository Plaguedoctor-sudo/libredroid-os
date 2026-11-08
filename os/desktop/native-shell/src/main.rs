// LibreDroid Pure Native Wayland Shell
// Connects Slint UI to Wayland protocol (subsurfaces, layer-shell) and lrdd UNIX socket

slint::include_modules!();

use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;
use std::sync::mpsc;
use std::time::Duration;

const LRDD_SOCK: &str = "/run/libredroid/lrdd.sock";
const LRDD_FALLBACK: &str = "/tmp/lrdd.sock";

fn send_lrdd_command(cmd_json: &str) -> Option<String> {
    let path = if std::path::Path::new(LRDD_SOCK).exists() {
        LRDD_SOCK
    } else {
        LRDD_FALLBACK
    };

    if let Ok(mut stream) = UnixStream::connect(path) {
        let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
        let _ = writeln!(stream, "{}", cmd_json);
        let mut reader = BufReader::new(stream);
        let mut line = String::new();
        if reader.read_line(&mut line).is_ok() {
            return Some(line);
        }
    }
    None
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("[lrd-native-shell] Initializing Pure Native Wayland Shell (Sub-100MB RAM budget)...");

    let main_window = MainShell::new()?;

    // Connect app launch callback
    let _handle = main_window.as_weak();
    main_window.on_launch_app_requested(move |app_id, domain| {
        println!("[lrd-native-shell] Launching app '{}' in domain '{}'", app_id, domain);
        // Dispatch to lrdd
        let cmd = format!("{{\"type\":\"StartDomain\",\"payload\":{{\"domain\":\"{}\"}}}}", domain);
        let _ = send_lrdd_command(&cmd);
        // Also spawn via local process or lrd-wm
        let _ = std::process::Command::new("/usr/bin/lrd-wm")
            .args(&["launch", &app_id])
            .spawn();
    });

    // Window focus callback
    main_window.on_window_focus_requested(move |win_id| {
        println!("[lrd-native-shell] Focusing window '{}'", win_id);
        let _ = std::process::Command::new("/usr/bin/lrd-wm")
            .args(&["focus", &win_id])
            .spawn();
    });

    // Power action callback
    main_window.on_power_action_requested(move |action| {
        println!("[lrd-native-shell] Power action: {}", action);
        let cmd = format!("{{\"type\":\"PowerAction\",\"payload\":{{\"action\":\"{}\"}}}}", action);
        let _ = send_lrdd_command(&cmd);
    });

    // Background timer to poll time and battery from lrdd
    let timer_handle = main_window.as_weak();
    let timer = slint::Timer::default();
    timer.start(slint::TimerMode::Repeated, Duration::from_secs(2), move || {
        if let Some(ui) = timer_handle.upgrade() {
            // Update time
            let now = chrono_or_simple_time();
            ui.set_time_display(now.into());

            // Query battery from lrdd
            if let Some(resp) = send_lrdd_command("{\"type\":\"GetPowerInfo\"}") {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&resp) {
                    if let Some(pct) = val["payload"]["battery_percentage"].as_i64() {
                        ui.set_battery_percent(pct as i32);
                    }
                    if let Some(charging) = val["payload"]["is_charging"].as_bool() {
                        ui.set_charging_state(charging);
                    }
                }
            }
        }
    });

    println!("[lrd-native-shell] Shell event loop started.");
    main_window.run()?;
    Ok(())
}

fn chrono_or_simple_time() -> String {
    let t = std::time::SystemTime::now();
    let dur = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    let secs = dur.as_secs();
    let hours = (secs / 3600) % 24;
    let mins = (secs / 60) % 60;
    format!("{:02}:{:02}", hours, mins)
}
