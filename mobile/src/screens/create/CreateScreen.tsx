import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';

export type CreateActionType = 'post' | 'video' | 'offer';

type CreateHubScreenProps = {
  auth: AuthResponse;
  onOpenAccountSwitcher: () => void;
  onOpenMessages: () => void;
  onSelectAction: (action: CreateActionType) => void;
};

type CreateAction = {
  type: CreateActionType;
  title: string;
  description: string;
};

const BUSINESS_CREATOR_ROLES = new Set(['owner', 'admin', 'smm']);

export function CreateHubScreen({ auth, onOpenAccountSwitcher, onOpenMessages, onSelectAction }: CreateHubScreenProps) {
  const activeAccount = auth.activeAccount;
  const isBusiness = activeAccount.type === 'business';
  const businessRole = activeAccount.role || null;
  const isMessagesOnly = isBusiness && businessRole === 'messages';
  const canCreateOffer = isBusiness && businessRole !== null && BUSINESS_CREATOR_ROLES.has(businessRole);

  const actions: CreateAction[] = isMessagesOnly
    ? []
    : [
        { type: 'post', title: 'Пост', description: 'Фото, текст, геометка и видимость' },
        { type: 'video', title: 'Видео', description: 'Вертикальный формат 9:16 до 60 секунд' },
        ...(canCreateOffer ? [{ type: 'offer' as const, title: 'Предложение', description: 'Акция, товар, услуга или событие витрины' }] : [])
      ];

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Близз</Text>
      <Text style={styles.title}>Что создать?</Text>
      <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.accountButton}>
        <Text style={styles.accountLabel}>Активный аккаунт</Text>
        <Text style={styles.accountText}>{activeAccount.name} @{activeAccount.username} ▼</Text>
      </Pressable>

      {isMessagesOnly ? (
        <View style={styles.lockedBlock}>
          <Text style={styles.lockedTitle}>У вас доступ только к сообщениям</Text>
          <Text style={styles.lockedText}>Эта роль не может создавать посты, видео и предложения.</Text>
          <Pressable accessibilityRole="button" onPress={onOpenMessages} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Открыть сообщения</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {actions.map((action, index) => (
            <Pressable
              accessibilityRole="button"
              key={action.type}
              onPress={() => onSelectAction(action.type)}
              style={[styles.actionRow, index === actions.length - 1 && styles.lastActionRow]}
            >
              <View style={styles.actionDot} />
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

type CreateActionIntroScreenProps = {
  action: CreateActionType;
  auth: AuthResponse;
  onBack: () => void;
};

const ACTION_COPY: Record<CreateActionType, { title: string; text: string }> = {
  post: {
    title: 'Создание поста',
    text: 'Экран создания поста будет согласован следующим модулем: фото, текст, геометка и видимость от activeAccountId.'
  },
  video: {
    title: 'Создание видео',
    text: 'Экран создания видео будет согласован отдельным модулем: вертикальный формат, звук, описание, обложка и геометка.'
  },
  offer: {
    title: 'Создание предложения',
    text: 'Экран предложения будет согласован в модуле витрины: тип, обложка, название, срок, адрес и действия бизнеса.'
  }
};

export function CreateActionIntroScreen({ action, auth, onBack }: CreateActionIntroScreenProps) {
  const copy = ACTION_COPY[action];

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.account}>Активный аккаунт: {auth.activeAccount.name} @{auth.activeAccount.username}</Text>
      <View style={styles.introCard}>
        <Text style={styles.introText}>{copy.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 28
  },
  brand: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800'
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 26
  },
  accountButton: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  accountLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  accountText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 3
  },
  account: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  list: {
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 22,
    overflow: 'hidden'
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 14
  },
  lastActionRow: {
    borderBottomWidth: 0
  },
  actionDot: {
    backgroundColor: colors.softBlue,
    borderRadius: 12,
    height: 24,
    marginRight: 12,
    width: 24
  },
  actionTextBlock: {
    flex: 1
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  actionDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 26,
    marginLeft: 8
  },
  lockedBlock: {
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 22,
    padding: 16
  },
  lockedTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    marginTop: 16,
    minHeight: 48,
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center'
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
  },
  introCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 22,
    padding: 16
  },
  introText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22
  }
});
