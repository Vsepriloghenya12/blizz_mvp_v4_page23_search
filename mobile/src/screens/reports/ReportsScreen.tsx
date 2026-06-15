import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, ReportItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getMyReports } from '../../features/reports/api/reportsApi';

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
  reviewing: 'На проверке',
  resolved: 'Решена',
  rejected: 'Отклонена',
};

type ReportsScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
};

export function ReportsScreen({ auth, onBack }: ReportsScreenProps) {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const response = await getMyReports(auth.session.token);
        if (mounted) setItems(response.items);
      } catch (_error) {
        if (mounted) setError('Не удалось загрузить жалобы');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadReports();
    return () => { mounted = false; };
  }, [auth.session.token, auth.activeAccount.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable>
        <Text style={styles.title}>Мои жалобы</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.helper}>Здесь видны жалобы, отправленные от имени активного аккаунта. Жалобы на ваш бизнес обрабатываются в разделе управления бизнесом.</Text>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Загружаем жалобы</Text></View> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && items.length === 0 ? <Text style={styles.emptyText}>Вы ещё не отправляли жалобы</Text> : null}
        {items.map((report) => (
          <View key={report.id} style={styles.card}>
            <Text style={styles.cardTitle}>{report.title}</Text>
            <Text style={styles.cardSubtitle}>{report.subtitle}</Text>
            <Text style={styles.meta}>Причина: {reasonLabels[report.reason] || report.reason}</Text>
            <Text style={styles.meta}>Статус: {statusLabels[report.moderationStatus] || report.moderationStatus}</Text>
            {report.comment ? <Text style={styles.comment}>{report.comment}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 16 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backText: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  title: { color: colors.textPrimary, flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  headerSpacer: { width: 40 },
  content: { padding: 16, paddingBottom: 32 },
  helper: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  loading: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  loadingText: { color: colors.textSecondary, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 16, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginBottom: 12, padding: 14 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  meta: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 7 },
  comment: { color: colors.textPrimary, fontSize: 13, lineHeight: 18, marginTop: 8 }
});
