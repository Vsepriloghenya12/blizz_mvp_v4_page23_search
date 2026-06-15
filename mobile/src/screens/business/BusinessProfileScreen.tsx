import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, OfferItem, PostItem, Profile, VideoItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getMyProfile, getProfileFromAuth } from '../../features/profile/api/profileApi';
import { getMyPosts } from '../../features/posts/api/postsApi';
import { getMyVideos } from '../../features/videos/api/videosApi';
import { getMyOffers } from '../../features/offers/api/offersApi';

type BusinessProfileScreenProps = {
  auth: AuthResponse;
  onOpenAccountSwitcher: () => void;
  onOpenMessages: () => void;
  onOpenMenu: () => void;
  onOpenOffer: (offerId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenVideo: (videoId: string) => void;
  onCreateOffer: () => void;
  onOpenMetrics: () => void;
  onOpenDashboard: () => void;
};



type BusinessPostCardProps = {
  item: PostItem;
  onOpen: (postId: string) => void;
};

function BusinessPostCard({ item, onOpen }: BusinessPostCardProps) {
  const location = item.location?.title || item.location?.address || '';
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.postCard}>
      <View style={styles.postCardTop}>
        <Text style={styles.postStatus}>Пост</Text>
        <Text style={styles.postMeta}>{item.media.length} фото</Text>
      </View>
      {item.media[0]?.url ? <Image resizeMode="cover" source={{ uri: item.media[0].url }} style={styles.postPreviewImage} /> : null}
      {item.text ? <Text style={styles.postText}>{item.text}</Text> : <Text style={styles.postMuted}>Без текста</Text>}
      {location ? <Text style={styles.postLocation}>Геометка: {location}</Text> : null}
    </Pressable>
  );
}

type BusinessVideoCardProps = {
  item: VideoItem;
  onOpen: (videoId: string) => void;
};

function BusinessVideoCard({ item, onOpen }: BusinessVideoCardProps) {
  const location = item.location?.title || item.location?.address || '';
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.postCard}>
      <View style={styles.postCardTop}>
        <Text style={styles.postStatus}>Видео</Text>
        <Text style={styles.postMeta}>9:16</Text>
      </View>
      {item.description ? <Text style={styles.postText}>{item.description}</Text> : <Text style={styles.postMuted}>Без описания</Text>}
      <Text numberOfLines={1} style={styles.postMediaUrl}>Видео: {item.videoUrl}</Text>
      <Text numberOfLines={1} style={styles.postMediaUrl}>Обложка: {item.coverUrl}</Text>
      <Text style={styles.postLocation}>Звук: {item.soundTitle || 'Оригинальный звук'}</Text>
      {location ? <Text style={styles.postLocation}>Геометка: {location}</Text> : null}
    </Pressable>
  );
}


type BusinessOfferCardProps = {
  item: OfferItem;
  onOpen: (offerId: string) => void;
};

function formatOfferDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function BusinessOfferCard({ item, onOpen }: BusinessOfferCardProps) {
  const expires = formatOfferDate(item.expiresAt);
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.postCard}>
      <View style={styles.postCardTop}>
        <Text style={styles.postStatus}>{item.typeLabel}</Text>
        <Text style={styles.postMeta}>{item.isSavedByMe ? 'Сохранено' : 'Витрина'}</Text>
      </View>
      {item.coverUrl ? <Image resizeMode="cover" source={{ uri: item.coverUrl }} style={styles.postPreviewImage} /> : null}
      <Text style={styles.postText}>{item.title}</Text>
      {item.priceOrCondition ? <Text style={styles.postLocation}>{item.priceOrCondition}</Text> : null}
      {expires ? <Text style={styles.postLocation}>Активно до: {expires}</Text> : null}
    </Pressable>
  );
}

