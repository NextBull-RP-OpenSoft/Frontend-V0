import { apiFetch, refreshToken_ } from './client';

export async function login(username: string, password: string): Promise<any> {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username: string, email: string, password: string): Promise<any> {
  return apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function refreshToken(refresh_token: string): Promise<any> {
  return refreshToken_(refresh_token);
}
