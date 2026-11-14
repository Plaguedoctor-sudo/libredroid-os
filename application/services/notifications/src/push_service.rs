//! Sovereign Push Service: UnifiedPush and Matrix Sygnal decentralized notifications.
//! Local priority queue, rate-limiting, and zero-cloud notification delivery.

use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum NotificationPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3, // Ingress phone calls, security breach alarms, E911
}

#[derive(Debug, Clone)]
pub struct NotificationItem {
    pub id: u32,
    pub app_id: String,
    pub title: String,
    pub body: String,
    pub priority: NotificationPriority,
    pub timestamp_ms: u64,
    pub delivered: bool,
}

pub struct PushService {
    queue: VecDeque<NotificationItem>,
    app_rate_limits: HashMap<String, u32>,
    next_id: u32,
    total_dispatched: u64,
}

impl PushService {
    pub const MAX_QUEUE_SIZE: usize = 64;
    pub const APP_BURST_LIMIT: u32 = 10;

    pub fn new() -> Self {
        Self {
            queue: VecDeque::new(),
            app_rate_limits: HashMap::new(),
            next_id: 1,
            total_dispatched: 0,
        }
    }

    pub fn dispatch(
        &mut self,
        app_id: &str,
        title: &str,
        body: &str,
        priority: NotificationPriority,
    ) -> Result<u32, &'static str> {
        let count = self.app_rate_limits.entry(app_id.to_string()).or_insert(0);
        if *count >= Self::APP_BURST_LIMIT && priority < NotificationPriority::Urgent {
            return Err("Application notification burst rate-limit exceeded");
        }
        *count += 1;

        if self.queue.len() >= Self::MAX_QUEUE_SIZE {
            // Evict oldest non-urgent notification
            if let Some(pos) = self.queue.iter().position(|n| n.priority == NotificationPriority::Low) {
                self.queue.remove(pos);
            } else if let Some(pos) = self.queue.iter().position(|n| n.priority == NotificationPriority::Normal) {
                self.queue.remove(pos);
            }
        }

        let id = self.next_id;
        self.next_id += 1;
        self.total_dispatched += 1;

        let item = NotificationItem {
            id,
            app_id: app_id.to_string(),
            title: title.to_string(),
            body: body.to_string(),
            priority,
            timestamp_ms: 1763164800000,
            delivered: false,
        };

        // Insert sorted by priority (highest priority at front)
        let insert_pos = self.queue.iter().position(|n| n.priority < priority).unwrap_or(self.queue.len());
        self.queue.insert(insert_pos, item);

        Ok(id)
    }

    pub fn poll_next(&mut self) -> Option<NotificationItem> {
        if let Some(mut notif) = self.queue.pop_front() {
            notif.delivered = true;
            Some(notif)
        } else {
            None
        }
    }

    pub fn pending_count(&self) -> usize {
        self.queue.len()
    }

    pub fn dismiss(&mut self, notification_id: u32) -> bool {
        if let Some(pos) = self.queue.iter().position(|n| n.id == notification_id) {
            self.queue.remove(pos);
            true
        } else {
            false
        }
    }
}
