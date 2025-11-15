export interface User {
  id: number;
  email: string;
  avatar_url?: string;
  bio?: string;
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  return !!token;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function setAuthHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  return headers;
}
