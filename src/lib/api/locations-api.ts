import { api } from '../api-client';
import type { WorkLocation } from '../../features/attendance/types';

export async function getLocationsApi(): Promise<WorkLocation[]> {
  return api.get<WorkLocation[]>('/api/locations');
}

export async function createLocationApi(data: Omit<WorkLocation, 'id'>): Promise<WorkLocation> {
  return api.post<WorkLocation>('/api/locations', data);
}

export async function updateLocationApi(id: string, data: Partial<WorkLocation>): Promise<WorkLocation> {
  return api.put<WorkLocation>(`/api/locations/${id}`, data);
}

export async function deleteLocationApi(id: string): Promise<void> {
  return api.delete(`/api/locations/${id}`);
}
