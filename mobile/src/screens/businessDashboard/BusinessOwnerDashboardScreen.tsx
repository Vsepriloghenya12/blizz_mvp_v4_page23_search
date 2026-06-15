import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, BusinessDashboardResponse, MetricsPeriod, ReportItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getBusinessDashboard, updateBusinessOfferStatus } from '../../features/businessDashboard/api/businessDashboardApi';
import { updateBusinessReportOwnerStatus } from '../../features/reports/api/reportsApi';

type DashboardTab = 'overview' | 'metrics' | 'showcase' | 'messages' | 'reports' | 'staff';

const periods: { value: MetricsPeriod; label: string }[] = [
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
];

const tabs: { value: DashboardTab; label: string }[] = [
  { value: 'overview', label: 'Обзор' },
  { value: 'metrics', label: 'Метрики' },
  { value: 'showcase', label: 'Витрина' },
  { value: 'messages', label: 'Сообщения' },
  { value: 'reports', label: 'Жалобы' },
  { value: 'staff', label: 'Сотрудники' },
];

const reasonLabels: Record<string, string> = {
  spam: 'Спам',
  abuse: 'Оскорбления',
  fraud: 'Мошенничество',
  forbidden_content: 'Запрещённый контент',
  personal_data: 'Чужие данные',
  other: 'Другое',
};

const statusLabels: Record<string, string> = {
  new: 'Новая',
  seen: 'Просмотрена',
  handled: 'Обработана',
  archived: 'В архиве',
  reviewing: 'На проверке',
  resolved: 'Решена',
  rejected: 'Отклонена',
  active: 'Активно',
  restricted: 'Ограничено',
};

type BusinessOwnerDashboardScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenMetrics: () => void;
  onOpenMessages: () => void;
  onCreateOffer: () => void;
  onCreatePost: () => void;
  onCreateVideo: () => void;
  onOpenOffer: (offerId: string) => void;
};

