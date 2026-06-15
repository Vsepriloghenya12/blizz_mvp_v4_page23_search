import { apiRequest } from '../../../shared/api/client';
import type {
  MetricEventResponse,
  MetricsActionsResponse,
  MetricsContentResponse,
  MetricsOffersResponse,
  MetricsPeriod,
  MetricsSummary,
} from '../../../shared/api/types';

function withPeriod(path: string, period: MetricsPeriod) {
  return `${path}?period=${encodeURIComponent(period)}`;
}

export function getMetricsSummary(token: string, period: MetricsPeriod = '7d') {
  return apiRequest<MetricsSummary>(withPeriod('/api/metrics/summary', period), { token });
}

export function getMetricsContent(token: string, period: MetricsPeriod = '7d') {
  return apiRequest<MetricsContentResponse>(withPeriod('/api/metrics/content', period), { token });
}

export function getMetricsBusiness(token: string, period: MetricsPeriod = '7d') {
  return apiRequest<{ period: MetricsPeriod; account: MetricsSummary['account']; business: MetricsSummary['business'] }>(withPeriod('/api/metrics/business', period), { token });
}

export function getMetricsOffers(token: string, period: MetricsPeriod = '7d') {
  return apiRequest<MetricsOffersResponse>(withPeriod('/api/metrics/offers', period), { token });
}

export function getMetricsActions(token: string, period: MetricsPeriod = '7d') {
  return apiRequest<MetricsActionsResponse>(withPeriod('/api/metrics/actions', period), { token });
}

export function createMetricEvent(token: string, input: { eventType: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown> }) {
  return apiRequest<MetricEventResponse>('/api/metrics/events', {
    method: 'POST',
    token,
    body: input,
  });
}
