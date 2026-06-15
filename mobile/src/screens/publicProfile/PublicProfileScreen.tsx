import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, FeedPostItem, FeedVideoItem, OfferItem, PublicProfileResponse } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getPublicProfile, getPublicProfilePosts, getPublicProfileVideos } from '../../features/publicProfile/api/publicProfileApi';
import { followAccount, unfollowAccount } from '../../features/follows/api/followsApi';
import { createBusinessConversation, createPersonalConversation } from '../../features/messages/api/messagesApi';
import { getBusinessOffers } from '../../features/offers/api/offersApi';
import { blockAccount, unblockAccount } from '../../features/blocks/api/blocksApi';
import { createReport } from '../../features/reports/api/reportsApi';

type PublicProfileTab = 'posts' | 'videos' | 'showcase';

type PublicProfileScreenProps = {
  auth: AuthResponse;
  accountId: string;
  onBack: () => void;
  onOpenMessages: (conversationId: string | null) => void;
  onOpenOffer: (offerId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenVideo: (videoId: string) => void;
  onOpenSelfProfile: () => void;
};

function followButtonText(state: PublicProfileResponse['followState']) {
  if (state === 'following') return 'Подписки';
  if (state === 'requested') return 'Запрошено';
  return 'Подписаться';
}

function getLocationLabel(item: FeedPostItem | FeedVideoItem) {
  return item.location?.title || item.location?.address || '';
}

function PublicPostCard({ item, onOpen }: { item: FeedPostItem; onOpen: (postId: string) => void }) {
  const firstPhoto = item.media[0]?.url || '';
  const location = getLocationLabel(item);
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.contentCard}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardType}>Пост</Text>
        {location ? <Text numberOfLines={1} style={styles.cardMeta}>⌖ {location}</Text> : null}
      </View>
      {firstPhoto ? <Image resizeMode="cover" source={{ uri: firstPhoto }} style={styles.cardImage} /> : null}
      {item.text ? <Text style={styles.cardText}>{item.text}</Text> : <Text style={styles.cardMuted}>Без текста</Text>}
      <Text style={styles.cardFooter}>♡ {item.likesCount} · Коммент. {item.commentsCount} · {item.isSavedByMe ? 'Сохранено' : 'Не сохранено'}</Text>
    </Pressable>
  );
}

function PublicVideoCard({ item, onOpen }: { item: FeedVideoItem; onOpen: (videoId: string) => void }) {
  const location = getLocationLabel(item);
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.contentCard}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardType}>Видео</Text>
        {location ? <Text numberOfLines={1} style={styles.cardMeta}>⌖ {location}</Text> : null}
      </View>
      {item.coverUrl ? <Image resizeMode="cover" source={{ uri: item.coverUrl }} style={styles.cardImage} /> : null}
      {item.description ? <Text style={styles.cardText}>{item.description}</Text> : <Text style={styles.cardMuted}>Без описания</Text>}
      <Text numberOfLines={1} style={styles.cardFooter}>Звук: {item.soundTitle || 'Оригинальный звук'}</Text>
    </Pressable>
  );
}

function OfferPreviewCard({ item, onOpen }: { item: OfferItem; onOpen: (id: string) => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.contentCard}>
      {item.coverUrl ? <Image resizeMode="cover" source={{ uri: item.coverUrl }} style={styles.cardImage} /> : null}
      <Text style={styles.cardType}>{item.typeLabel}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.priceOrCondition ? <Text style={styles.cardText}>{item.priceOrCondition}</Text> : null}
      <Text style={styles.cardFooter}>Открыть предложение ›</Text>
    </Pressable>
  );
}

