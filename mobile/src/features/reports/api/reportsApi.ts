import { apiRequest } from '../../../shared/api/client';
import type { BusinessReportsResponse, CreateReportInput, CreateReportResponse, ModerationReportsResponse, ReportOwnerStatusResponse, ReportModerationStatusResponse } from '../../../shared/api/types';

export function createReport(token: string, input: CreateReportInput) {
  return apiRequest<CreateReportResponse>('/api/reports', { method: 'POST', token, body: input });
}

export function getMyReports(token: string) {
  return apiRequest<BusinessReportsResponse>('/api/reports/my', { token });
}

export function getBusinessReports(token: string, status: string = 'all') {
  return apiRequest<BusinessReportsResponse>(`/api/reports/business?status=${encodeURIComponent(status)}`, { token });
}

export function updateBusinessReportOwnerStatus(token: string, reportId: string, status: 'seen' | 'handled' | 'archived', ownerNote?: string) {
  return apiRequest<ReportOwnerStatusResponse>(`/api/reports/business/${reportId}/owner-status`, { method: 'PATCH', token, body: { status, ownerNote } });
}

export function getModerationReports(token: string, status: string = 'all') {
  return apiRequest<ModerationReportsResponse>(`/api/moderation/reports?status=${encodeURIComponent(status)}`, { token });
}

export function updateModerationReportStatus(token: string, reportId: string, status: 'new' | 'reviewing' | 'resolved' | 'rejected', moderationNote?: string) {
  return apiRequest<ReportModerationStatusResponse>(`/api/moderation/reports/${reportId}/status`, { method: 'PATCH', token, body: { status, moderationNote } });
}
