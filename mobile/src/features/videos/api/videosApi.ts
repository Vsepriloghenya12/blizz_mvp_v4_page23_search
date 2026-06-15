import { apiRequest } from '../../../shared/api/client';
import type {
  CreateVideoResponse,
  MyVideosResponse,
  ToggleVideoLikeResponse,
  ToggleVideoSaveResponse,
  VideoDetailResponse,
  VideoFeedResponse,
  VideoLocation,
  VideoVisibility
} from '../../../shared/api/types';

export type CreateVideoInput = {
  videoUrl: string;
  coverUrl: string;
  description: string;
  location: VideoLocation | null;
  visibility: VideoVisibility;
  soundTitle: string;
};

export async function createVideo(token: string, body: CreateVideoInput): Promise<CreateVideoResponse> {
  return apiRequest<CreateVideoResponse>('/api/videos', {
    method: 'POST',
    token,
    body
  });
}

export async function getMyVideos(token: string): Promise<MyVideosResponse> {
  return apiRequest<MyVideosResponse>('/api/videos/my', { token });
}

export async function getVideoFeed(token: string): Promise<VideoFeedResponse> {
  return apiRequest<VideoFeedResponse>('/api/videos/feed', { token });
}

export async function getVideoDetail(token: string, videoId: string): Promise<VideoDetailResponse> {
  return apiRequest<VideoDetailResponse>(`/api/videos/${videoId}`, { token });
}

export async function toggleVideoLike(token: string, videoId: string): Promise<ToggleVideoLikeResponse> {
  return apiRequest<ToggleVideoLikeResponse>(`/api/videos/${videoId}/like`, {
    method: 'POST',
    token
  });
}

export async function toggleVideoSave(token: string, videoId: string): Promise<ToggleVideoSaveResponse> {
  return apiRequest<ToggleVideoSaveResponse>(`/api/videos/${videoId}/save`, {
    method: 'POST',
    token
  });
}
