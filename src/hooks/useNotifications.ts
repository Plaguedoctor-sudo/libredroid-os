/**
 * useNotifications — hook for push/local notifications.
 * Bridges to notificationService. Returns {notify, clearAll, permissions}.
 */

import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/notificationService';
import type {
  Notification as LrdNotification,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../services/notificationService';

export interface NotifyOptions {
  title: string;
  body: string;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  type?: NotificationType;
  icon?: string;
  tag?: string;
  actions?: Array<{ id: string; label: string; intent?: string }>;
  data?: Record<string, unknown>;
}

export interface UseNotificationsReturn {
  notifications: LrdNotification[];
  unreadCount: number;
  notify: (opts: NotifyOptions) => LrdNotification;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  permissions: {
    state: NotificationPermission | 'unsupported';
    request: () => Promise<NotificationPermission | 'unsupported'>;
  };
  doNotDisturb: boolean;
  setDoNotDisturb: (enabled: boolean, durationMs?: number) => void;
}

const service = NotificationService.getInstance();

export function useNotifications(appId: string, appName: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<LrdNotification[]>(
    () => service.getByApp(appId),
  );
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  useEffect(() => {
    const unsubscribe = service.onChange((all: LrdNotification[]) => {
      setNotifications(all.filter((n: LrdNotification) => n.appId === appId));
    });
    return unsubscribe;
  }, [appId]);

  const notify = useCallback(
    (opts: NotifyOptions): LrdNotification => {
      const notif = service.dispatch({
        appId,
        appName,
        title: opts.title,
        body: opts.body,
        channel: opts.channel ?? 'custom',
        priority: opts.priority ?? 'default',
        type: opts.type ?? 'toast',
        icon: opts.icon,
        tag: opts.tag,
        actions: opts.actions,
        data: opts.data,
        persistent: false,
      });

      // Also fire a native browser notification if permission granted
      if (
        permState === 'granted' &&
        document.visibilityState === 'hidden'
      ) {
        try {
          new Notification(opts.title, { body: opts.body, icon: opts.icon });
        } catch {
          // browser may disallow outside user gesture — not fatal
        }
      }

      return notif;
    },
    [appId, appName, permState],
  );

  const dismiss = useCallback((id: string) => service.dismiss(id), []);
  const markRead = useCallback((id: string) => service.markRead(id), []);
  const clearAll = useCallback(() => service.dismissByApp(appId), [appId]);

  const requestPermission = useCallback(async (): Promise<
    NotificationPermission | 'unsupported'
  > => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermState(result);
    return result;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [doNotDisturb, setDndState] = useState(() => service.isDoNotDisturb());
  const setDoNotDisturb = useCallback((enabled: boolean, durationMs?: number) => {
    service.setDoNotDisturb(enabled, durationMs);
    setDndState(enabled);
  }, []);

  return {
    notifications,
    unreadCount,
    notify,
    dismiss,
    markRead,
    clearAll,
    permissions: { state: permState, request: requestPermission },
    doNotDisturb,
    setDoNotDisturb,
  };
}
