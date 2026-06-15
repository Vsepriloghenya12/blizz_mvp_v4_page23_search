import { apiRequest } from '../../../shared/api/client';
import type { BlockAccountResponse, BlockedAccountsResponse, UnblockAccountResponse } from '../../../shared/api/types';

export function getBlockedAccounts(token: string) {
  return apiRequest<BlockedAccountsResponse>('/api/blocks', { token });
}

export function blockAccount(token: string, targetAccountId: string) {
  return apiRequest<BlockAccountResponse>('/api/blocks', {
    method: 'POST',
    token,
    body: { targetAccountId },
  });
}

export function unblockAccount(token: string, targetAccountId: string) {
  return apiRequest<UnblockAccountResponse>(`/api/blocks/${targetAccountId}`, {
    method: 'DELETE',
    token,
  });
}
