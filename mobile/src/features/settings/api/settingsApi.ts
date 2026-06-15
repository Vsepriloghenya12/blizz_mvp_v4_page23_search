import { apiRequest } from '../../../shared/api/client';
import type { AccountSettingsResponse, UpdateSettingsInput } from '../../../shared/api/types';

export async function getSettings(token: string): Promise<AccountSettingsResponse> {
  return apiRequest<AccountSettingsResponse>('/api/settings/me', { token });
}

export async function updateSettings(token: string, input: UpdateSettingsInput): Promise<AccountSettingsResponse> {
  return apiRequest<AccountSettingsResponse>('/api/settings/me', {
    method: 'PATCH',
    token,
    body: input,
  });
}
