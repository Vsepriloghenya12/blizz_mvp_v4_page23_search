import { apiRequest } from '../../../shared/api/client';
import type {
  FollowRequestActionResponse,
  FollowRequestsResponse,
  FollowersResponse,
  FollowingResponse,
  FollowStateResponse,
} from '../../../shared/api/types';

export function getFollowState(token: string, accountId: string) {
  return apiRequest<FollowStateResponse>(`/api/accounts/${accountId}/follow-state`, { token });
}

export function followAccount(token: string, accountId: string) {
  return apiRequest<FollowStateResponse>(`/api/accounts/${accountId}/follow`, {
    method: 'POST',
    token,
  });
}

export function unfollowAccount(token: string, accountId: string) {
  return apiRequest<FollowStateResponse>(`/api/accounts/${accountId}/follow`, {
    method: 'DELETE',
    token,
  });
}

export function getFollowers(token: string, accountId: string) {
  return apiRequest<FollowersResponse>(`/api/accounts/${accountId}/followers`, { token });
}

export function getFollowing(token: string, accountId: string) {
  return apiRequest<FollowingResponse>(`/api/accounts/${accountId}/following`, { token });
}

export function getFollowRequests(token: string) {
  return apiRequest<FollowRequestsResponse>('/api/follow-requests', { token });
}

export function acceptFollowRequest(token: string, requestId: string) {
  return apiRequest<FollowRequestActionResponse>(`/api/follow-requests/${requestId}/accept`, {
    method: 'POST',
    token,
  });
}

export function declineFollowRequest(token: string, requestId: string) {
  return apiRequest<FollowRequestActionResponse>(`/api/follow-requests/${requestId}/decline`, {
    method: 'POST',
    token,
  });
}
