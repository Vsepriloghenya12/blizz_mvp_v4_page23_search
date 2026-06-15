import { apiRequest } from '../../../shared/api/client';
import type { GameAnswerResponse, GameCatalogResponse, GameSessionResponse, GameType } from '../../../shared/api/types';

export async function getGamesCatalog(token: string): Promise<GameCatalogResponse> {
  return apiRequest<GameCatalogResponse>('/api/games/catalog', { token });
}

export async function createGameSession(token: string, conversationId: string, gameType: GameType): Promise<GameSessionResponse> {
  return apiRequest<GameSessionResponse>('/api/games/sessions', {
    method: 'POST',
    token,
    body: { conversationId, gameType }
  });
}

export async function getGameSession(token: string, sessionId: string): Promise<GameSessionResponse> {
  return apiRequest<GameSessionResponse>(`/api/games/sessions/${sessionId}`, { token });
}

export async function answerGameSession(token: string, sessionId: string, answer: number | { answerIndex?: number; selectedCup?: number }): Promise<GameAnswerResponse> {
  const body = typeof answer === 'number' ? { answerIndex: answer } : answer;
  return apiRequest<GameAnswerResponse>(`/api/games/sessions/${sessionId}/answer`, {
    method: 'POST',
    token,
    body
  });
}

export async function finishGameSession(token: string, sessionId: string): Promise<GameSessionResponse> {
  return apiRequest<GameSessionResponse>(`/api/games/sessions/${sessionId}/finish`, {
    method: 'POST',
    token
  });
}
