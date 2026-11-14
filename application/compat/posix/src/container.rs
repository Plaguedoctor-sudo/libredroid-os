//! Bubblewrap container runner for standard POSIX desktop applications.

pub struct PosixContainerRunner;

impl PosixContainerRunner {
    pub fn spawn_rootless_app(command: &str) -> Result<u32, &'static str> {
        println!("Spawning rootless bwrap container for: {}", command);
        Ok(4042)
    }
}
