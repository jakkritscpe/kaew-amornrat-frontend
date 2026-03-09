import { api } from '../api-client';
import type { AttendanceLog } from '../../features/attendance/types';

export async function getLogsApi(filter?: {
  employeeId?: string; date?: string; status?: string;
}): Promise<AttendanceLog[]> {
  const params = new URLSearchParams(filter as Record<string, string>).toString();
  return api.get<AttendanceLog[]>(`/api/attendance/logs${params ? `?${params}` : ''}`);
}

export async function getTodayLogApi(): Promise<AttendanceLog | null> {
  return api.get<AttendanceLog | null>('/api/attendance/logs/today');
}

export async function getEmployeeLogsApi(employeeId: string): Promise<AttendanceLog[]> {
  return api.get<AttendanceLog[]>(`/api/attendance/logs/${employeeId}`);
}

export async function checkInApi(lat: number, lng: number): Promise<AttendanceLog> {
  return api.post<AttendanceLog>('/api/attendance/check-in', { lat, lng });
}

export async function checkOutApi(lat: number, lng: number): Promise<AttendanceLog> {
  return api.post<AttendanceLog>('/api/attendance/check-out', { lat, lng });
}
