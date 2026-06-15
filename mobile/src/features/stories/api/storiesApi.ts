import { apiRequest } from '../../../shared/api/client';
import type {
  AccountStoriesResponse,
  CreateStoryResponse,
  MyStoriesResponse,
  StoriesFeedResponse,
  StoryDetailResponse,
  StoryLocation,
  StoryMediaType,
  StoryReplyResponse,
  StoryViewResponse,
  StoryVisibility
} from '../../../shared/api/types';

export type CreateStoryInput = {
  mediaType: StoryMediaType;
  mediaUrl: string;
  text: string;
  location: StoryLocation | null;
  visibility: StoryVisibility;
};

export async function createStory(token: string, body: CreateStoryInput): Promise<CreateStoryResponse> {
  return apiRequest<CreateStoryResponse>('/api/stories', {
    method: 'POST',
    token,
    body
  });
}

export async function getStoriesFeed(token: string): Promise<StoriesFeedResponse> {
  return apiRequest<StoriesFeedResponse>('/api/stories/feed', { token });
}

export async function getMyStories(token: string): Promise<MyStoriesResponse> {
  return apiRequest<MyStoriesResponse>('/api/stories/my', { token });
}

export async function getAccountStories(token: string, accountId: string): Promise<AccountStoriesResponse> {
  return apiRequest<AccountStoriesResponse>(`/api/stories/${accountId}`, { token });
}

export async function getStoryDetail(token: string, storyId: string): Promise<StoryDetailResponse> {
  return apiRequest<StoryDetailResponse>(`/api/stories/detail/${storyId}`, { token });
}

export async function markStoryView(token: string, storyId: string): Promise<StoryViewResponse> {
  return apiRequest<StoryViewResponse>(`/api/stories/${storyId}/view`, {
    method: 'POST',
    token
  });
}

export async function replyToStory(token: string, storyId: string, text: string): Promise<StoryReplyResponse> {
  return apiRequest<StoryReplyResponse>(`/api/stories/${storyId}/reply`, {
    method: 'POST',
    token,
    body: { text }
  });
}
