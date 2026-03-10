import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotificationEvent } from '../types/notifications';

const MAX_NOTIFICATIONS = 50;
const RECONNECT_DELAY_MS = [1000, 2000, 5000, 10000]; // exponential backoff

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

export function useAdminNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Token is sent as the first message after connection — NOT in the URL
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      // Authenticate via first message (avoids token appearing in server logs/URLs)
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (evt) => {
      if (evt.data === 'pong') return;
      try {
        const event = JSON.parse(evt.data) as { type?: string } & NotificationEvent;
        if (event.type === 'auth_ok') {
          setConnected(true);
          retryRef.current = 0;
          // keepalive ping every 30s
          pingRef.current = setInterval(() => ws.send('ping'), 30000);
          return;
        }
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
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
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
