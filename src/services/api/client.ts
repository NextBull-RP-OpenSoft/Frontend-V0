// ===== Core API Client =====

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb_token');
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sb_token', token);
}

export async function refreshToken_(refresh_token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function apiFetch(path: string, options: RequestInit = {}, _isRetry = false): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Transparent token refresh on 401
  if (res.status === 401 && !_isRetry) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('sb_refresh') : null;
    if (refreshToken) {
      try {
        const refreshed = await refreshToken_(refreshToken);
        if (refreshed?.token) {
          setToken(refreshed.token);
          return apiFetch(path, options, true);
        }
      } catch (_) { /* fall through to throw */ }
    }
    // Refresh failed — clear auth
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_refresh');
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Some endpoints return empty body on success
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}
