import { apiRequest } from '../../../shared/api/client';
import type {
  CommentsResponse,
  CreateCommentResponse,
  DeleteCommentResponse,
  FeedResponse,
  TogglePostLikeResponse,
  TogglePostSaveResponse
} from '../../../shared/api/types';

export async function getFeed(token: string, scope: 'personal' | 'business' = 'personal'): Promise<FeedResponse> {
  return apiRequest<FeedResponse>(`/api/posts/feed?scope=${scope}`, { token });
}

export async function togglePostLike(token: string, postId: string): Promise<TogglePostLikeResponse> {
  return apiRequest<TogglePostLikeResponse>(`/api/posts/${postId}/like`, {
    method: 'POST',
    token
  });
}

export async function togglePostSave(token: string, postId: string): Promise<TogglePostSaveResponse> {
  return apiRequest<TogglePostSaveResponse>(`/api/posts/${postId}/save`, {
    method: 'POST',
    token
  });
}

export async function getPostComments(token: string, postId: string): Promise<CommentsResponse> {
  return apiRequest<CommentsResponse>(`/api/posts/${postId}/comments`, { token });
}

export async function createPostComment(token: string, postId: string, text: string): Promise<CreateCommentResponse> {
  return apiRequest<CreateCommentResponse>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    token,
    body: { text }
  });
}

export async function deletePostComment(token: string, commentId: string): Promise<DeleteCommentResponse> {
  return apiRequest<DeleteCommentResponse>(`/api/comments/${commentId}`, {
    method: 'DELETE',
    token
  });
}

export async function getShareRecipients(token: string): Promise<import('../../../shared/api/types').ShareRecipientsResponse> {
  return apiRequest<import('../../../shared/api/types').ShareRecipientsResponse>('/api/share/recipients', { token });
}

export async function sharePostToAccount(token: string, postId: string, targetAccountId: string): Promise<import('../../../shared/api/types').SharePostResponse> {
  return apiRequest<import('../../../shared/api/types').SharePostResponse>('/api/share/post', {
    method: 'POST',
    token,
    body: { postId, targetAccountId }
  });
}
