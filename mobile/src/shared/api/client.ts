import type { ApiErrorPayload } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (_error) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Не удалось подключиться. Проверьте интернет или попробуйте позже.');
  }

  const text = await response.text();
  let json: unknown = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch (_error) {
      throw new ApiError(response.status, 'INVALID_JSON', 'Сервер вернул некорректный ответ. Проверьте API_URL.');
    }
  }

  if (!response.ok) {
    const payload = json as ApiErrorPayload;
    throw new ApiError(
      response.status,
      payload.error?.code || 'REQUEST_FAILED',
      payload.error?.message || 'Ошибка запроса',
      payload.error?.details
    );
  }

  return json as T;
}
