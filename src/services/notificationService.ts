/**
 * LibreDroid Notification Service
 * System notification dispatch: push, toast, persistent, priority levels,
 * UnifiedPush backend integration, per-domain routing.
 */

import { systemBus } from './systemBus';
import { getBridgeToken } from './hardwareBridgeClient';

/* ─────────────────────────── Types ─────────────────────────── */

export type NotificationPriority = 'silent' | 'low' | 'default' | 'high' | 'urgent';
export type NotificationType = 'toast' | 'persistent' | 'heads_up' | 'system';
export type NotificationChannel =
  | 'messaging'
  | 'calls'
  | 'media'
  | 'updates'
  | 'security'
  | 'system'
  | 'custom';

export interface NotificationAction {
  id: string;
  label: string;
  intent?: string;
}

export interface Notification {
  id: string;
  appId: string;
  appName: string;
  title: string;
  body: string;
  icon?: string;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  timestamp: number;
  read: boolean;
  persistent: boolean;
  actions?: NotificationAction[];
  domain?: string;
  tag?: string;
  groupKey?: string;
  data?: Record<string, unknown>;
}

export interface UnifiedPushEndpoint {
  appId: string;
  endpoint: string;
  publicKey: string;
  auth: string;
  distributorPackage: string;
}

export interface DomainRoutingRule {
  domain: string;
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  blocked: boolean;
}

export interface NotificationServiceState {
  notifications: Notification[];
  unifiedPushEndpoints: Map<string, UnifiedPushEndpoint>;
  domainRules: DomainRoutingRule[];
  doNotDisturb: boolean;
  dndUntil?: number;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getBridgeToken();
  if (token && !headers.has('x-lrd-token')) headers.set('x-lrd-token', token);
  return fetch(input, { ...init, headers });
}

/* ─────────────────────────── Service ─────────────────────────── */

