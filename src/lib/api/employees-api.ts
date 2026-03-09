import { api } from '../api-client';
import type { Employee } from '../../features/attendance/types';

type BackendEmployee = Omit<Employee, 'otRateConfig'> & {
  otRateUseDefault: boolean;
  otRateType?: 'multiplier' | 'fixed';
  otRateValue?: number;
};

function mapEmployee(e: BackendEmployee): Employee {
  return {
    ...e,
    otRateConfig: {
      useDefault: e.otRateUseDefault ?? true,
      type: e.otRateType ?? 'multiplier',
      value: e.otRateValue ?? 1.5,
    },
  };
}

export async function getEmployeesApi(filter?: { department?: string; role?: string; search?: string }): Promise<Employee[]> {
  const params = new URLSearchParams(filter as Record<string, string>).toString();
  const rows = await api.get<BackendEmployee[]>(`/api/employees${params ? `?${params}` : ''}`);
  return rows.map(mapEmployee);
}

export async function getEmployeeApi(id: string): Promise<Employee> {
  const row = await api.get<BackendEmployee>(`/api/employees/${id}`);
  return mapEmployee(row);
}

export async function createEmployeeApi(data: Omit<Employee, 'id'> & { password: string }): Promise<Employee> {
  const row = await api.post<BackendEmployee>('/api/employees', data);
  return mapEmployee(row);
}

export async function updateEmployeeApi(id: string, data: Partial<Employee> & { password?: string }): Promise<Employee> {
  const row = await api.put<BackendEmployee>(`/api/employees/${id}`, data);
  return mapEmployee(row);
}

export async function deleteEmployeeApi(id: string): Promise<void> {
  return api.delete(`/api/employees/${id}`);
}
