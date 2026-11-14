use nix::sys::mman::{mmap, shm_open, MapFlags, ProtFlags};
use nix::sys::stat::Mode;
use nix::unistd::ftruncate;
use std::os::fd::AsRawFd;

pub struct ShmAllocator;

impl ShmAllocator {
    pub fn create_shared_region(name: &str, size_bytes: usize) -> Result<std::os::fd::OwnedFd, String> {
        let fd = shm_open(
            name,
            nix::fcntl::OFlag::O_CREAT | nix::fcntl::OFlag::O_RDWR,
            Mode::S_IRUSR | Mode::S_IWUSR,
        )
        .map_err(|e| format!("shm_open failed: {}", e))?;

        ftruncate(fd.as_raw_fd(), size_bytes as i64)
            .map_err(|e| format!("ftruncate failed: {}", e))?;

        Ok(fd)
    }
}
