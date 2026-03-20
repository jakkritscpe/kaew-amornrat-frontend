import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminNotifications } from '../../../hooks/useAdminNotifications';
import { EVENT_CONFIG } from '../../../types/notifications';
import type { NotificationEvent } from '../../../types/notifications';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { cn } from '@/lib/utils';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatMeta(event: NotificationEvent, t: (key: string) => string): string {
  const { type, meta } = event;
  if (type === 'CHECK_IN') return t('notifications.checkInAt').replace('{time}', formatTime(meta.time as string));
  if (type === 'CHECK_OUT') return t('notifications.checkOutAt').replace('{time}', formatTime(meta.time as string)).replace('{hours}', String(meta.workHours));
  if (type === 'LATE') return t('notifications.lateMinutes').replace('{n}', String(meta.minutesLate));
  if (type === 'OT_REQUEST') return t('notifications.otRequestDetail').replace('{date}', String(meta.date)).replace('{start}', String(meta.startTime)).replace('{end}', String(meta.endTime));
  if (type === 'OT_APPROVED') return t('notifications.otApprovedDetail');
  if (type === 'OT_REJECTED') return t('notifications.otRejectedDetail');
  return '';
}

interface Props {
  token: string | null;
}

export function NotificationBell({ token }: Props) {
  const { t } = useTranslation();
  const { dark } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, connected, markAllRead, clearAll } =
    useAdminNotifications(token);

  // Show toast on new notification
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (notifications.length > 0 && notifications.length > prevCountRef.current) {
      const latest = notifications[0];
      const cfg = EVENT_CONFIG[latest.type];
      toast(
        `${cfg.icon} ${latest.employeeName}`,
        { description: formatMeta(latest, t), duration: 4000 }
      );
    }
    prevCountRef.current = notifications.length;
  }, [notifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) markAllRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        data-tour="notifications"
        className={cn('relative p-2 rounded-xl transition-colors', dark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
        title={t('notifications.title')}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-[#044F88] animate-bounce" />
        ) : (
          <Bell className={cn('w-5 h-5', dark ? 'text-white/50' : 'text-gray-500')} />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={cn('absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden', dark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-100')}>
          {/* Header */}
          <div className={cn('flex items-center justify-between px-4 py-3 border-b', dark ? 'border-white/10' : 'border-gray-100')}>
            <div className="flex items-center gap-2">
              <span className={cn('font-semibold text-sm', dark ? 'text-white' : 'text-gray-800')}>{t('notifications.title')}</span>
              <span className={`flex items-center gap-1 text-xs ${connected ? 'text-green-500' : 'text-red-400'}`}>
                {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connected ? t('notifications.connected') : t('notifications.offline')}
              </span>
            </div>
            <button onClick={clearAll} className="text-gray-400 hover:text-red-500 transition-colors" title={t('notifications.clearAll')}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={cn('flex flex-col items-center justify-center py-10', dark ? 'text-white/30' : 'text-gray-400')}>
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = EVENT_CONFIG[n.type];
                return (
                  <div key={n.id} className={cn('flex gap-3 px-4 py-3 border-b last:border-0', dark ? 'hover:bg-white/[0.04] border-white/5' : 'hover:bg-gray-50 border-gray-50')}>
                    <span className="text-lg mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', dark ? 'text-white' : 'text-gray-800')}>{n.employeeName}</p>
                      <p className={cn('text-xs mt-0.5', dark ? 'text-white/50' : 'text-gray-500')}>{formatMeta(n, t)}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap mt-1">
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
