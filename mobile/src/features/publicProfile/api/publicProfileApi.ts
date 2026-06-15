import { apiRequest } from '../../../shared/api/client';
import type { PublicProfilePostsResponse, PublicProfileResponse, PublicProfileVideosResponse } from '../../../shared/api/types';

export function getPublicProfile(token: string, accountId: string) {
  return apiRequest<PublicProfileResponse>(`/api/accounts/${accountId}/public-profile`, { token });
}

export function getPublicProfilePosts(token: string, accountId: string) {
  return apiRequest<PublicProfilePostsResponse>(`/api/accounts/${accountId}/public-posts`, { token });
}

export function getPublicProfileVideos(token: string, accountId: string) {
  return apiRequest<PublicProfileVideosResponse>(`/api/accounts/${accountId}/public-videos`, { token });
}
