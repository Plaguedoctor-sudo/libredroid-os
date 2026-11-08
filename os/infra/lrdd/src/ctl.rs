mod ipc;

use ipc::{RequestMessage, ResponseMessage};
use std::env;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    let cmd = if args.len() > 1 { args[1].as_str() } else { "status" };

    let socket_path = if std::path::Path::new("/run/libredroid/lrdd.sock").exists() {
        "/run/libredroid/lrdd.sock"
    } else {
        "/tmp/lrdd.sock"
    };

    let mut stream = UnixStream::connect(socket_path)?;
    let req = match cmd {
        "status" => RequestMessage::GetStatus,
        "power" => RequestMessage::GetPowerInfo,
        "domains" => RequestMessage::ListDomains,
        "net" => RequestMessage::GetNetworkState,
        "start" => {
            let target = if args.len() > 2 { &args[2] } else { "workstation" };
            RequestMessage::StartDomain { domain: target.to_string() }
        }
        "stop" => {
            let target = if args.len() > 2 { &args[2] } else { "workstation" };
            RequestMessage::StopDomain { domain: target.to_string() }
        }
        "poweroff" | "reboot" | "suspend" | "lock" => {
            RequestMessage::PowerAction { action: cmd.to_string() }
        }
        _ => RequestMessage::GetStatus,
    };

    let json_req = serde_json::to_string(&req)?;
    writeln!(stream, "{}", json_req)?;

    let mut reader = BufReader::new(stream);
    let mut line = String::new();
    reader.read_line(&mut line)?;

    println!("{}", line.trim());
    Ok(())
}
