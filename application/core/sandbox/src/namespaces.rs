use nix::sched::{unshare, CloneFlags};

pub struct NamespaceIsolation;

impl NamespaceIsolation {
    pub fn isolate_new_process() -> Result<(), String> {
        // Unshare Mount, IPC, Network, and PID namespaces
        let flags = CloneFlags::CLONE_NEWNS
            | CloneFlags::CLONE_NEWIPC
            | CloneFlags::CLONE_NEWNET
            | CloneFlags::CLONE_NEWPID;

        unshare(flags).map_err(|e| format!("Failed unsharing namespaces: {}", e))
    }
}
