//! Lock-free single-producer single-consumer circular ring buffer over shared memory.
//! Enables microsecond-latency zero-copy data exchange across isolated process domains.

use std::sync::atomic::{AtomicUsize, Ordering};

#[repr(C)]
pub struct ShmRingHeader {
    pub capacity: usize,
    pub head: AtomicUsize,
    pub tail: AtomicUsize,
}

pub struct ShmRingBuffer<'a> {
    pub header: &'a ShmRingHeader,
    pub data_slice: &'a mut [u8],
}

impl<'a> ShmRingBuffer<'a> {
    pub fn write_slice(&mut self, src: &[u8]) -> Result<usize, &'static str> {
        let head = self.header.head.load(Ordering::Relaxed);
        let tail = self.header.tail.load(Ordering::Acquire);
        let cap = self.header.capacity;

        let available = if head >= tail {
            cap - (head - tail) - 1
        } else {
            tail - head - 1
        };

        if src.len() > available {
            return Err("Ring buffer full");
        }

        let write_len = src.len();
        for (i, byte) in src.iter().enumerate() {
            let idx = (head + i) % cap;
            self.data_slice[idx] = *byte;
        }

        self.header
            .head
            .store((head + write_len) % cap, Ordering::Release);

        Ok(write_len)
    }

    pub fn read_slice(&mut self, dst: &mut [u8]) -> usize {
        let tail = self.header.tail.load(Ordering::Relaxed);
        let head = self.header.head.load(Ordering::Acquire);
        let cap = self.header.capacity;

        let available = if head >= tail {
            head - tail
        } else {
            cap - tail + head
        };

        let read_len = dst.len().min(available);
        for i in 0..read_len {
            let idx = (tail + i) % cap;
            dst[i] = self.data_slice[idx];
        }

        self.header
            .tail
            .store((tail + read_len) % cap, Ordering::Release);

        read_len
    }
}