export function BusinessOwnerDashboardScreen({ auth, onBack, onOpenMetrics, onOpenMessages, onCreateOffer, onCreatePost, onCreateVideo, onOpenOffer }: BusinessOwnerDashboardScreenProps) {
  const [period, setPeriod] = useState<MetricsPeriod>('7d');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [dashboard, setDashboard] = useState<BusinessDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadDashboard(nextPeriod: MetricsPeriod = period) {
    setLoading(true);
    setError(null);
    try {
      const response = await getBusinessDashboard(auth.session.token, nextPeriod);
      setDashboard(response);
    } catch (_requestError) {
      setError('Не удалось загрузить управление бизнесом. Проверьте backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(period);
  }, [auth.session.token, auth.activeAccount.id, period]);

  const visibleTabs = useMemo(() => {
    if (!dashboard) return tabs;
    return tabs.filter((tab) => {
      if (tab.value === 'metrics') return dashboard.capabilities.canViewMetrics;
      if (tab.value === 'showcase') return dashboard.capabilities.canViewOffers;
      if (tab.value === 'messages') return dashboard.capabilities.canViewMessages;
      if (tab.value === 'reports') return dashboard.capabilities.canViewReports;
      if (tab.value === 'staff') return dashboard.capabilities.canViewStaff;
      return true;
    });
  }, [dashboard]);

  async function handleReport(report: ReportItem, status: 'seen' | 'handled' | 'archived') {
    setSavingId(report.id);
    setNotice(null);
    try {
      await updateBusinessReportOwnerStatus(auth.session.token, report.id, status);
      await loadDashboard(period);
      setNotice('Статус жалобы обновлён');
    } catch (_error) {
      setNotice('Не удалось обновить жалобу');
    } finally {
      setSavingId(null);
    }
  }

  async function handleOfferStatus(offerId: string, status: 'active' | 'archived') {
    setSavingId(offerId);
    setNotice(null);
    try {
      await updateBusinessOfferStatus(auth.session.token, offerId, status);
      await loadDashboard(period);
      setNotice(status === 'archived' ? 'Предложение отправлено в архив' : 'Предложение снова активно');
    } catch (_error) {
      setNotice('Не удалось изменить предложение');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Управление бизнесом</Text>
          <Text style={styles.subtitle}>{auth.activeAccount.name} · {dashboard?.role || auth.activeAccount.role || 'роль'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.periods}>
          {periods.map((item) => (
            <Pressable accessibilityRole="button" key={item.value} onPress={() => setPeriod(item.value)} style={[styles.periodChip, period === item.value && styles.periodChipActive]}>
              <Text style={[styles.periodText, period === item.value && styles.periodTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Загружаем панель владельца</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {dashboard ? (
          <>
            <View style={styles.tabs}>
              {visibleTabs.map((tab) => (
                <Pressable accessibilityRole="button" key={tab.value} onPress={() => setActiveTab(tab.value)} style={[styles.tab, activeTab === tab.value && styles.tabActive]}>
                  <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === 'overview' ? (
              <OverviewTab dashboard={dashboard} onCreateOffer={onCreateOffer} onCreatePost={onCreatePost} onCreateVideo={onCreateVideo} onOpenMessages={onOpenMessages} onOpenMetrics={onOpenMetrics} />
            ) : null}

            {activeTab === 'metrics' ? <MetricsTab dashboard={dashboard} onOpenMetrics={onOpenMetrics} /> : null}
            {activeTab === 'showcase' ? <ShowcaseTab dashboard={dashboard} savingId={savingId} onOpenOffer={onOpenOffer} onStatus={handleOfferStatus} /> : null}
            {activeTab === 'messages' ? <MessagesTab dashboard={dashboard} onOpenMessages={onOpenMessages} /> : null}
            {activeTab === 'reports' ? <ReportsTab dashboard={dashboard} savingId={savingId} onHandle={handleReport} /> : null}
            {activeTab === 'staff' ? <StaffTab dashboard={dashboard} /> : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function OverviewTab({ dashboard, onCreateOffer, onCreatePost, onCreateVideo, onOpenMessages, onOpenMetrics }: { dashboard: BusinessDashboardResponse; onCreateOffer: () => void; onCreatePost: () => void; onCreateVideo: () => void; onOpenMessages: () => void; onOpenMetrics: () => void }) {
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Обзор</Text>
        <View style={styles.metricGrid}>
          <MetricBox label="Профиль" value={dashboard.overview.profileViews} />
          <MetricBox label="Сообщения" value={dashboard.overview.messages} />
          <MetricBox label="Маршруты" value={dashboard.overview.routes} />
          <MetricBox label="Сохранения" value={dashboard.overview.saves} />
          <MetricBox label="Предложения" value={dashboard.overview.activeOffers} />
          <MetricBox label="Новые жалобы" value={dashboard.overview.newReports} danger={dashboard.overview.newReports > 0} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Быстрые действия</Text>
        <View style={styles.actionsGrid}>
          {dashboard.capabilities.canViewOffers ? <ActionButton title="+ Предложение" onPress={onCreateOffer} /> : null}
          {dashboard.capabilities.canViewContent ? <ActionButton title="+ Пост" onPress={onCreatePost} /> : null}
          {dashboard.capabilities.canViewContent ? <ActionButton title="+ Видео" onPress={onCreateVideo} /> : null}
          {dashboard.capabilities.canViewMessages ? <ActionButton title="Сообщения" onPress={onOpenMessages} /> : null}
          {dashboard.capabilities.canViewMetrics ? <ActionButton title="Все метрики" onPress={onOpenMetrics} /> : null}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Важные события</Text>
        <EventLine text={dashboard.reports.new > 0 ? `Новые жалобы: ${dashboard.reports.new}` : 'Новых жалоб нет'} />
        <EventLine text={dashboard.messages.unread > 0 ? `Непрочитанные бизнес-чаты: ${dashboard.messages.unread}` : 'Бизнес-чаты без новых сообщений'} />
        <EventLine text={dashboard.showcase.expiring > 0 ? `Истекают предложения: ${dashboard.showcase.expiring}` : 'Предложения без срочных ограничений'} />
      </View>
    </View>
  );
}

function MetricsTab({ dashboard, onOpenMetrics }: { dashboard: BusinessDashboardResponse; onOpenMetrics: () => void }) {
  const business = dashboard.metrics.summary?.business;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Бизнес-метрики</Text>
      <View style={styles.metricGrid}>
        <MetricBox label="Профиль" value={business?.profileViews || 0} />
        <MetricBox label="Сообщения" value={business?.messages || 0} />
        <MetricBox label="Маршруты" value={business?.routes || 0} />
        <MetricBox label="Сайт" value={business?.siteClicks || 0} />
        <MetricBox label="Звонки" value={business?.phoneClicks || 0} />
        <MetricBox label="Витрина" value={business?.offerViews || 0} />
      </View>
      <Pressable accessibilityRole="button" onPress={onOpenMetrics} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Открыть полный экран метрик</Text>
      </Pressable>
      {dashboard.metrics.content.length > 0 ? <Text style={styles.subsectionTitle}>Лучший контент</Text> : null}
      {dashboard.metrics.content.slice(0, 4).map((item) => <Text key={item.id} style={styles.listLine}>{item.title} · {item.views} просмотров</Text>)}
    </View>
  );
}

function ShowcaseTab({ dashboard, savingId, onOpenOffer, onStatus }: { dashboard: BusinessDashboardResponse; savingId: string | null; onOpenOffer: (id: string) => void; onStatus: (id: string, status: 'active' | 'archived') => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Витрина</Text>
      <View style={styles.metricGrid}>
        <MetricBox label="Активные" value={dashboard.showcase.active} />
        <MetricBox label="Истекают" value={dashboard.showcase.expiring} />
        <MetricBox label="Архив" value={dashboard.showcase.archived} />
        <MetricBox label="Ограничены" value={dashboard.showcase.restricted} danger={dashboard.showcase.restricted > 0} />
      </View>
      {dashboard.showcase.items.length === 0 ? <Text style={styles.emptyText}>Пока нет предложений</Text> : null}
      {dashboard.showcase.items.map((offer) => (
        <View key={offer.id} style={styles.rowCard}>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowTitle}>{offer.title}</Text>
            <Text style={styles.rowSubtitle}>{statusLabels[offer.status] || offer.status}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => onOpenOffer(offer.id)} style={styles.smallButton}><Text style={styles.smallButtonText}>Открыть</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={savingId === offer.id} onPress={() => onStatus(offer.id, offer.status === 'archived' ? 'active' : 'archived')} style={styles.smallButtonSoft}><Text style={styles.smallButtonText}>{offer.status === 'archived' ? 'Вернуть' : 'Архив'}</Text></Pressable>
        </View>
      ))}
    </View>
  );
}

function MessagesTab({ dashboard, onOpenMessages }: { dashboard: BusinessDashboardResponse; onOpenMessages: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Сообщения бизнеса</Text>
      <Text style={styles.cardSubtitle}>Всего чатов: {dashboard.messages.total} · Непрочитано: {dashboard.messages.unread}</Text>
      <Pressable accessibilityRole="button" onPress={onOpenMessages} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Открыть сообщения</Text>
      </Pressable>
      {dashboard.messages.items.map((item) => <Text key={item.id} style={styles.listLine}>{item.title}: {item.lastMessagePreview}</Text>)}
    </View>
  );
}

function ReportsTab({ dashboard, savingId, onHandle }: { dashboard: BusinessDashboardResponse; savingId: string | null; onHandle: (report: ReportItem, status: 'seen' | 'handled' | 'archived') => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Жалобы бизнеса</Text>
      <Text style={styles.cardSubtitle}>Новые: {dashboard.reports.new} · На проверке: {dashboard.reports.reviewing} · Решены: {dashboard.reports.resolved}</Text>
      {dashboard.reports.items.length === 0 ? <Text style={styles.emptyText}>Жалоб на бизнес пока нет</Text> : null}
      {dashboard.reports.items.map((report) => (
        <View key={report.id} style={styles.reportCard}>
          <Text style={styles.rowTitle}>{report.title}</Text>
          <Text style={styles.rowSubtitle}>Причина: {reasonLabels[report.reason] || report.reason}</Text>
          <Text style={styles.rowSubtitle}>Статус: {statusLabels[report.ownerStatus] || report.ownerStatus} · Модерация: {statusLabels[report.moderationStatus] || report.moderationStatus}</Text>
          {report.comment ? <Text style={styles.reportComment}>{report.comment}</Text> : null}
          <View style={styles.inlineActions}>
            <Pressable accessibilityRole="button" disabled={savingId === report.id} onPress={() => onHandle(report, 'seen')} style={styles.smallButton}><Text style={styles.smallButtonText}>Просмотрено</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={savingId === report.id} onPress={() => onHandle(report, 'handled')} style={styles.smallButton}><Text style={styles.smallButtonText}>Обработано</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={savingId === report.id} onPress={() => onHandle(report, 'archived')} style={styles.smallButtonSoft}><Text style={styles.smallButtonText}>Архив</Text></Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function StaffTab({ dashboard }: { dashboard: BusinessDashboardResponse }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Сотрудники</Text>
      {dashboard.staff.length === 0 ? <Text style={styles.emptyText}>Сотрудники недоступны для этой роли</Text> : null}
      {dashboard.staff.map((item) => (
        <View key={item.id} style={styles.rowCard}>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowTitle}>{item.login}</Text>
            <Text style={styles.rowSubtitle}>{item.role} · {item.status}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.helperText}>Полное добавление сотрудников и смена ролей остаются отдельным модулем управления доступами.</Text>
    </View>
  );
}

function MetricBox({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <View style={[styles.metricBox, danger && styles.metricBoxDanger]}>
      <Text style={[styles.metricValue, danger && styles.metricValueDanger]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionButton}>
      <Text style={styles.actionText}>{title}</Text>
    </Pressable>
  );
}

function EventLine({ text }: { text: string }) {
  return <Text style={styles.listLine}>• {text}</Text>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 16 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backText: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  headerTextBlock: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: 'center' },
  headerSpacer: { width: 40 },
  content: { padding: 16, paddingBottom: 30 },
  periods: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  periodChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  periodChipActive: { backgroundColor: colors.softBlue, borderColor: colors.primary },
  periodText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  periodTextActive: { color: colors.primary },
  statusBlock: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  statusText: { color: colors.textSecondary, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  noticeText: { backgroundColor: colors.softBlue, borderRadius: 14, color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 10, padding: 10 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tab: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#FFFFFF' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginBottom: 14, padding: 14 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 5 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  metricBox: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 18, borderWidth: 1, minWidth: '30%', padding: 12 },
  metricBoxDanger: { borderColor: colors.danger },
  metricValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  metricValueDanger: { color: colors.danger },
  metricLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 3 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: { backgroundColor: colors.softBlue, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, marginTop: 14, paddingVertical: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  subsectionTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 16 },
  listLine: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  rowCard: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingVertical: 12 },
  rowTextBlock: { flex: 1 },
  rowTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  rowSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  smallButton: { backgroundColor: colors.softBlue, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonSoft: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  reportCard: { borderTopColor: colors.border, borderTopWidth: 1, paddingVertical: 12 },
  reportComment: { color: colors.textPrimary, fontSize: 13, lineHeight: 18, marginTop: 7 },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 12 },
  helperText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 12 },
});