export class NotificationService {
  private static instance: NotificationService;
  private state: NotificationServiceState = {
    notifications: [],
    unifiedPushEndpoints: new Map(),
    domainRules: [],
    doNotDisturb: false,
  };

  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  private constructor() {
    // Listen for push notifications from bridge
    systemBus.subscribe('notification.push', (event) => {
      const notif = event.payload as Notification;
      if (notif) this.dispatch(notif);
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /* ─── Subscriptions ─── */

  public onChange(cb: (notifications: Notification[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb([...this.state.notifications]));
  }

  /* ─── Core Dispatch ─── */

  public dispatch(notif: Omit<Notification, 'id' | 'timestamp' | 'read'> & Partial<Notification>): Notification {
    // Apply DND filter
    if (this.state.doNotDisturb) {
      if (this.state.dndUntil && Date.now() > this.state.dndUntil) {
        this.state.doNotDisturb = false;
      } else if (notif.priority !== 'urgent') {
        // Drop non-urgent notifications during DND
        return notif as Notification;
      }
    }

    // Apply domain routing rules
    if (notif.domain) {
      const rule = this.state.domainRules.find((r) => r.domain === notif.domain);
      if (rule?.blocked) return notif as Notification;
      if (rule?.priority) notif = { ...notif, priority: rule.priority };
    }

    const full: Notification = {
      id: generateId(),
      timestamp: Date.now(),
      read: false,
      ...notif,
    } as Notification;

    // Dedup by tag within same appId
    if (full.tag) {
      this.state.notifications = this.state.notifications.filter(
        (n) => !(n.appId === full.appId && n.tag === full.tag)
      );
    }

    this.state.notifications = [full, ...this.state.notifications].slice(0, 500);
    this.notify();
    systemBus.emit('notification.dispatched', full, 'notificationService');

    // Forward to bridge for native display
    this.postToBridge(full).catch(() => {});
    return full;
  }

  public toast(
    appId: string,
    title: string,
    body: string,
    priority: NotificationPriority = 'default'
  ): Notification {
    return this.dispatch({
      appId,
      appName: appId,
      title,
      body,
      type: 'toast',
      priority,
      channel: 'custom',
      persistent: false,
    });
  }

  public push(
    appId: string,
    appName: string,
    title: string,
    body: string,
    channel: NotificationChannel = 'custom',
    opts: Partial<Notification> = {}
  ): Notification {
    return this.dispatch({
      appId,
      appName,
      title,
      body,
      type: 'heads_up',
      priority: 'default',
      channel,
      persistent: false,
      ...opts,
    });
  }

  public persistent(
    appId: string,
    appName: string,
    title: string,
    body: string,
    opts: Partial<Notification> = {}
  ): Notification {
    return this.dispatch({
      appId,
      appName,
      title,
      body,
      type: 'persistent',
      priority: 'low',
      channel: 'system',
      persistent: true,
      ...opts,
    });
  }

  /* ─── Management ─── */

  public markRead(id: string): void {
    this.state.notifications = this.state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notify();
  }

  public markAllRead(appId?: string): void {
    this.state.notifications = this.state.notifications.map((n) =>
      !appId || n.appId === appId ? { ...n, read: true } : n
    );
    this.notify();
  }

  public dismiss(id: string): void {
    this.state.notifications = this.state.notifications.filter((n) => n.id !== id);
    this.notify();
    systemBus.emit('notification.dismissed', { id }, 'notificationService');
  }

  public dismissByApp(appId: string): void {
    this.state.notifications = this.state.notifications.filter((n) => n.appId !== appId);
    this.notify();
  }

  public clearAll(): void {
    this.state.notifications = this.state.notifications.filter((n) => n.persistent);
    this.notify();
  }

  public getAll(): Notification[] {
    return [...this.state.notifications];
  }

  public getByApp(appId: string): Notification[] {
    return this.state.notifications.filter((n) => n.appId === appId);
  }

  public getUnreadCount(appId?: string): number {
    return this.state.notifications.filter(
      (n) => !n.read && (!appId || n.appId === appId)
    ).length;
  }

  /* ─── Do Not Disturb ─── */

  public setDoNotDisturb(enabled: boolean, durationMs?: number): void {
    this.state.doNotDisturb = enabled;
    this.state.dndUntil = durationMs ? Date.now() + durationMs : undefined;
    systemBus.emit('notification.dnd', { enabled, dndUntil: this.state.dndUntil }, 'notificationService');
  }

  public isDoNotDisturb(): boolean {
    return this.state.doNotDisturb;
  }

  /* ─── UnifiedPush Backend ─── */

  public async registerUnifiedPushEndpoint(appId: string, distributorPackage: string): Promise<UnifiedPushEndpoint | null> {
    try {
      const res = await authFetch('/api/notifications/unifiedpush/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, distributorPackage }),
      });
      if (res.ok) {
        const endpoint: UnifiedPushEndpoint = await res.json();
        this.state.unifiedPushEndpoints.set(appId, endpoint);
        return endpoint;
      }
    } catch {}

    // @mock — fallback endpoint for dev mode
    const mockEndpoint: UnifiedPushEndpoint = {
      appId,
      endpoint: `https://push.libredroid.local/up/${appId}/${generateId()}`,
      publicKey: 'mock-vapid-public-key',
      auth: 'mock-auth-secret',
      distributorPackage,
    };
    this.state.unifiedPushEndpoints.set(appId, mockEndpoint);
    return mockEndpoint;
  }

  public async unregisterUnifiedPushEndpoint(appId: string): Promise<boolean> {
    try {
      const res = await authFetch(`/api/notifications/unifiedpush/unregister/${appId}`, {
        method: 'DELETE',
      });
      this.state.unifiedPushEndpoints.delete(appId);
      return res.ok;
    } catch {
      this.state.unifiedPushEndpoints.delete(appId);
      return false;
    }
  }

  public getUnifiedPushEndpoints(): Map<string, UnifiedPushEndpoint> {
    return new Map(this.state.unifiedPushEndpoints);
  }

  /* ─── Domain Routing ─── */

  public setDomainRule(rule: DomainRoutingRule): void {
    this.state.domainRules = [
      ...this.state.domainRules.filter((r) => r.domain !== rule.domain),
      rule,
    ];
  }

  public removeDomainRule(domain: string): void {
    this.state.domainRules = this.state.domainRules.filter((r) => r.domain !== domain);
  }

  public getDomainRules(): DomainRoutingRule[] {
    return [...this.state.domainRules];
  }

  /* ─── Bridge ─── */

  private async postToBridge(notif: Notification): Promise<void> {
    try {
      await authFetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      });
    } catch {}
  }

  public async fetchPendingFromBridge(): Promise<Notification[]> {
    try {
      const res = await authFetch('/api/notifications/pending');
      if (res.ok) {
        const data = await res.json();
        const pending: Notification[] = data.notifications || [];
        pending.forEach((n) => this.dispatch(n));
        return pending;
      }
    } catch {}
    return [];
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
