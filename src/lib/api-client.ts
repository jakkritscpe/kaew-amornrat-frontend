const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const EMPLOYEE_KEY = 'attendance_employee';
export const USER_KEY = 'repairhub_user';

export interface ApiError {
  status: number;
  message: string;
}

export function createApiError(status: number, message: string): ApiError & Error {
  const err = new Error(message) as ApiError & Error;
  err.status = status;
  return err;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Send HttpOnly auth cookie automatically
  });
  const json = await res.json() as { success: boolean; data?: T; error?: string };

  if (!res.ok || !json.success) {
    if (res.status === 401) {
      // Clear local profile data and notify AuthContext to log out
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EMPLOYEE_KEY);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw createApiError(res.status, json.error ?? 'Request failed');
  }

  return json.data as T;
}

/**
 * Build a URL query string from a filter object, skipping undefined/null/empty values.
 * Returns a string starting with "?" or an empty string if there are no params.
 */
export function buildParams(filter?: Record<string, unknown>): string {
  const cleaned: Record<string, string> = {};
  if (filter) {
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined && v !== null && v !== '') cleaned[k] = String(v);
    }
  }
  const p = new URLSearchParams(cleaned).toString();
  return p ? `?${p}` : '';
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
