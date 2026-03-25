import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotificationEvent } from '../types/notifications';

const MAX_NOTIFICATIONS = 50;
const RECONNECT_DELAY_MS = [1000, 2000, 5000, 10000]; // exponential backoff

function getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    return apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/ws';
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

export function useAdminNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Auth is via HttpOnly cookie sent automatically with the upgrade request.
    // No first-message auth needed.
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      if (evt.data === 'pong') return;
      try {
        const msg = JSON.parse(evt.data) as { type: string };
        if (msg.type === 'auth_ok') {
          setConnected(true);
          retryRef.current = 0;
          // keepalive ping every 30s
          pingRef.current = setInterval(() => ws.send('ping'), 30000);
          return;
        }
        const event = msg as unknown as NotificationEvent;
        setNotifications((prev) => [event, ...prev].slice(0, MAX_NOTIFICATIONS));
        setUnreadCount((n) => n + 1);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      // auto-reconnect with backoff
      const delay = RECONNECT_DELAY_MS[Math.min(retryRef.current, RECONNECT_DELAY_MS.length - 1)];
      retryRef.current++;
      setTimeout(() => connectRef.current(), delay);
    };

    ws.onerror = () => ws.close();
  }, [enabled]);

  useEffect(() => {
    connectRef.current = connect;
    connect();
    return () => {
      wsRef.current?.close();
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [connect]);

  const markAllRead = useCallback(() => setUnreadCount(0), []);
  const clearAll = useCallback(() => { setNotifications([]); setUnreadCount(0); }, []);

  return { notifications, unreadCount, connected, markAllRead, clearAll };
}
