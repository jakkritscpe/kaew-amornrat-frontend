import { api, buildParams } from '../api-client';
import type { OTRequest } from '../../features/attendance/types';

type PaginatedResponse<T> = { data: T[]; pagination: unknown };

export async function getOTRequestsApi(filter?: { status?: string }): Promise<OTRequest[]> {
  const res = await api.get<PaginatedResponse<OTRequest>>(`/api/ot-requests${buildParams({ limit: '1000', ...filter })}`);
  return res.data;
}

export async function getMyOTRequestsApi(): Promise<OTRequest[]> {
  const res = await api.get<PaginatedResponse<OTRequest>>('/api/ot-requests/my');
  return res.data;
}

export async function submitOTRequestApi(data: { date: string; startTime: string; endTime: string; reason: string }): Promise<OTRequest> {
  return api.post<OTRequest>('/api/ot-requests', data);
}

export async function updateOTStatusApi(id: string, status: 'approved' | 'rejected'): Promise<void> {
  return api.patch(`/api/ot-requests/${id}/status`, { status });
}
