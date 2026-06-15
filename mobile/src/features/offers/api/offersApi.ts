import { apiRequest } from '../../../shared/api/client';
import type {
  CreateOfferResponse,
  MyOffersResponse,
  OfferItem,
  OfferResponse,
  OfferType,
  ShowcaseFeedResponse,
  ToggleOfferSaveResponse
} from '../../../shared/api/types';

export type CreateOfferInput = {
  type: OfferType;
  title: string;
  coverUrl: string;
  description: string;
  priceOrCondition: string;
  expiresAt: string;
  address: string;
  location: OfferItem['location'];
};

export async function createOffer(token: string, body: CreateOfferInput): Promise<CreateOfferResponse> {
  return apiRequest<CreateOfferResponse>('/api/offers', {
    method: 'POST',
    token,
    body
  });
}

export async function getMyOffers(token: string): Promise<MyOffersResponse> {
  return apiRequest<MyOffersResponse>('/api/offers/my', { token });
}

export async function getBusinessOffers(token: string, accountId: string): Promise<MyOffersResponse> {
  return apiRequest<MyOffersResponse>(`/api/business/${accountId}/offers`, { token });
}

export async function getShowcaseFeed(token: string): Promise<ShowcaseFeedResponse> {
  return apiRequest<ShowcaseFeedResponse>('/api/offers/showcase', { token });
}

export async function getOffer(token: string, offerId: string): Promise<OfferResponse> {
  return apiRequest<OfferResponse>(`/api/offers/${offerId}`, { token });
}

export async function toggleOfferSave(token: string, offerId: string): Promise<ToggleOfferSaveResponse> {
  return apiRequest<ToggleOfferSaveResponse>(`/api/offers/${offerId}/save`, {
    method: 'POST',
    token
  });
}
