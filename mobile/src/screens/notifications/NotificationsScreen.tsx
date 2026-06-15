import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, NotificationFilter, NotificationItem, NotificationSettings } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import {
  getNotificationSettings,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationSettings,
} from '../../features/notifications/api/notificationsApi';

type NotificationsScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenPost: (postId: string) => void;
  onOpenVideo: (videoId: string) => void;
  onOpenStory: (storyId: string) => void;
  onOpenAccount: (accountId: string) => void;
  onOpenOffer: (offerId: string) => void;
  onOpenMessages: (conversationId?: string | null) => void;
};

const filters: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'messages', label: 'Сообщения' },
  { key: 'activity', label: 'Активность' },
  { key: 'business', label: 'Бизнес' },
  { key: 'system', label: 'Система' },
];

const settingRows: { key: keyof NotificationSettings; title: string; description: string }[] = [
  { key: 'inAppEnabled', title: 'Внутри приложения', description: 'Показывать уведомления в Близз' },
  { key: 'pushEnabled', title: 'Push-уведомления', description: 'Основа для Android/PWA, доставка подключается позже' },
  { key: 'directMessages', title: 'Личные сообщения', description: 'Новые личные диалоги' },
  { key: 'groupMessages', title: 'Группы', description: 'Сообщения в группах' },
  { key: 'businessMessages', title: 'Бизнес-чаты', description: 'Клиенты и сообщения бизнесу' },
  { key: 'storyReplies', title: 'Ответы на Близзы', description: 'Ответы и реакции на stories' },
  { key: 'follows', title: 'Подписки', description: 'Подписки и заявки' },
  { key: 'comments', title: 'Комментарии', description: 'Комментарии к вашим публикациям' },
  { key: 'likes', title: 'Лайки', description: 'Отметки “Нравится”' },
  { key: 'games', title: 'Игры', description: 'Приглашения и результаты' },
  { key: 'business', title: 'Бизнес-события', description: 'Витрина, предложения и клиенты' },
  { key: 'security', title: 'Безопасность', description: 'Входы, ограничения и важные действия' },
  { key: 'system', title: 'Системные', description: 'Состояние аккаунта и приложения' },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryLabel(category: string) {
  if (['directMessages', 'groupMessages', 'businessMessages', 'storyReplies'].includes(category)) return 'Сообщения';
  if (['follows', 'comments', 'likes', 'stories', 'videos', 'games'].includes(category)) return 'Активность';
  if (category === 'business') return 'Бизнес';
  if (category === 'security') return 'Безопасность';
  return 'Система';
}

export function NotificationsScreen({ auth, onBack, onOpenPost, onOpenVideo, onOpenStory, onOpenAccount, onOpenOffer, onOpenMessages }: NotificationsScreenProps) {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications(nextFilter: NotificationFilter = filter) {
    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications(auth.session.token, nextFilter);
      setItems(response.items);
      setUnreadCount(response.unreadCount);
    } catch (_error) {
      setError('Не удалось загрузить уведомления. Проверьте backend.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const response = await getNotificationSettings(auth.session.token);
      setSettings(response.settings);
    } catch (_error) {
      // Настройки не должны ломать основной список уведомлений.
    } finally {
      setSettingsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(filter);
    loadSettings();
  }, [auth.session.token, auth.activeAccount.id]);

  const groupedItems = useMemo(() => items, [items]);

  async function selectFilter(nextFilter: NotificationFilter) {
    setFilter(nextFilter);
    await loadNotifications(nextFilter);
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead(auth.session.token);
      await loadNotifications(filter);
    } catch (_error) {
      setError('Не удалось отметить уведомления прочитанными.');
    }
  }

  async function openNotification(item: NotificationItem) {
    if (!item.isRead) {
      try {
        const response = await markNotificationRead(auth.session.token, item.id);
        setUnreadCount(response.unreadCount);
        setItems((current) => current.map((candidate) => candidate.id === item.id ? response.notification : candidate));
      } catch (_error) {
        // Переход всё равно можно выполнить: уведомление уже есть на клиенте.
      }
    }

    if (item.targetType === 'post' && item.targetId) return onOpenPost(item.targetId);
    if (item.targetType === 'video' && item.targetId) return onOpenVideo(item.targetId);
    if (item.targetType === 'story' && item.targetId) return onOpenStory(item.targetId);
    if ((item.targetType === 'account' || item.targetType === 'business') && item.targetId) return onOpenAccount(item.targetId);
    if (item.targetType === 'offer' && item.targetId) return onOpenOffer(item.targetId);
    if (item.targetType === 'chat' && item.targetId) return onOpenMessages(item.targetId);
    if (item.targetType === 'game') return onOpenMessages(null);
  }

  async function toggleSetting(key: keyof NotificationSettings) {
    if (!settings || typeof settings[key] !== 'boolean') return;
    const nextValue = !settings[key];
    setSettings({ ...settings, [key]: nextValue });
    try {
      const response = await updateNotificationSettings(auth.session.token, { [key]: nextValue });
      setSettings(response.settings);
      await loadNotifications(filter);
    } catch (_error) {
      setSettings(settings);
      setError('Не удалось сохранить настройку уведомлений.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title}>Уведомления</Text>
          <Text style={styles.subtitle}>{unreadCount > 0 ? `Непрочитанных: ${unreadCount}` : 'Все уведомления прочитаны'}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={markAllRead} style={styles.readAllButton}>
          <Text style={styles.readAllText}>✓</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {filters.map((item) => {
          const active = item.key === filter;
          return (
            <Pressable accessibilityRole="button" key={item.key} onPress={() => selectFilter(item.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.statusBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Загружаем уведомления</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {!loading && groupedItems.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Пока нет уведомлений</Text>
            <Text style={styles.emptyText}>Здесь появятся сообщения, подписки, комментарии, Близзы, игры и системные события.</Text>
          </View>
        ) : null}

        {groupedItems.map((item) => (
          <NotificationRow key={item.id} item={item} onPress={() => openNotification(item)} />
        ))}

        <View style={styles.settingsBlock}>
          <Text style={styles.settingsTitle}>Настройки уведомлений</Text>
          <Text style={styles.settingsIntro}>Push не запрашивается при регистрации. Сейчас сохраняется backend-основа и категории внутри приложения.</Text>
          {settingsLoading ? <Text style={styles.statusText}>Загружаем настройки...</Text> : null}
          {settings ? settingRows.map((row) => (
            <Pressable accessibilityRole="button" key={String(row.key)} onPress={() => toggleSetting(row.key)} style={styles.settingRow}>
              <View style={styles.settingTextBlock}>
                <Text style={styles.settingTitle}>{row.title}</Text>
                <Text style={styles.settingDescription}>{row.description}</Text>
              </View>
              <Text style={[styles.settingValue, settings[row.key] === true && styles.settingValueActive]}>{settings[row.key] === true ? 'Вкл.' : 'Выкл.'}</Text>
            </Pressable>
          )) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.notificationRow, !item.isRead && styles.notificationRowUnread]}>
      <View style={[styles.notificationDot, item.isRead && styles.notificationDotRead]} />
      <View style={styles.notificationTextBlock}>
        <View style={styles.notificationTopRow}>
          <Text style={styles.notificationCategory}>{categoryLabel(String(item.category))}</Text>
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        {item.body ? <Text numberOfLines={2} style={styles.notificationBody}>{item.body}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  headerTitleBlock: {
    flex: 1,
    paddingHorizontal: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  readAllButton: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  readAllText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  filtersRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  statusBlock: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyBlock: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  notificationRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  notificationRowUnread: {
    borderColor: colors.primary,
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    marginRight: 12,
    width: 10,
  },
  notificationDotRead: {
    backgroundColor: colors.border,
  },
  notificationTextBlock: {
    flex: 1,
  },
  notificationTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  notificationCategory: {
    color: colors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  notificationTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  notificationTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  notificationBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 26,
    marginLeft: 10,
  },
  settingsBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    paddingTop: 16,
  },
  settingsTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  settingsIntro: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  settingRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  settingTextBlock: {
    flex: 1,
  },
  settingTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  settingDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  settingValue: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 12,
  },
  settingValueActive: {
    color: colors.primary,
  },
});
