import { api } from '../api-client';
import type { Holiday } from '../../features/attendance/types';

export async function getHolidaysApi(year?: number): Promise<Holiday[]> {
  const query = year ? `?year=${year}` : '';
  return api.get<Holiday[]>(`/api/holidays${query}`);
}

export async function createHolidayApi(data: {
  date: string; name: string; description?: string; isRecurring?: boolean;
}): Promise<Holiday> {
  return api.post<Holiday>('/api/holidays', data);
}

export async function updateHolidayApi(id: string, data: {
  date?: string; name?: string; description?: string; isRecurring?: boolean;
}): Promise<Holiday> {
  return api.put<Holiday>(`/api/holidays/${id}`, data);
}

export async function deleteHolidayApi(id: string): Promise<void> {
  await api.delete(`/api/holidays/${id}`);
}
