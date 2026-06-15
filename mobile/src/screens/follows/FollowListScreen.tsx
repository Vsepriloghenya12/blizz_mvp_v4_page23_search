import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, FollowListItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getFollowers, getFollowing, unfollowAccount } from '../../features/follows/api/followsApi';

type FollowListScreenProps = {
  auth: AuthResponse;
  mode: 'followers' | 'following';
  accountId: string;
  onBack: () => void;
  onOpenAccount: (accountId: string) => void;
};

export function FollowListScreen({ auth, mode, accountId, onBack, onOpenAccount }: FollowListScreenProps) {
  const [items, setItems] = useState<FollowListItem[]>([]);
  const [title, setTitle] = useState(mode === 'followers' ? 'Подписчики' : 'Подписки');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'followers') {
        const response = await getFollowers(auth.session.token, accountId);
        setTitle(`Подписчики · @${response.account.username}`);
        setItems(response.followers);
      } else {
        const response = await getFollowing(auth.session.token, accountId);
        setTitle(`Подписки · @${response.account.username}`);
        setItems(response.following);
      }
    } catch (_error) {
      setError('Не удалось загрузить список. Проверьте backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [auth.session.token, accountId, mode]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => {
      return `${item.account.name} ${item.account.username}`.toLowerCase().includes(normalized);
    });
  }, [items, query]);

  async function removeFollowing(targetAccountId: string) {
    setWorkingId(targetAccountId);
    try {
      await unfollowAccount(auth.session.token, targetAccountId);
      setItems((current) => current.filter((item) => item.account.id !== targetAccountId));
    } catch (_error) {
      setError('Не удалось отменить подписку.');
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
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput placeholder="Поиск" placeholderTextColor={colors.textSecondary} value={query} onChangeText={setQuery} style={styles.searchInput} />
      </View>

      {loading ? (
        <View style={styles.statusBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Загружаем список</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.listContent}>
        {!loading && filtered.length === 0 ? <Text style={styles.emptyText}>Пока никого нет</Text> : null}
        {filtered.map((item) => (
          <Pressable accessibilityRole="button" key={item.followId} onPress={() => onOpenAccount(item.account.id)} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.account.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountName}>{item.account.name}</Text>
              <Text style={styles.username}>@{item.account.username}{item.account.isPrivate ? ' · закрытый' : ''}</Text>
            </View>
            {mode === 'following' && accountId === auth.activeAccount.id ? (
              <Pressable accessibilityRole="button" disabled={workingId === item.account.id} onPress={() => removeFollowing(item.account.id)} style={styles.actionButton}>
                <Text style={styles.actionText}>{workingId === item.account.id ? '...' : 'Убрать'}</Text>
              </Pressable>
            ) : null}
          </Pressable>
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
  title: { color: colors.textPrimary, flex: 1, fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 40 },
  searchBox: { alignItems: 'center', backgroundColor: '#F1F3F7', borderRadius: 12, flexDirection: 'row', marginHorizontal: 20, marginTop: 8, minHeight: 48, paddingHorizontal: 14 },
  searchIcon: { color: colors.textSecondary, fontSize: 22, marginRight: 8 },
  searchInput: { color: colors.textPrimary, flex: 1, fontSize: 16, minHeight: 46 },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 20 },
  statusText: { color: colors.textSecondary, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 13, marginHorizontal: 20, marginTop: 10 },
  listContent: { paddingBottom: 28, paddingTop: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 15, padding: 20, textAlign: 'center' },
  row: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 72, paddingHorizontal: 20 },
  avatar: { alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 22, height: 44, justifyContent: 'center', marginRight: 12, width: 44 },
  avatarText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  accountText: { flex: 1 },
  accountName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  username: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  actionButton: { borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  actionText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
