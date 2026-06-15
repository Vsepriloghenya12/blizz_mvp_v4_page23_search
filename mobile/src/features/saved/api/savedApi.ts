import { apiRequest } from '../../../shared/api/client';
import type { SaveObjectResponse, SavedFilter, SavedResponse, SavedTargetType, RemoveSavedResponse } from '../../../shared/api/types';

export async function getSavedItems(token: string, filter: SavedFilter = 'all'): Promise<SavedResponse> {
  return apiRequest<SavedResponse>(`/api/saved?filter=${filter}`, { token });
}

export async function saveObject(token: string, targetType: SavedTargetType, targetId: string): Promise<SaveObjectResponse> {
  return apiRequest<SaveObjectResponse>('/api/saved', {
    method: 'POST',
    token,
    body: { targetType, targetId, category: targetType === 'offer' ? 'offers' : 'want_to_go' }
  });
}

export async function removeSavedObject(token: string, targetType: SavedTargetType, targetId: string): Promise<RemoveSavedResponse> {
  return apiRequest<RemoveSavedResponse>(`/api/saved/${targetType}/${targetId}`, {
    method: 'DELETE',
    token
  });
}
