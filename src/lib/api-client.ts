// TODO: implement API client for backend integration
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  // TODO: implement with auth token
  throw new Error('Not implemented');
}
