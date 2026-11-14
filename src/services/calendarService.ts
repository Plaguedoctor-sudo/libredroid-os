/**
 * LibreDroid Calendar Service
 * Events CRUD, reminders, CalDAV sync, recurring events,
 * offline-first with conflict resolution.
 */

import { systemBus } from './systemBus';
import { getBridgeToken } from './hardwareBridgeClient';

/* ─────────────────────────── Types ─────────────────────────── */

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type ReminderMethod = 'notification' | 'alarm' | 'email';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  until?: string;      // ISO 8601 date
  byDay?: string[];    // 'MO','TU','WE','TH','FR','SA','SU'
  byMonthDay?: number[];
  byMonth?: number[];
  exceptions?: string[]; // excluded dates ISO
}

export interface EventReminder {
  method: ReminderMethod;
  minutesBefore: number;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;   // ISO 8601
  endTime: string;     // ISO 8601
  allDay: boolean;
  status: EventStatus;
  color?: string;
  reminders: EventReminder[];
  recurrence?: RecurrenceRule;
  attendees?: string[];
  organizer?: string;
  url?: string;
  uid?: string;        // iCal UID for CalDAV
  etag?: string;
  caldavUri?: string;
  syncVersion: number;
  createdAt: number;
  updatedAt: number;
  pendingSync: boolean;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  caldavUrl?: string;
  username?: string;
  password?: string;
  enabled: boolean;
  readOnly: boolean;
  lastSynced?: number;
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: string[];
}

