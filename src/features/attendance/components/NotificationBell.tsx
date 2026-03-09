import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminNotifications } from '../../../hooks/useAdminNotifications';
import { EVENT_CONFIG } from '../../../types/notifications';
import type { NotificationEvent } from '../../../types/notifications';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatMeta(event: NotificationEvent): string {
  const { type, meta } = event;
  if (type === 'CHECK_IN') return `เข้างาน ${formatTime(meta.time as string)}`;
  if (type === 'CHECK_OUT') return `ออกงาน ${formatTime(meta.time as string)} • ${meta.workHours} ชม.`;
  if (type === 'LATE') return `มาสาย ${meta.minutesLate} นาที`;
  if (type === 'OT_REQUEST') return `ขอ OT วันที่ ${meta.date} (${meta.startTime}–${meta.endTime})`;
  if (type === 'OT_APPROVED') return 'คำขอ OT ได้รับการอนุมัติ';
  if (type === 'OT_REJECTED') return 'คำขอ OT ถูกปฏิเสธ';
  return '';
}

interface Props {
  token: string | null;
}

export function NotificationBell({ token }: Props) {
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
        { description: formatMeta(latest), duration: 4000 }
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
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        title="การแจ้งเตือน"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-blue-600 animate-bounce" />
        ) : (
          <Bell className="w-5 h-5 text-gray-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">การแจ้งเตือน</span>
              <span className={`flex items-center gap-1 text-xs ${connected ? 'text-green-500' : 'text-red-400'}`}>
                {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connected ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์'}
              </span>
            </div>
            <button onClick={clearAll} className="text-gray-400 hover:text-red-500 transition-colors" title="ล้างทั้งหมด">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = EVENT_CONFIG[n.type];
                return (
                  <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <span className="text-lg mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.employeeName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatMeta(n)}</p>
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
