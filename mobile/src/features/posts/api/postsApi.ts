import { apiRequest } from '../../../shared/api/client';
import type {
  CreateDraftResponse,
  CreatePostResponse,
  MyDraftsResponse,
  MyPostsResponse,
  PostDetailResponse,
  PostMedia,
  PostVisibility
} from '../../../shared/api/types';

export type CreatePostInput = {
  media: PostMedia[];
  text: string;
  location: {
    title: string;
    address: string;
    lat: number | null;
    lng: number | null;
    precision: 'exact' | 'area';
  } | null;
  visibility: PostVisibility;
};

export async function createPost(token: string, body: CreatePostInput): Promise<CreatePostResponse> {
  return apiRequest<CreatePostResponse>('/api/posts', {
    method: 'POST',
    token,
    body
  });
}

export async function createDraft(token: string, body: CreatePostInput): Promise<CreateDraftResponse> {
  return apiRequest<CreateDraftResponse>('/api/posts/drafts', {
    method: 'POST',
    token,
    body
  });
}

export async function getMyPosts(token: string): Promise<MyPostsResponse> {
  return apiRequest<MyPostsResponse>('/api/posts/my', { token });
}

export async function getMyDrafts(token: string): Promise<MyDraftsResponse> {
  return apiRequest<MyDraftsResponse>('/api/posts/drafts', { token });
}

export async function getPostDetail(token: string, postId: string): Promise<PostDetailResponse> {
  return apiRequest<PostDetailResponse>(`/api/posts/${postId}`, { token });
}