export interface ConflictResolution {
  strategy: 'local_wins' | 'server_wins' | 'latest_wins';
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@libredroid.local`;
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getBridgeToken();
  if (token && !headers.has('x-lrd-token')) headers.set('x-lrd-token', token);
  return fetch(input, { ...init, headers });
}

/* ─────────────────────────── Recurrence Expander ─────────────────────────── */

export function expandRecurringEvent(event: CalendarEvent, windowStart: Date, windowEnd: Date): CalendarEvent[] {
  if (!event.recurrence) return [event];

  const instances: CalendarEvent[] = [];
  const rule = event.recurrence;
  const eventDuration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();

  let current = new Date(event.startTime);
  const interval = rule.interval || 1;
  let count = 0;
  const maxCount = rule.count || 365;
  const until = rule.until ? new Date(rule.until) : windowEnd;
  const exceptions = new Set(rule.exceptions || []);

  while (current <= windowEnd && current <= until && count < maxCount) {
    if (current >= windowStart) {
      const isoDate = current.toISOString().split('T')[0];
      if (!exceptions.has(isoDate)) {
        instances.push({
          ...event,
          id: `${event.id}_${count}`,
          startTime: current.toISOString(),
          endTime: new Date(current.getTime() + eventDuration).toISOString(),
        });
      }
    }

    switch (rule.frequency) {
      case 'daily':
        current = new Date(current.getTime() + interval * 86400000);
        break;
      case 'weekly':
        current = new Date(current.getTime() + interval * 7 * 86400000);
        break;
      case 'monthly':
        current = new Date(current);
        current.setMonth(current.getMonth() + interval);
        break;
      case 'yearly':
        current = new Date(current);
        current.setFullYear(current.getFullYear() + interval);
        break;
    }
    count++;
  }

  return instances;
}

/* ─────────────────────────── Service ─────────────────────────── */

class CalendarService {
  private static instance: CalendarService;
  private events: Map<string, CalendarEvent> = new Map();
  private calendars: Map<string, Calendar> = new Map();
  private conflictResolution: ConflictResolution = { strategy: 'latest_wins' };
  private pendingSync: CalendarEvent[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    // Listen for reminder triggers
    systemBus.subscribe('calendar.check_reminders', () => this.checkReminders());
  }

  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  public onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  /* ─── Calendars ─── */

  public addCalendar(calendar: Omit<Calendar, 'id'>): Calendar {
    const cal: Calendar = {
      ...calendar,
      id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    this.calendars.set(cal.id, cal);
    return cal;
  }

  public getCalendars(): Calendar[] {
    return Array.from(this.calendars.values());
  }

  public removeCalendar(id: string): void {
    this.calendars.delete(id);
    // Remove all events in this calendar
    this.events.forEach((evt, key) => {
      if (evt.calendarId === id) this.events.delete(key);
    });
    this.notify();
  }

  /* ─── CRUD ─── */

  public async createEvent(data: Omit<CalendarEvent, 'id' | 'uid' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'pendingSync'>): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      ...data,
      id: generateId(),
      uid: generateUid(),
      syncVersion: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pendingSync: true,
    };

    try {
      const res = await authFetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        const created: CalendarEvent = await res.json();
        this.events.set(created.id, { ...created, pendingSync: false });
        this.notify();
        systemBus.emit('calendar.event_created', created, 'calendarService');
        return created;
      }
    } catch {}

    // Offline-first: store locally with pendingSync
    this.events.set(event.id, event);
    this.pendingSync.push(event);
    this.notify();
    systemBus.emit('calendar.event_created', event, 'calendarService');
    return event;
  }

  public async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const existing = this.events.get(id);
    if (!existing) return null;

    const updated: CalendarEvent = {
      ...existing,
      ...data,
      id,
      updatedAt: Date.now(),
      syncVersion: existing.syncVersion + 1,
      pendingSync: true,
    };

    try {
      const res = await authFetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const result: CalendarEvent = await res.json();
        this.events.set(id, { ...result, pendingSync: false });
        this.notify();
        systemBus.emit('calendar.event_updated', result, 'calendarService');
        return result;
      }
    } catch {}

    this.events.set(id, updated);
    this.pendingSync.push(updated);
    this.notify();
    return updated;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    try {
      await authFetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
    } catch {}

    const deleted = this.events.delete(id);
    if (deleted) {
      this.notify();
      systemBus.emit('calendar.event_deleted', { id }, 'calendarService');
    }
    return deleted;
  }

  public getEvent(id: string): CalendarEvent | undefined {
    return this.events.get(id);
  }

  public getEvents(calendarId?: string): CalendarEvent[] {
    const all = Array.from(this.events.values());
    return calendarId ? all.filter((e) => e.calendarId === calendarId) : all;
  }

  public getEventsInRange(start: Date, end: Date, calendarId?: string): CalendarEvent[] {
    const base = this.getEvents(calendarId);
    const expanded: CalendarEvent[] = [];

    base.forEach((event) => {
      if (event.recurrence) {
        expanded.push(...expandRecurringEvent(event, start, end));
      } else {
        const eStart = new Date(event.startTime);
        const eEnd = new Date(event.endTime);
        if (eStart <= end && eEnd >= start) {
          expanded.push(event);
        }
      }
    });

    return expanded.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  /* ─── Reminders ─── */

  public checkReminders(): void {
    const now = Date.now();
    this.events.forEach((event) => {
      if (event.status === 'cancelled') return;
      event.reminders.forEach((reminder) => {
        const triggerTime = new Date(event.startTime).getTime() - reminder.minutesBefore * 60000;
        const delta = triggerTime - now;
        if (delta >= 0 && delta < 60000) {
          // Within the next minute — fire
          systemBus.emit(
            'notification.push',
            {
              appId: 'calendar',
              appName: 'Calendar',
              title: `📅 ${event.title}`,
              body: `Starts in ${reminder.minutesBefore} minute${reminder.minutesBefore !== 1 ? 's' : ''}`,
              type: 'heads_up',
              priority: reminder.method === 'alarm' ? 'urgent' : 'high',
              channel: 'custom',
              persistent: false,
              data: { eventId: event.id },
            },
            'calendarService'
          );
        }
      });
    });
  }

  /* ─── CalDAV Sync ─── */

  public setConflictResolution(strategy: ConflictResolution['strategy']): void {
    this.conflictResolution = { strategy };
  }

  public async syncCalDav(calendar: Calendar): Promise<SyncResult> {
    const result: SyncResult = { synced: 0, created: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] };

    try {
      const res = await authFetch('/api/calendar/caldav/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caldavUrl: calendar.caldavUrl,
          username: calendar.username,
          password: calendar.password,
          calendarId: calendar.id,
          conflictStrategy: this.conflictResolution.strategy,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverEvents: CalendarEvent[] = data.events || [];

        for (const se of serverEvents) {
          const local = this.events.get(se.id);
          if (!local) {
            this.events.set(se.id, { ...se, pendingSync: false });
            result.created++;
          } else {
            const resolved = this.resolveConflict(local, se);
            this.events.set(se.id, { ...resolved, pendingSync: false });
            if (resolved.syncVersion !== local.syncVersion) result.updated++;
            else result.conflicts++;
          }
          result.synced++;
        }

        // Push pending local events
        const localPending = Array.from(this.events.values()).filter((e) => e.pendingSync);
        for (const le of localPending) {
          try {
            await authFetch('/api/calendar/caldav/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: le, calendarId: calendar.id }),
            });
            this.events.set(le.id, { ...le, pendingSync: false });
          } catch (err: any) {
            result.errors.push(`Failed to push ${le.id}: ${err?.message}`);
          }
        }

        const updatedCal: Calendar = { ...calendar, lastSynced: Date.now() };
        this.calendars.set(calendar.id, updatedCal);
        this.notify();
        systemBus.emit('calendar.synced', result, 'calendarService');
        return result;
      }
    } catch (err: any) {
      result.errors.push(err?.message || 'CalDAV sync failed');
    }

    return result;
  }

  private resolveConflict(local: CalendarEvent, server: CalendarEvent): CalendarEvent {
    switch (this.conflictResolution.strategy) {
      case 'local_wins':
        return local;
      case 'server_wins':
        return server;
      case 'latest_wins':
      default:
        return local.updatedAt > server.updatedAt ? local : server;
    }
  }

  /* ─── Offline Flush ─── */

  public async flushPendingSync(): Promise<void> {
    const pending = Array.from(this.events.values()).filter((e) => e.pendingSync);
    for (const event of pending) {
      try {
        const res = await authFetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (res.ok) {
          this.events.set(event.id, { ...event, pendingSync: false });
        }
      } catch {}
    }
    this.notify();
  }

  /* ─── Load from Bridge ─── */

  public async loadFromBridge(): Promise<void> {
    try {
      const res = await authFetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        const events: CalendarEvent[] = data.events || [];
        events.forEach((e) => this.events.set(e.id, e));
        this.notify();
        return;
      }
    } catch {}

    // @mock — seed sample events
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);

    const mockEvents: CalendarEvent[] = [
      {
        id: 'evt_mock_1',
        calendarId: 'cal_default',
        title: 'LibreDroid Security Review',
        description: 'Weekly kernel hardening review', // @mock
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0).toISOString(),
        allDay: false,
        status: 'confirmed',
        color: '#3b82f6',
        reminders: [{ method: 'notification', minutesBefore: 15 }],
        uid: generateUid(),
        syncVersion: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pendingSync: false,
      },
      {
        id: 'evt_mock_2',
        calendarId: 'cal_default',
        title: 'Nextcloud Maintenance',
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 3600000).toISOString(),
        allDay: false,
        status: 'confirmed',
        color: '#10b981',
        reminders: [{ method: 'notification', minutesBefore: 30 }],
        uid: generateUid(),
        syncVersion: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pendingSync: false,
      },
    ];

    mockEvents.forEach((e) => this.events.set(e.id, e));
    this.calendars.set('cal_default', {
      id: 'cal_default', name: 'Personal', color: '#3b82f6',
      enabled: true, readOnly: false,
    });
    this.notify();
  }
}

export const calendarService = CalendarService.getInstance();
export default calendarService;