export function BusinessProfileScreen({ auth, onOpenAccountSwitcher, onOpenMessages, onOpenMenu, onOpenOffer, onOpenPost, onOpenVideo, onCreateOffer, onOpenMetrics, onOpenDashboard }: BusinessProfileScreenProps) {
  const [profile, setProfile] = useState<Profile>(() => getProfileFromAuth(auth));
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'showcase'>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const [profileResponse, postsResponse, videosResponse, offersResponse] = await Promise.all([
          getMyProfile(auth.session.token),
          getMyPosts(auth.session.token),
          getMyVideos(auth.session.token),
          getMyOffers(auth.session.token)
        ]);
        if (mounted) {
          setProfile(profileResponse.profile);
          setPosts(postsResponse.posts);
          setVideos(videosResponse.videos);
          setOffers(offersResponse.offers);
        }
      } catch (_requestError) {
        if (mounted) {
          setProfile(getProfileFromAuth(auth));
          setError('Не удалось обновить бизнес-профиль. Показаны данные сессии.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [auth.activeAccount.id, auth.session.token]);

  const business = profile.businessProfile;
  const publicationCount = profile.stats.posts + profile.stats.videos;

  const emptyText = useMemo(() => {
    if (activeTab === 'showcase') return 'Пока нет предложений';
    if (activeTab === 'videos') return 'Пока нет видео';
    return 'Пока нет публикаций';
  }, [activeTab]);

  function showPlannedAction(message: string) {
    setNotice(message);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleBlock}>
          <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.accountSwitcher}>
            <Text numberOfLines={1} style={styles.accountName}>{profile.name} ▼</Text>
          </Pressable>
          <Text style={styles.username}>@{profile.username}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Бизнес-сообщения" accessibilityRole="button" onPress={onOpenMessages} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✉</Text>
          </Pressable>
          <Pressable accessibilityLabel="Управление бизнес-профилем" accessibilityRole="button" onPress={onOpenMenu} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>☰</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.socialStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats.followers}</Text>
            <Text style={styles.statLabel}>Подписчики</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{publicationCount}</Text>
            <Text style={styles.statLabel}>Публикации</Text>
          </View>
        </View>
      </View>

      <View style={styles.businessInfo}>
        <Text style={styles.category}>{business?.category || 'Категория не указана'}</Text>
        {business?.description ? <Text style={styles.description}>{business.description}</Text> : <Text style={styles.descriptionMuted}>Описание бизнеса пока не заполнено.</Text>}
        {business?.address ? <Text style={styles.meta}>Адрес: {business.address}</Text> : null}
        {business?.phone ? <Text style={styles.meta}>Телефон: {business.phone}</Text> : null}
        {business?.website ? <Text style={styles.meta}>Сайт: {business.website}</Text> : null}
      </View>

      <View style={styles.ownerActions}>
        <ActionButton onPress={() => showPlannedAction('Редактирование бизнес-профиля будет отдельным экраном.')} title="Редактировать" />
        <ActionButton onPress={onCreateOffer} title="Добавить предложение" />
        <ActionButton onPress={onOpenMetrics} title="Метрики" />
        <ActionButton onPress={onOpenDashboard} title="Управление" />
      </View>

      {loading ? (
        <View style={styles.loadingLine}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Обновляем бизнес-профиль</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

      <View style={styles.tabs}>
        <TabButton active={activeTab === 'posts'} label={`Посты ${profile.stats.posts}`} onPress={() => setActiveTab('posts')} />
        <TabButton active={activeTab === 'videos'} label={`Видео ${profile.stats.videos}`} onPress={() => setActiveTab('videos')} />
        <TabButton active={activeTab === 'showcase'} label={`Витрина ${offers.length}`} onPress={() => setActiveTab('showcase')} />
      </View>

      {(activeTab === 'posts' && posts.length > 0) || (activeTab === 'videos' && videos.length > 0) || (activeTab === 'showcase' && offers.length > 0) ? (
        <View style={styles.itemsList}>
          {activeTab === 'posts' ? posts.map((item) => (
            <BusinessPostCard item={item} key={item.id} onOpen={onOpenPost} />
          )) : null}
          {activeTab === 'videos' ? videos.map((item) => (
            <BusinessVideoCard item={item} key={item.id} onOpen={onOpenVideo} />
          )) : null}
          {activeTab === 'showcase' ? offers.map((item) => (
            <BusinessOfferCard item={item} key={item.id} onOpen={onOpenOffer} />
          )) : null}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}
    </ScrollView>
  );
}

type ActionButtonProps = { title: string; onPress?: () => void };

function ActionButton({ title, onPress }: ActionButtonProps) {
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.ownerActionButton}>
        <Text style={styles.ownerActionText}>{title}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.ownerActionButton}>
      <Text style={styles.ownerActionText}>{title}</Text>
    </View>
  );
}

type TabButtonProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function TabButton({ active, label, onPress }: TabButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerTitleBlock: {
    flex: 1,
    paddingRight: 12
  },
  accountSwitcher: {
    alignSelf: 'flex-start'
  },
  accountName: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800'
  },
  username: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  headerButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  headerButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700'
  },
  profileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 24
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderColor: colors.border,
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: 88
  },
  avatarText: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800'
  },
  socialStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 18
  },
  statItem: {
    alignItems: 'center',
    minWidth: 86
  },
  statNumber: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800'
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2
  },
  businessInfo: {
    marginTop: 18
  },
  category: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800'
  },
  description: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6
  },
  descriptionMuted: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5
  },
  ownerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16
  },
  ownerActionButton: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  ownerActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  loadingLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12
  },
  noticeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 12
  },
  tabs: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginTop: 24
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  tabActive: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  tabTextActive: {
    color: colors.primary
  },
  itemsList: {
    gap: 10,
    marginTop: 16
  },
  postCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14
  },
  postCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  postStatus: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800'
  },
  postMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  postText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8
  },
  postMuted: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8
  },
  postMediaUrl: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8
  },
  postPreviewImage: {
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    height: 160,
    marginTop: 10,
    width: '100%'
  },
  postLocation: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6
  },
  emptyBlock: {
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center'
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600'
  }
});
