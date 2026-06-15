import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';

type ProfileMenuScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onCreateBusiness: () => void;
  onEditProfile: () => void;
  onOpenMessages: () => void;
  onOpenAccountSwitcher: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenMetrics: () => void;
  onOpenBusinessDashboard: () => void;
  onOpenReports: () => void;
  onLogout: () => void;
};

export function ProfileMenuScreen({ auth, onBack, onCreateBusiness, onEditProfile, onOpenMessages, onOpenAccountSwitcher, onOpenSaved, onOpenSettings, onOpenNotifications, onOpenMetrics, onOpenBusinessDashboard, onOpenReports, onLogout }: ProfileMenuScreenProps) {
  const isPersonal = auth.activeAccount.type === 'personal';
  const title = auth.activeAccount.type === 'business' ? 'Управление бизнес-профилем' : 'Управление профилем';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.accountBlock}>
        <Text style={styles.accountName}>{auth.activeAccount.name}</Text>
        <Text style={styles.username}>@{auth.activeAccount.username} · {auth.activeAccount.type === 'business' ? 'бизнес' : 'личный аккаунт'}</Text>
      </View>

      <View style={styles.list}>
        <MenuRow title="Настройки и действия" description="Аккаунт, приватность, карта, сообщения, бизнес и безопасность" onPress={onOpenSettings} />
        <MenuRow title="Уведомления" description="Сообщения, подписки, комментарии, Близзы, игры и бизнес" onPress={onOpenNotifications} />
        {auth.activeAccount.type === 'business' ? <MenuRow title="Управление бизнесом" description="Обзор, метрики, витрина, сообщения, жалобы и сотрудники" onPress={onOpenBusinessDashboard} /> : null}
        <MenuRow title="Метрики" description={auth.activeAccount.type === 'business' ? 'Просмотры, сообщения, маршруты и витрина' : 'Охват, вовлечённость и лучший контент'} onPress={onOpenMetrics} />
        <MenuRow title="Мои жалобы" description="Отправленные жалобы и статус модерации" onPress={onOpenReports} />
        <MenuRow title="Переключить аккаунт" description="Личный аккаунт и бизнес-аккаунты" onPress={onOpenAccountSwitcher} />
        {isPersonal ? <MenuRow title="Редактировать профиль" description="Имя, никнейм, описание, город и ссылка" onPress={onEditProfile} /> : null}
        {isPersonal ? <MenuRow title="Создать бизнес" description="Добавить отдельный бизнес-аккаунт" onPress={onCreateBusiness} /> : null}
        <MenuRow title="Личные сообщения" description="Личные диалоги, группы и будущие ответы на Близзы" onPress={onOpenMessages} />
        <MenuRow title="Хочу сходить" description="Сохранённые посты, видео, предложения и бизнесы" onPress={onOpenSaved} />
        <MenuRow title="Выйти" danger description="Сбросить текущую сессию на этом устройстве" onPress={onLogout} />
      </View>
    </View>
  );
}

type MenuRowProps = {
  title: string;
  description: string;
  danger?: boolean;
  onPress: () => void;
};

function MenuRow({ title, description, danger, onPress }: MenuRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuTextBlock}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
  backButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700'
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
  accountBlock: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    padding: 14
  },
  accountName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  username: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 3
  },
  list: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    overflow: 'hidden'
  },
  menuRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: 14
  },
  menuTextBlock: {
    flex: 1
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  menuTitleDanger: {
    color: colors.danger
  },
  menuDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 26,
    marginLeft: 10
  },
  futureText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16
  }
});
