import { apiRequest } from '../../../shared/api/client';
import type {
  NotificationFilter,
  NotificationReadResponse,
  NotificationSettingsResponse,
  NotificationsReadAllResponse,
  NotificationsResponse,
  PushTokenResponse,
  UpdateNotificationSettingsInput,
} from '../../../shared/api/types';

export function getNotifications(token: string, filter: NotificationFilter = 'all') {
  return apiRequest<NotificationsResponse>(`/api/notifications?filter=${encodeURIComponent(filter)}`, { token });
}

export function markNotificationRead(token: string, notificationId: string) {
  return apiRequest<NotificationReadResponse>(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    token,
  });
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<NotificationsReadAllResponse>('/api/notifications/read', {
    method: 'POST',
    token,
  });
}

export function getNotificationSettings(token: string) {
  return apiRequest<NotificationSettingsResponse>('/api/notifications/settings', { token });
}

export function updateNotificationSettings(token: string, input: UpdateNotificationSettingsInput) {
  return apiRequest<NotificationSettingsResponse>('/api/notifications/settings', {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function savePushToken(token: string, input: { token: string; platform: 'android' | 'web'; deviceId: string }) {
  return apiRequest<PushTokenResponse>('/api/notifications/push-tokens', {
    method: 'POST',
    token,
    body: input,
  });
}

export function deletePushToken(token: string, deviceId: string) {
  return apiRequest<{ deviceId: string; isActive: false }>(`/api/notifications/push-tokens/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
    token,
  });
}
