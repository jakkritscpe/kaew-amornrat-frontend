import { api } from '../api-client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
  position: string;
  accessibleMenus?: string[];
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return api.post<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
}

export async function logoutApi() {
  await api.post('/api/auth/logout', {});
}

export async function qrLoginApi(token: string): Promise<{ token: string; user: AuthUser }> {
  return api.post<{ token: string; user: AuthUser }>('/api/auth/qr-login', { token });
}

export async function getEmployeeQRTokenApi(employeeId: string): Promise<{ qrUrl: string; employeeName: string }> {
  return api.get(`/api/employees/${employeeId}/qr-token`);
}

export async function regenerateQRApi(employeeId: string): Promise<{ qrUrl: string; expiresAt: string }> {
  return api.post(`/api/employees/${employeeId}/regenerate-qr`, {});
}

export async function getMeApi(): Promise<AuthUser> {
  return api.get<AuthUser>('/api/auth/me');
}
