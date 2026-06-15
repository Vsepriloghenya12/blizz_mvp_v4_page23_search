import { apiRequest } from '../../../shared/api/client';
import type { AuthResponse } from '../../../shared/api/types';

export function register(login: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { login, password }
  });
}

export function login(login: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { login, password }
  });
}

export function me(token: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/me', {
    method: 'GET',
    token
  });
}

export function logout(token: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
    token
  });
}
