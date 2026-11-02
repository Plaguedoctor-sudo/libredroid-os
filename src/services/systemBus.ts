/**
 * SystemBus provides a sovereign, decoupled IPC (Inter-Process Communication) mechanism.
 * It allows disparate OS components (AI, Hardware, UI, Apps) to communicate
 * without tight coupling via an Event-Emitter pattern.
 */
export type SystemEvent = {
  topic: string;
  payload: any;
  timestamp: number;
  sender: string;
};

type EventCallback = (event: SystemEvent) => void;

export class SystemBus {
  private static instance: SystemBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): SystemBus {
    if (!SystemBus.instance) {
      SystemBus.instance = new SystemBus();
    }
    return SystemBus.instance;
  }

  /**
   * Subscribe to a specific system topic (e.g., 'system.power.battery_low', 'app.messaging.send')
   */
  public subscribe(topic: string, callback: EventCallback): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(topic)?.delete(callback);
    };
  }

  public on(topic: string, callback: EventCallback): () => void {
    return this.subscribe(topic, callback);
  }

  /**
   * Emit an event across the system bus
   */
  public emit(topic: string, payload: any = null, sender: string = 'system'): void {
    const event: SystemEvent = {
      topic,
      payload,
      timestamp: Date.now(),
      sender,
    };

    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.forEach(callback => {
        try {
          callback(event);
        } catch (e) {
          console.error(`[SystemBus] Error in listener for ${topic}:`, e);
        }
      });
    }
  }

  /**
   * Broadcast a system-wide alert
   */
  public broadcast(topic: string, payload: any): void {
    this.emit(topic, payload, 'system.broadcast');
  }
}

export const systemBus = SystemBus.getInstance();
