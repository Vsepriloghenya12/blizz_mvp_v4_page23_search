import { apiRequest } from '../../../shared/api/client';
import type { AuthResponse } from '../../../shared/api/types';

export type CreateBusinessInput = {
  name: string;
  username: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  website: string;
};

export const BUSINESS_CATEGORIES = [
  'Еда и напитки',
  'Красота и уход',
  'Магазины',
  'Туризм и отдых',
  'Развлечения',
  'Услуги',
  'Спорт',
  'Образование',
  'Здоровье',
  'Дом и ремонт',
  'Авто',
  'Другое'
] as const;

export async function createBusinessAccount(token: string, body: CreateBusinessInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/accounts/business', {
    method: 'POST',
    token,
    body
  });
}

export async function switchAccount(token: string, accountId: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/accounts/switch', {
    method: 'POST',
    token,
    body: { accountId }
  });
}
