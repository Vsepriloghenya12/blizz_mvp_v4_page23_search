import { apiRequest } from '../../../shared/api/client';
import type {
  ConversationResponse,
  ConversationsResponse,
  CreateConversationResponse,
  SendMessageResponse,
  MarkConversationReadResponse,
  GroupMembersResponse
} from '../../../shared/api/types';

export async function getConversations(token: string, filter: 'all' | 'personal' | 'business' | 'group' = 'all'): Promise<ConversationsResponse> {
  return apiRequest<ConversationsResponse>(`/api/messages/conversations?filter=${encodeURIComponent(filter)}`, { token });
}

export async function getConversation(token: string, conversationId: string): Promise<ConversationResponse> {
  return apiRequest<ConversationResponse>(`/api/messages/conversations/${conversationId}`, { token });
}

export async function createBusinessConversation(token: string, businessAccountId: string): Promise<CreateConversationResponse> {
  return apiRequest<CreateConversationResponse>('/api/messages/conversations', {
    method: 'POST',
    token,
    body: { type: 'business', businessAccountId }
  });
}

export async function createPersonalConversation(token: string, targetAccountId: string): Promise<CreateConversationResponse> {
  return apiRequest<CreateConversationResponse>('/api/messages/conversations', {
    method: 'POST',
    token,
    body: { type: 'personal', targetAccountId }
  });
}


export async function createGroupConversation(
  token: string,
  title: string,
  participantAccountIds: string[],
  clientRequestId: string
): Promise<CreateConversationResponse> {
  return apiRequest<CreateConversationResponse>('/api/messages/groups', {
    method: 'POST',
    token,
    body: { title, participantAccountIds, clientRequestId }
  });
}

export async function getGroupMembers(token: string, conversationId: string): Promise<GroupMembersResponse> {
  return apiRequest<GroupMembersResponse>(`/api/messages/groups/${conversationId}/members`, { token });
}

export async function sendMessage(token: string, conversationId: string, text: string): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>('/api/messages', {
    method: 'POST',
    token,
    body: { conversationId, text }
  });
}

export async function markConversationRead(token: string, conversationId: string): Promise<MarkConversationReadResponse> {
  return apiRequest<MarkConversationReadResponse>('/api/messages/read', {
    method: 'POST',
    token,
    body: { conversationId }
  });
}
