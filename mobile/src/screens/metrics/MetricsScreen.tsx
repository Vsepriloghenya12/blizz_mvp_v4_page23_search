import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, MetricsContentItem, MetricsOfferItem, MetricsPeriod, MetricsSummary } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { BackButton } from '../../shared/ui/BackButton';
import { getMetricsActions, getMetricsContent, getMetricsOffers, getMetricsSummary } from '../../features/metrics/api/metricsApi';

type MetricsScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
};

const periods: MetricsPeriod[] = ['7d', '30d', '90d'];
const periodLabels: Record<MetricsPeriod, string> = {
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': '90 дней',
};

export function MetricsScreen({ auth, onBack }: MetricsScreenProps) {
  const [period, setPeriod] = useState<MetricsPeriod>('7d');
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [content, setContent] = useState<MetricsContentItem[]>([]);
  const [offers, setOffers] = useState<MetricsOfferItem[]>([]);
  const [actionsCount, setActionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      setLoading(true);
      setError(null);
      try {
        const summaryResponse = await getMetricsSummary(auth.session.token, period);
        let contentItems: MetricsContentItem[] = [];
        let offerItems: MetricsOfferItem[] = [];
        let actionItemsCount = 0;

        if (summaryResponse.capabilities.canViewContent) {
          const contentResponse = await getMetricsContent(auth.session.token, period);
          contentItems = contentResponse.items;
        }
        if (summaryResponse.capabilities.canViewOffers) {
          const offersResponse = await getMetricsOffers(auth.session.token, period);
          offerItems = offersResponse.items;
        }
        if (summaryResponse.capabilities.canViewActions) {
          const actionsResponse = await getMetricsActions(auth.session.token, period);
          actionItemsCount = actionsResponse.items.length;
        }

        if (mounted) {
          setSummary(summaryResponse);
          setContent(contentItems);
          setOffers(offerItems);
          setActionsCount(actionItemsCount);
        }
      } catch (_requestError) {
        if (mounted) setError('Не удалось загрузить метрики. Проверьте backend.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMetrics();

    return () => {
      mounted = false;
    };
  }, [auth.session.token, auth.activeAccount.id, period]);

  const title = auth.activeAccount.type === 'business' ? 'Метрики бизнеса' : 'Метрики';
  const overviewRows = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Просмотры профиля', value: summary.overview.profileViews },
      { label: 'Охват', value: summary.overview.reach },
      { label: 'Вовлечённость', value: summary.overview.engagement },
      { label: 'Новые подписчики', value: summary.overview.newFollowers },
      { label: 'Сообщения', value: summary.overview.messages },
    ];
  }, [summary]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.accountLine}>{auth.activeAccount.name} · @{auth.activeAccount.username}</Text>

        <View style={styles.periods}>
          {periods.map((item) => {
            const active = period === item;
            return (
              <Pressable accessibilityRole="button" key={item} onPress={() => setPeriod(item)} style={[styles.periodButton, active && styles.periodButtonActive]}>
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{periodLabels[item]}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Считаем метрики</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {summary ? (
          <>
            <Section title="Обзор">
              <View style={styles.grid}>
                {overviewRows.map((row) => <MetricCard key={row.label} label={row.label} value={row.value} />)}
              </View>
            </Section>

            {summary.personal ? (
              <Section title="Личный аккаунт">
                <View style={styles.listCard}>
                  <MetricRow label="Посты" value={summary.personal.postViews} suffix="просмотров" />
                  <MetricRow label="Видео" value={summary.personal.videoViews} suffix="просмотров" />
                  <MetricRow label="Близзы" value={summary.personal.storyViews} suffix="просмотров" />
                  <MetricRow label="Лайки" value={summary.personal.likes} />
                  <MetricRow label="Комментарии" value={summary.personal.comments} />
                  <MetricRow label="Сохранения" value={summary.personal.saves} />
                  <MetricRow label="Поделиться" value={summary.personal.shares} />
                </View>
              </Section>
            ) : null}

            {summary.business ? (
              <Section title="Бизнес">
                <View style={styles.listCard}>
                  <MetricRow label="Сообщения клиентов" value={summary.business.messages} />
                  <MetricRow label="Маршруты" value={summary.business.routes} />
                  <MetricRow label="Звонки" value={summary.business.phoneClicks} />
                  <MetricRow label="Переходы на сайт" value={summary.business.siteClicks} />
                  <MetricRow label="Сохранения" value={summary.business.saves} />
                  <MetricRow label="Просмотры предложений" value={summary.business.offerViews} />
                  <MetricRow label="Активные предложения" value={summary.business.activeOffers} />
                </View>
              </Section>
            ) : null}

            {summary.capabilities.canViewContent ? (
              <Section title="Лучший контент">
                {content.length > 0 ? (
                  <View style={styles.listCard}>
                    {content.slice(0, 6).map((item) => (
                      <View key={`${item.type}-${item.id}`} style={styles.contentRow}>
                        <View style={styles.contentTextBlock}>
                          <Text numberOfLines={1} style={styles.contentTitle}>{contentTypeLabel(item.type)} · {item.title || 'Без названия'}</Text>
                          <Text style={styles.contentMeta}>Просмотры {item.views} · Лайки {item.likes} · Сохранения {item.saves}</Text>
                        </View>
                        <Text style={styles.scoreText}>{item.score}</Text>
                      </View>
                    ))}
                  </View>
                ) : <Text style={styles.emptyText}>Пока нет контента для метрик</Text>}
              </Section>
            ) : null}

            {summary.capabilities.canViewOffers ? (
              <Section title="Предложения">
                {offers.length > 0 ? (
                  <View style={styles.listCard}>
                    {offers.slice(0, 6).map((item) => (
                      <View key={item.id} style={styles.contentRow}>
                        <View style={styles.contentTextBlock}>
                          <Text numberOfLines={1} style={styles.contentTitle}>{item.title}</Text>
                          <Text style={styles.contentMeta}>Просмотры {item.views} · Сохранения {item.saves} · Маршруты {item.routeClicks}</Text>
                        </View>
                        <Text style={styles.scoreText}>{item.views + item.saves + item.routeClicks + item.shares}</Text>
                      </View>
                    ))}
                  </View>
                ) : <Text style={styles.emptyText}>Пока нет предложений для метрик</Text>}
              </Section>
            ) : null}

            {summary.capabilities.canViewActions ? (
              <Section title="Журнал действий">
                <View style={styles.listCard}>
                  <MetricRow label="Действия сотрудников" value={actionsCount} />
                </View>
              </Section>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

type SectionProps = { title: string; children: ReactNode };

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricRowLabel}>{label}</Text>
      <Text style={styles.metricRowValue}>{value}{suffix ? ` ${suffix}` : ''}</Text>
    </View>
  );
}

function contentTypeLabel(type: string) {
  if (type === 'post') return 'Пост';
  if (type === 'video') return 'Видео';
  if (type === 'story') return 'Близз';
  return type;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 16,
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  accountLine: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  periods: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  periodButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  periodButtonActive: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary,
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  periodTextActive: {
    color: colors.primary,
  },
  statusBlock: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    padding: 14,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 14,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 92,
    padding: 14,
    width: '47%',
  },
  metricValue: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metricRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  metricRowLabel: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  metricRowValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  contentRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contentTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  contentTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  contentMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  scoreText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
