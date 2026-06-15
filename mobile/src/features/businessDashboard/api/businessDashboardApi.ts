import { apiRequest } from '../../../shared/api/client';
import type { BusinessDashboardResponse, MetricsPeriod, UpdateBusinessOfferStatusResponse } from '../../../shared/api/types';

export function getBusinessDashboard(token: string, period: MetricsPeriod = '7d') {
  return apiRequest<BusinessDashboardResponse>(`/api/business/dashboard?period=${period}`, { token });
}

export function updateBusinessOfferStatus(token: string, offerId: string, status: 'active' | 'archived') {
  return apiRequest<UpdateBusinessOfferStatusResponse>(`/api/business/offers/${offerId}/status`, { method: 'PATCH', token, body: { status } });
}
