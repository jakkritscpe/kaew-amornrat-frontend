import { api } from '../api-client';
import type { OTRequest } from '../../features/attendance/types';

export async function getOTRequestsApi(filter?: { status?: string }): Promise<OTRequest[]> {
  const params = new URLSearchParams(filter as Record<string, string>).toString();
  return api.get<OTRequest[]>(`/api/ot-requests${params ? `?${params}` : ''}`);
}

export async function getMyOTRequestsApi(): Promise<OTRequest[]> {
  return api.get<OTRequest[]>('/api/ot-requests/my');
}

export async function submitOTRequestApi(data: { date: string; startTime: string; endTime: string; reason: string }): Promise<OTRequest> {
  return api.post<OTRequest>('/api/ot-requests', data);
}

export async function updateOTStatusApi(id: string, status: 'approved' | 'rejected'): Promise<void> {
  return api.patch(`/api/ot-requests/${id}/status`, { status });
}
