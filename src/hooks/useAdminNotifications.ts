import { useState, useEffect, useRef, useCallback } from 'react';
import type { NotificationEvent } from '../types/notifications';
import { apiRequest } from '../lib/api-client';

const MAX_NOTIFICATIONS = 50;
const RECONNECT_DELAY_MS = [1000, 2000, 5000, 10000]; // exponential backoff

// Direct WS URL to backend (bypasses Vercel proxy which doesn't support WebSocket)
function getWsBackendUrl(token: string): string {
  const apiUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (apiUrl) {
    return `${apiUrl}/ws?token=${encodeURIComponent(token)}`;
  }
  // Local dev: same-origin via Vite proxy (token still used for consistency)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`;
}

async function fetchWsToken(): Promise<string> {
  const data = await apiRequest<{ token: string }>('/api/auth/ws-token');
  return data.token;
}

export function useAdminNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(async () => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    let token: string;
    try {
      token = await fetchWsToken();
    } catch {
      // Not authenticated or server error — retry with backoff
      const delay = RECONNECT_DELAY_MS[Math.min(retryRef.current, RECONNECT_DELAY_MS.length - 1)];
      retryRef.current++;
      setTimeout(() => connectRef.current(), delay);
      return;
    }

    const ws = new WebSocket(getWsBackendUrl(token));
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
