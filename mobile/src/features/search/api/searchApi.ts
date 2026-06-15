import { apiRequest } from '../../../shared/api/client';
import type {
  AddRecentSearchResponse,
  ClearRecentSearchesResponse,
  DeleteRecentSearchResponse,
  RecentSearchesResponse,
  SearchResponse,
  SearchResultItem,
  SearchType
} from '../../../shared/api/types';

export function searchAll(token: string, query: string, type: SearchType): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, type });
  return apiRequest<SearchResponse>(`/api/search?${params.toString()}`, { token });
}

export function getRecentSearches(token: string): Promise<RecentSearchesResponse> {
  return apiRequest<RecentSearchesResponse>('/api/search/recent', { token });
}

export function addRecentSearch(token: string, query: string, result?: SearchResultItem): Promise<AddRecentSearchResponse> {
  return apiRequest<AddRecentSearchResponse>('/api/search/recent', {
    method: 'POST',
    token,
    body: {
      query,
      targetType: result?.targetType || 'query',
      targetId: result?.targetId || null,
      title: result?.title || query,
      subtitle: result?.subtitle || ''
    }
  });
}

export function deleteRecentSearch(token: string, id: string): Promise<DeleteRecentSearchResponse> {
  return apiRequest<DeleteRecentSearchResponse>(`/api/search/recent/${id}`, { method: 'DELETE', token });
}

export function clearRecentSearches(token: string): Promise<ClearRecentSearchesResponse> {
  return apiRequest<ClearRecentSearchesResponse>('/api/search/recent', { method: 'DELETE', token });
}
