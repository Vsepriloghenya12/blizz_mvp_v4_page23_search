import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, NotificationFilter, NotificationItem, NotificationSettings } from '../../shared/api/types';
import { BlizzIcon } from '../../shared/ui/BlizzIcon';
import { colors } from '../../shared/ui/theme';
import { BackButton } from '../../shared/ui/BackButton';
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
  { key: 'likes', title: 'Лайки', description: 'Отметки "Нравится"' },
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
      setError('Не удалось загрузить уведомления.');
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
      // не ломаем список
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
        setItems((current) => current.map((c) => c.id === item.id ? response.notification : c));
      } catch (_error) {
        // продолжаем
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
      setError('Не удалось сохранить настройку.');
    }
  }

  return (
    <View style={styles.container}>

      {/* Header + Filters */}
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.filtersRow}>
          {filters.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable accessibilityRole="button" key={item.key} onPress={() => selectFilter(item.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {unreadCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={markAllRead} style={styles.readAllButton}>
            <Text style={styles.readAllText}>✓</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView showsVerticalScrollIndicator={false}>

        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Загружаем уведомления</Text>
          </View>
        ) : null}

        {!loading && groupedItems.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Пока нет уведомлений</Text>
            <Text style={styles.emptyText}>Здесь появятся сообщения, подписки, комментарии и системные события.</Text>
          </View>
        ) : null}

        {!loading ? groupedItems.map((item, index) => (
          <NotificationRow
            key={item.id}
            item={item}
            isLast={index === groupedItems.length - 1}
            onPress={() => openNotification(item)}
          />
        )) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

function NotificationRow({ item, isLast, onPress }: { item: NotificationItem; isLast: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.notifRow, !isLast && styles.notifRowBorder]}>
      <View style={[styles.unreadDot, item.isRead && styles.unreadDotRead]} />
      <View style={styles.notifBody}>
        <View style={styles.notifTopRow}>
          <Text style={styles.notifCategory}>{categoryLabel(String(item.category))}</Text>
          <Text style={styles.notifTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.notifTitle}>{item.title}</Text>
        {item.body ? <Text numberOfLines={2} style={styles.notifBodyText}>{item.body}</Text> : null}
      </View>
      <BlizzIcon color={colors.border} name="chevronLeft" size={16} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },

  // Header + Filters
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filtersRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 2,
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: colors.softBlue,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  readAllButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    flexShrink: 0,
  },
  readAllText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },

  errorText: {
    color: colors.danger,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  statusBlock: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  emptyBlock: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },

  // Notification row (flat, no card)
  notifRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notifRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  unreadDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    flexShrink: 0,
    height: 8,
    width: 8,
  },
  unreadDotRead: {
    backgroundColor: 'transparent',
  },
  notifBody: {
    flex: 1,
    gap: 2,
  },
  notifTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  notifCategory: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  notifTime: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 'auto',
  },
  notifTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  notifBodyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  // Settings (flat list)
  settingsSection: {
    marginTop: 8,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  settingsSectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  settingRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  settingTextBlock: {
    flex: 1,
  },
  settingTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '700',
    marginLeft: 12,
  },
  settingValueActive: {
    color: colors.primary,
  },

  bottomPad: {
    height: 40,
  },
});
