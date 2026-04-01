import { apiFetch } from './client';

export async function getUser(): Promise<any> {
  return apiFetch('/api/v1/users/me');
}
