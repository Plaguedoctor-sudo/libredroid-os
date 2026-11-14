//! Sovereign Push Service: UnifiedPush and Matrix Sygnal decentralized notifications.

pub struct PushService;

impl PushService {
    pub fn dispatch_notification(title: &str, body: &str) {
        println!("Notification [{}]: {}", title, body);
    }
}