export function PublicProfileScreen({ auth, accountId, onBack, onOpenMessages, onOpenOffer, onOpenPost, onOpenVideo, onOpenSelfProfile }: PublicProfileScreenProps) {
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [videos, setVideos] = useState<FeedVideoItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [tab, setTab] = useState<PublicProfileTab>('posts');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);

  async function loadProfile(options: { silent?: boolean } = {}) {
    if (!options.silent) {
      setLoading(true);
      setInfo(null);
    }
    setError(null);
    try {
      const profileResponse = await getPublicProfile(auth.session.token, accountId);
      setProfile(profileResponse);
      setTab(profileResponse.account.type === 'business' ? 'showcase' : 'posts');

      if (profileResponse.isSelf) {
        onOpenSelfProfile();
        return;
      }

      if (profileResponse.canViewContent) {
        const [postsResponse, videosResponse] = await Promise.all([
          getPublicProfilePosts(auth.session.token, accountId),
          getPublicProfileVideos(auth.session.token, accountId)
        ]);
        setPosts(postsResponse.items);
        setVideos(videosResponse.items);
        if (profileResponse.account.type === 'business') {
          const offersResponse = await getBusinessOffers(auth.session.token, accountId);
          setOffers(offersResponse.offers);
        } else {
          setOffers([]);
        }
      } else {
        setPosts([]);
        setVideos([]);
        setOffers([]);
      }
    } catch (_requestError) {
      setError('Профиль недоступен');
    } finally {
      if (!options.silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [accountId, auth.session.token, onOpenSelfProfile]);

  const account = profile?.account;
  const isBusiness = account?.type === 'business';
  const business = account?.businessProfile || null;
  const bioText = useMemo(() => {
    if (!account) return '';
    return [account.bio, account.city, account.link].filter(Boolean).join(' · ');
  }, [account]);

  async function toggleFollow() {
    if (!profile || profile.isSelf || working) return;
    setWorking(true);
    setInfo(null);
    try {
      const response = profile.followState === 'following' || profile.followState === 'requested'
        ? await unfollowAccount(auth.session.token, profile.account.id)
        : await followAccount(auth.session.token, profile.account.id);
      setProfile((current) => current ? {
        ...current,
        followState: response.followState,
        isPrivate: response.isPrivate,
        stats: { ...current.stats, followers: response.stats.followers, following: response.stats.following, requests: response.stats.requests }
      } : current);
      if (response.followState === 'requested') setInfo('Заявка на подписку отправлена');
    } catch (_requestError) {
      setInfo('Не удалось обновить подписку');
    } finally {
      setWorking(false);
    }
  }

  async function toggleBlock() {
    if (!profile || profile.isSelf || working) return;
    setWorking(true);
    setInfo(null);
    setShowSafetyMenu(false);
    try {
      if (profile.isBlocked || profile.followState === 'blocked') {
        await unblockAccount(auth.session.token, profile.account.id);
        setInfo('Аккаунт разблокирован');
      } else {
        await blockAccount(auth.session.token, profile.account.id);
        setInfo('Аккаунт заблокирован');
      }
      await loadProfile({ silent: true });
    } catch (_requestError) {
      setInfo(profile.isBlocked || profile.followState === 'blocked' ? 'Не удалось разблокировать аккаунт' : 'Не удалось заблокировать аккаунт');
    } finally {
      setWorking(false);
    }
  }

  async function reportProfile() {
    if (!profile || profile.isSelf || working) return;
    setWorking(true);
    setInfo(null);
    setShowSafetyMenu(false);
    try {
      await createReport(auth.session.token, { targetType: profile.account.type === 'business' ? 'business' : 'profile', targetId: profile.account.id, reason: 'other', comment: 'Жалоба из публичного профиля' });
      setInfo('Жалоба отправлена на проверку');
    } catch (_requestError) {
      setInfo('Не удалось отправить жалобу');
    } finally {
      setWorking(false);
    }
  }

  async function openConversation() {
    if (!profile || profile.isSelf) return;
    setWorking(true);
    setInfo(null);
    try {
      const response = profile.account.type === 'business'
        ? await createBusinessConversation(auth.session.token, profile.account.id)
        : await createPersonalConversation(auth.session.token, profile.account.id);
      onOpenMessages(response.conversation.id);
    } catch (_requestError) {
      setInfo('Не удалось открыть чат');
    } finally {
      setWorking(false);
    }
  }

  function openRoute() {
    const address = business?.address || account?.city || '';
    if (!address) return;
    Linking.openURL(`https://yandex.ru/maps/?text=${encodeURIComponent(address)}`).catch(() => setInfo('Не удалось открыть маршрут'));
  }

  function openPhone() {
    const phone = business?.phone || '';
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => setInfo('Не удалось открыть звонок'));
  }

  function openWebsite() {
    const website = business?.website || account?.link || '';
    if (!website) return;
    Linking.openURL(website).catch(() => setInfo('Не удалось открыть сайт'));
  }

  const visibleTabs: PublicProfileTab[] = isBusiness ? ['posts', 'videos', 'showcase'] : ['posts', 'videos'];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>{account ? `@${account.username}` : 'Профиль'}</Text>
        <Pressable accessibilityRole="button" onPress={() => setShowSafetyMenu((value) => !value)} style={styles.moreButton}>
          <Text style={styles.moreText}>⋯</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.statusBlock}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.statusText}>Загружаем профиль</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {info ? <Text style={styles.infoText}>{info}</Text> : null}
      {showSafetyMenu && profile && !profile.isSelf ? (
        <View style={styles.safetyMenu}>
          <Pressable accessibilityRole="button" disabled={working} onPress={reportProfile} style={styles.safetyMenuRow}>
            <Text style={styles.safetyMenuText}>Пожаловаться</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={working} onPress={toggleBlock} style={styles.safetyMenuRow}>
            <Text style={styles.safetyMenuText}>{profile.isBlocked || profile.followState === 'blocked' ? 'Разблокировать' : 'Заблокировать'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setShowSafetyMenu(false)} style={styles.safetyMenuRow}>
            <Text style={styles.safetyMenuCancel}>Отмена</Text>
          </Pressable>
        </View>
      ) : null}

      {profile && account ? (
        <>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{account.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.stats.followers}</Text>
                <Text style={styles.statLabel}>Подписчики</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isBusiness ? profile.stats.posts + profile.stats.videos : profile.stats.following}</Text>
                <Text style={styles.statLabel}>{isBusiness ? 'Публикации' : 'Подписки'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.name}>{account.name}</Text>
          <Text style={styles.username}>@{account.username}</Text>
          {business?.category ? <Text style={styles.businessCategory}>{business.category}</Text> : null}
          {business?.address ? <Text style={styles.meta}>Адрес: {business.address}</Text> : null}
          {bioText ? <Text style={styles.bio}>{bioText}</Text> : null}
          {business?.description ? <Text style={styles.bio}>{business.description}</Text> : null}

          {profile.isBlocked || profile.followState === 'blocked' ? (
            <View style={styles.blockedPanel}>
              <Text style={styles.blockedTitle}>Вы заблокировали этот аккаунт</Text>
              <Text style={styles.blockedText}>Сообщения, комментарии, подписки и приглашения между аккаунтами недоступны.</Text>
              <Pressable accessibilityRole="button" disabled={working} onPress={toggleBlock} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>{working ? '...' : 'Разблокировать'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              <Pressable accessibilityRole="button" disabled={working || profile.followState === 'self'} onPress={toggleFollow} style={[styles.primaryAction, profile.followState === 'following' && styles.secondaryAction]}>
                <Text style={[styles.primaryActionText, profile.followState === 'following' && styles.secondaryActionText]}>{working ? '...' : followButtonText(profile.followState)}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={working} onPress={openConversation} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>{isBusiness ? 'Написать' : 'Сообщение'}</Text>
              </Pressable>
            </View>
          )}

          {isBusiness ? (
            <View style={styles.businessActionsRow}>
              {business?.address ? <SmallAction title="Маршрут" onPress={openRoute} /> : null}
              {business?.phone ? <SmallAction title="Позвонить" onPress={openPhone} /> : null}
              {(business?.website || account.link) ? <SmallAction title="Сайт" onPress={openWebsite} /> : null}
            </View>
          ) : null}

          {!profile.canViewContent ? (
            <View style={styles.privateBlock}>
              <Text style={styles.privateTitle}>{profile.isBlocked || profile.followState === 'blocked' ? 'Аккаунт заблокирован' : 'Закрытый аккаунт'}</Text>
              <Text style={styles.privateText}>{profile.isBlocked || profile.followState === 'blocked' ? 'Публикации этого аккаунта скрыты, пока он заблокирован.' : profile.followState === 'requested' ? 'Заявка отправлена. После подтверждения публикации станут доступны.' : 'Подпишитесь, чтобы видеть публикации этого аккаунта.'}</Text>
            </View>
          ) : (
            <>
              <View style={styles.tabs}>
                {visibleTabs.map((item) => {
                  const active = tab === item;
                  const label = item === 'posts' ? `Посты ${profile.stats.posts}` : item === 'videos' ? `Видео ${profile.stats.videos}` : `Витрина ${profile.stats.offers}`;
                  return (
                    <Pressable accessibilityRole="button" key={item} onPress={() => setTab(item)} style={[styles.tabButton, active && styles.tabButtonActive]}>
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {tab === 'posts' && posts.length === 0 ? <Text style={styles.emptyText}>Пока нет публикаций</Text> : null}
              {tab === 'videos' && videos.length === 0 ? <Text style={styles.emptyText}>Пока нет видео</Text> : null}
              {tab === 'showcase' && offers.length === 0 ? <Text style={styles.emptyText}>Пока нет предложений</Text> : null}

              {tab === 'posts' ? posts.map((item) => <PublicPostCard item={item} key={item.id} onOpen={onOpenPost} />) : null}
              {tab === 'videos' ? videos.map((item) => <PublicVideoCard item={item} key={item.id} onOpen={onOpenVideo} />) : null}
              {tab === 'showcase' ? offers.map((item) => <OfferPreviewCard item={item} key={item.id} onOpen={onOpenOffer} />) : null}
            </>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

function SmallAction({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.smallAction}>
      <Text style={styles.smallActionText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 28, paddingHorizontal: 16, paddingTop: 14 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backText: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  title: { color: colors.textPrimary, flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  moreButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  moreText: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 18 },
  statusText: { color: colors.textSecondary, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 14, marginTop: 12 },
  infoText: { backgroundColor: colors.softBlue, borderRadius: 14, color: colors.primary, fontSize: 13, marginTop: 10, padding: 12 },
  safetyMenu: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 10, overflow: 'hidden' },
  safetyMenuRow: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
  safetyMenuText: { color: colors.danger, fontSize: 15, fontWeight: '900' },
  safetyMenuCancel: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  profileTop: { alignItems: 'center', flexDirection: 'row', marginTop: 16 },
  avatar: { alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  avatarText: { color: colors.primary, fontSize: 32, fontWeight: '900' },
  statsRow: { alignItems: 'center', flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingLeft: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 18 },
  username: { color: colors.textSecondary, fontSize: 14, marginTop: 3 },
  businessCategory: { color: colors.primary, fontSize: 13, fontWeight: '800', marginTop: 8, textTransform: 'uppercase' },
  meta: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6 },
  bio: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  blockedPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 10, marginTop: 18, padding: 16 },
  blockedTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  blockedText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  primaryAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, flex: 1, minHeight: 44, justifyContent: 'center' },
  primaryActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryAction: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center' },
  secondaryActionText: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  businessActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallAction: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flex: 1, minHeight: 40, justifyContent: 'center' },
  smallActionText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  privateBlock: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginTop: 24, padding: 22 },
  privateTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  privateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 22 },
  tabButton: { borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, paddingVertical: 12 },
  tabButtonActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: colors.primary },
  emptyText: { color: colors.textSecondary, fontSize: 15, padding: 22, textAlign: 'center' },
  contentCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginTop: 12, overflow: 'hidden', padding: 14 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardType: { color: colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardMeta: { color: colors.textSecondary, flex: 1, fontSize: 12, marginLeft: 8, textAlign: 'right' },
  cardImage: { backgroundColor: '#EEF2FF', borderRadius: 16, height: 180, marginBottom: 10, width: '100%' },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 6 },
  cardText: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  cardMuted: { color: colors.textSecondary, fontSize: 14 },
  cardFooter: { color: colors.textSecondary, fontSize: 12, marginTop: 10 }
});
