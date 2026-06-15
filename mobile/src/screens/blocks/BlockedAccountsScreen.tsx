import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, BlockedAccountItem } from '../../shared/api/types';
import { getBlockedAccounts, unblockAccount } from '../../features/blocks/api/blocksApi';
import { colors } from '../../shared/ui/theme';

type BlockedAccountsScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenAccount: (accountId: string) => void;
};

export function BlockedAccountsScreen({ auth, onBack, onOpenAccount }: BlockedAccountsScreenProps) {
  const [items, setItems] = useState<BlockedAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await getBlockedAccounts(auth.session.token);
      setItems(response.items);
    } catch (_requestError) {
      setError('Не удалось загрузить заблокированные аккаунты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [auth.session.token, auth.activeAccount.id]);

  async function removeBlock(accountId: string) {
    setWorkingId(accountId);
    setNotice(null);
    try {
      await unblockAccount(auth.session.token, accountId);
      setItems((current) => current.filter((item) => item.blockedAccountId !== accountId));
      setNotice('Аккаунт разблокирован');
    } catch (_requestError) {
      setNotice('Не удалось разблокировать аккаунт');
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
        <Text style={styles.title}>Заблокированные</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Аккаунты, которые вы заблокировали</Text>
          <Text style={styles.infoText}>Они не смогут писать вам, подписываться, комментировать ваши публикации и приглашать вас в группы или игры.</Text>
        </View>

        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Загружаем список</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Заблокированных аккаунтов нет</Text>
            <Text style={styles.emptyText}>Сюда попадут аккаунты, которые вы заблокируете из профиля, комментариев или чата.</Text>
          </View>
        ) : null}

        {items.map((item) => {
          const account = item.blockedAccount;
          const busy = workingId === item.blockedAccountId;
          return (
            <View key={item.id} style={styles.row}>
              <Pressable accessibilityRole="button" onPress={() => onOpenAccount(account.id)} style={styles.accountBlock}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{account.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.accountTextBlock}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountUsername}>@{account.username}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => removeBlock(account.id)} style={styles.unblockButton}>
                <Text style={styles.unblockText}>{busy ? '...' : 'Разблокировать'}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 16 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backText: { color: colors.textPrimary, fontSize: 28, fontWeight: '600' },
  title: { color: colors.textPrimary, flex: 1, fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 40 },
  content: { padding: 16, paddingBottom: 32 },
  infoBlock: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 16 },
  infoTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  infoText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 18 },
  statusText: { color: colors.textSecondary, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 14, marginTop: 12 },
  noticeText: { backgroundColor: colors.softBlue, borderRadius: 14, color: colors.primary, fontSize: 13, marginTop: 12, padding: 12 },
  emptyBlock: { alignItems: 'center', padding: 28 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  row: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginTop: 12, padding: 12 },
  accountBlock: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  avatar: { alignItems: 'center', backgroundColor: colors.softBlue, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  accountTextBlock: { flex: 1, paddingHorizontal: 12 },
  accountName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  accountUsername: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  unblockButton: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 },
  unblockText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
});
