import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuthAccount, AuthResponse } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { switchAccount } from '../../features/accounts/api/accountsApi';
import { BackButton } from '../../shared/ui/BackButton';

type AccountSwitcherScreenProps = {
  auth: AuthResponse;
  onAuthUpdate: (auth: AuthResponse) => void;
  onBack: () => void;
  onCreateBusiness: () => void;
};

export function AccountSwitcherScreen({ auth, onAuthUpdate, onBack, onCreateBusiness }: AccountSwitcherScreenProps) {
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSwitch(account: AuthAccount) {
    if (account.id === auth.activeAccount.id || switchingAccountId) {
      return;
    }

    setSwitchingAccountId(account.id);
    setError(null);

    try {
      const response = await switchAccount(auth.session.token, account.id);
      onAuthUpdate(response);
      onBack();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось переключить аккаунт';
      setError(message);
    } finally {
      setSwitchingAccountId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>Аккаунты</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.sheet}>
        {auth.accounts.map((account) => {
          const active = account.id === auth.activeAccount.id;
          const switching = switchingAccountId === account.id;
          return (
            <Pressable accessibilityRole="button" key={account.id} onPress={() => handleSwitch(account)} style={styles.accountRow}>
              <View style={[styles.avatar, account.type === 'business' && styles.businessAvatar]}>
                <Text style={styles.avatarText}>{account.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.accountTextBlock}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountMeta}>@{account.username} · {account.type === 'business' ? 'бизнес' : 'личный'}</Text>
              </View>
              {switching ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={styles.activeMark}>{active ? '✓' : '›'}</Text>}
            </Pressable>
          );
        })}

        <Pressable accessibilityRole="button" onPress={onCreateBusiness} style={styles.createRow}>
          <Text style={styles.createTitle}>+ Создать бизнес-аккаунт</Text>
          <Text style={styles.createText}>Добавить отдельный профиль бизнеса, не заменяя личный аккаунт.</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.note}>Переключение меняет activeAccountId текущей сессии. Все действия дальше выполняются от выбранного аккаунта.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: 16
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  headerSpacer: {
    width: 38
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden'
  },
  accountRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 74,
    paddingHorizontal: 14
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44
  },
  businessAvatar: {
    borderColor: colors.primary,
    borderWidth: 1
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800'
  },
  accountTextBlock: {
    flex: 1
  },
  accountName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  accountMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3
  },
  activeMark: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 10
  },
  createRow: {
    paddingHorizontal: 14,
    paddingVertical: 15
  },
  createTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  createText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16
  }
});
