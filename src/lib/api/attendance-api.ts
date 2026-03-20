import { api } from '../api-client';
import type { AttendanceLog } from '../../features/attendance/types';

type PaginatedResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

export async function getLogsApi(filter?: {
  employeeId?: string; date?: string; startDate?: string; endDate?: string;
  status?: string; page?: number; limit?: number;
}): Promise<AttendanceLog[]> {
  const cleaned: Record<string, string> = {};
  if (filter) {
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined && v !== null && v !== '') cleaned[k] = String(v);
    }
  }
  const params = new URLSearchParams(cleaned).toString();
  const res = await api.get<PaginatedResponse<AttendanceLog>>(`/api/attendance/logs${params ? `?${params}` : ''}`);
  return res.data;
}

export async function getTodayLogApi(): Promise<AttendanceLog | null> {
  return api.get<AttendanceLog | null>('/api/attendance/logs/today');
}

export async function getEmployeeLogsApi(employeeId: string): Promise<AttendanceLog[]> {
  const res = await api.get<PaginatedResponse<AttendanceLog>>(`/api/attendance/logs/${employeeId}`);
  return res.data;
}

export async function checkInApi(lat: number, lng: number): Promise<AttendanceLog> {
  return api.post<AttendanceLog>('/api/attendance/check-in', { lat, lng });
}

export async function checkOutApi(lat: number, lng: number): Promise<AttendanceLog> {
  return api.post<AttendanceLog>('/api/attendance/check-out', { lat, lng });
}
