import { api, setToken, clearToken } from '../api-client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
  position: string;
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const result = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
  setToken(result.token);
  return result;
}

export async function logoutApi() {
  clearToken();
}

export async function qrLoginApi(token: string): Promise<{ token: string; user: AuthUser }> {
  const result = await api.post<{ token: string; user: AuthUser }>('/api/auth/qr-login', { token });
  setToken(result.token);
  return result;
}

export async function getEmployeeQRTokenApi(employeeId: string): Promise<{ qrUrl: string; qrToken: string; employeeName: string }> {
  return api.get(`/api/employees/${employeeId}/qr-token`);
}

export async function regenerateQRApi(employeeId: string): Promise<{ qrUrl: string; qrToken: string }> {
  return api.post(`/api/employees/${employeeId}/regenerate-qr`, {});
}

export async function getMeApi(): Promise<AuthUser> {
  return api.get<AuthUser>('/api/auth/me');
}
