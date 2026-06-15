import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, FollowRequestItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { acceptFollowRequest, declineFollowRequest, getFollowRequests } from '../../features/follows/api/followsApi';

type FollowRequestsScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
};

export function FollowRequestsScreen({ auth, onBack }: FollowRequestsScreenProps) {
  const [requests, setRequests] = useState<FollowRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await getFollowRequests(auth.session.token);
      setRequests(response.requests);
    } catch (_error) {
      setError('Не удалось загрузить заявки.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [auth.session.token, auth.activeAccount.id]);

  async function handleAccept(requestId: string) {
    setWorkingId(requestId);
    try {
      await acceptFollowRequest(auth.session.token, requestId);
      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (_error) {
      setError('Не удалось принять заявку.');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDecline(requestId: string) {
    setWorkingId(requestId);
    try {
      await declineFollowRequest(auth.session.token, requestId);
      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (_error) {
      setError('Не удалось отклонить заявку.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Заявки на подписку</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.statusBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Загружаем заявки</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {!loading && requests.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Пока нет заявок</Text>
            <Text style={styles.emptyText}>Когда закрытый аккаунт получит запрос на подписку, он появится здесь.</Text>
          </View>
        ) : null}
        {requests.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.requester.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountName}>{item.requester.name}</Text>
              <Text style={styles.username}>@{item.requester.username}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={workingId === item.id} onPress={() => handleAccept(item.id)} style={[styles.actionButton, styles.acceptButton]}>
                <Text style={styles.acceptText}>{workingId === item.id ? '...' : 'Принять'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={workingId === item.id} onPress={() => handleDecline(item.id)} style={styles.actionButton}>
                <Text style={styles.declineText}>Отклонить</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 16 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backText: { color: colors.textPrimary, fontSize: 28, fontWeight: '700' },
  title: { color: colors.textPrimary, flex: 1, fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 40 },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 20 },
  statusText: { color: colors.textSecondary, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 13, marginHorizontal: 20, marginTop: 10 },
  content: { paddingBottom: 28 },
  emptyBlock: { alignItems: 'center', padding: 28 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  row: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 86, paddingHorizontal: 18 },
  avatar: { alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 22, height: 44, justifyContent: 'center', marginRight: 12, width: 44 },
  avatarText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  accountText: { flex: 1 },
  accountName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  username: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 6 },
  actionButton: { borderColor: colors.border, borderRadius: 13, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  acceptButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  acceptText: { color: colors.surface, fontSize: 12, fontWeight: '800' },
  declineText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
});
