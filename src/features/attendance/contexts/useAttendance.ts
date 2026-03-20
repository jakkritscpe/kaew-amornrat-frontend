import { useContext } from 'react';
import { AttendanceContext } from './attendance-context-value';

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}
