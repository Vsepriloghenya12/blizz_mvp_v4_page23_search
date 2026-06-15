import { apiRequest } from '../../../shared/api/client';
import type { AuthResponse, ProfileResponse, UpdateProfileResponse } from '../../../shared/api/types';

export type UpdateProfileInput = {
  name: string;
  username: string;
  bio: string;
  city: string;
  link: string;
};

export async function getMyProfile(token: string): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/api/profile/me', { token });
}

export async function updateMyProfile(token: string, body: UpdateProfileInput): Promise<UpdateProfileResponse> {
  return apiRequest<UpdateProfileResponse>('/api/profile/me', {
    method: 'PATCH',
    token,
    body
  });
}

export function getProfileFromAuth(auth: AuthResponse): ProfileResponse['profile'] {
  return {
    id: auth.activeAccount.id,
    type: auth.activeAccount.type,
    role: auth.activeAccount.role,
    name: auth.activeAccount.name,
    username: auth.activeAccount.username,
    avatar: auth.activeAccount.avatar,
    bio: auth.activeAccount.bio,
    city: auth.activeAccount.city,
    link: auth.activeAccount.link,
    isPrivate: auth.activeAccount.isPrivate,
    businessProfile: auth.activeAccount.businessProfile || null,
    isOwnerView: true,
    stats: {
      posts: 0,
      videos: 0,
      drafts: 0,
      offers: 0,
      saved: 0,
      followers: 0,
      following: 0
    }
  };
}
