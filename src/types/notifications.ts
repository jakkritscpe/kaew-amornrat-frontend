export type NotificationEventType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'LATE'
  | 'OT_REQUEST'
  | 'OT_APPROVED'
  | 'OT_REJECTED';

export interface NotificationEvent {
  type: NotificationEventType;
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  meta: Record<string, unknown>;
}

export const EVENT_CONFIG: Record<NotificationEventType, { label: string; icon: string; color: string }> = {
  CHECK_IN:    { label: 'เข้างานแล้ว',     icon: '🟢', color: 'text-green-600' },
  CHECK_OUT:   { label: 'ออกงานแล้ว',     icon: '🔵', color: 'text-blue-600' },
  LATE:        { label: 'มาสาย',           icon: '🟡', color: 'text-yellow-600' },
  OT_REQUEST:  { label: 'ขอทำ OT',        icon: '🟠', color: 'text-orange-600' },
  OT_APPROVED: { label: 'OT ได้รับอนุมัติ', icon: '✅', color: 'text-green-600' },
  OT_REJECTED: { label: 'OT ถูกปฏิเสธ',   icon: '❌', color: 'text-red-600' },
};
