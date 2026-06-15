import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, PostItem, Profile, VideoItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getMyProfile, getProfileFromAuth } from '../../features/profile/api/profileApi';
import { getMyDrafts, getMyPosts } from '../../features/posts/api/postsApi';
import { getMyVideos } from '../../features/videos/api/videosApi';

type ProfileTab = 'posts' | 'videos' | 'drafts' | 'saved';

type ProfileScreenProps = {
  auth: AuthResponse;
  onOpenMessages: () => void;
  onOpenMenu: () => void;
  onEditProfile: () => void;
  onOpenAccountSwitcher: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onOpenPost: (postId: string) => void;
  onOpenSaved: () => void;
  onOpenVideo: (videoId: string) => void;
};

const tabLabels: Record<ProfileTab, string> = {
  posts: 'Посты',
  videos: 'Видео',
  drafts: 'Черновики',
  saved: 'Сохранённое'
};



type PostPreviewCardProps = {
  item: PostItem;
  onOpen?: (postId: string) => void;
};

function PostPreviewCard({ item, onOpen }: PostPreviewCardProps) {
  const location = item.location?.title || item.location?.address || '';
  const content = (
    <>
      <View style={styles.postCardTop}>
        <Text style={styles.postStatus}>{item.status === 'draft' ? 'Черновик' : 'Пост'}</Text>
        <Text style={styles.postMeta}>{item.media.length} фото</Text>
      </View>
      {item.media[0]?.url ? <Image resizeMode="cover" source={{ uri: item.media[0].url }} style={styles.postPreviewImage} /> : null}
      {item.text ? <Text style={styles.postText}>{item.text}</Text> : <Text style={styles.postMuted}>Без текста</Text>}
      {location ? <Text style={styles.postLocation}>Геометка: {location}</Text> : null}
    </>
  );

  if (onOpen && item.status === 'published') {
    return (
      <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)} style={styles.postCard}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.postCard}>
      {content}
    </View>
  );
}

type VideoPreviewCardProps = {
  item: VideoItem;
  onOpen: (videoId: string) => void;
};

function VideoPreviewCard({ item, onOpen }: VideoPreviewCardProps) {
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

export function ProfileScreen({ auth, onOpenMessages, onOpenMenu, onEditProfile, onOpenAccountSwitcher, onOpenFollowers, onOpenFollowing, onOpenPost, onOpenSaved, onOpenVideo }: ProfileScreenProps) {
  const [profile, setProfile] = useState<Profile>(() => getProfileFromAuth(auth));
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [drafts, setDrafts] = useState<PostItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const [profileResponse, postsResponse, videosResponse, draftsResponse] = await Promise.all([
          getMyProfile(auth.session.token),
          getMyPosts(auth.session.token),
          getMyVideos(auth.session.token),
          getMyDrafts(auth.session.token)
        ]);
        if (mounted) {
          setProfile(profileResponse.profile);
          setPosts(postsResponse.posts);
          setVideos(videosResponse.videos);
          setDrafts(draftsResponse.drafts);
        }
      } catch (_requestError) {
        if (mounted) {
          setProfile(getProfileFromAuth(auth));
          setError('Не удалось обновить профиль. Показаны данные сессии.');
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

  const currentEmptyText = useMemo(() => {
    if (activeTab === 'drafts') return 'Пока нет черновиков';
    if (activeTab === 'videos') return 'Пока нет видео';
    if (activeTab === 'saved') return 'Пока нет сохранённого';
    return 'Пока нет публикаций';
  }, [activeTab]);

  const profileMeta = [profile.bio, profile.city, profile.link].filter(Boolean).join(' · ');
  const visiblePostItems = activeTab === 'posts' ? posts : activeTab === 'drafts' ? drafts : [];
  const visibleVideoItems = activeTab === 'videos' ? videos : [];

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
          <Pressable accessibilityLabel="Личные сообщения" accessibilityRole="button" onPress={onOpenMessages} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✉</Text>
          </Pressable>
          <Pressable accessibilityLabel="Управление профилем" accessibilityRole="button" onPress={onOpenMenu} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>☰</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.socialStats}>
          <Pressable accessibilityRole="button" onPress={onOpenFollowers} style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats.followers}</Text>
            <Text style={styles.statLabel}>Подписчики</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenFollowing} style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats.following}</Text>
            <Text style={styles.statLabel}>Подписки</Text>
          </Pressable>
        </View>
      </View>

      {profileMeta ? (
        <Text style={styles.profileMeta}>{profileMeta}</Text>
      ) : (
        <Text style={styles.profileHint}>Заполните профиль, чтобы вас было проще найти.</Text>
      )}

      <Pressable accessibilityRole="button" onPress={onEditProfile} style={styles.editButton}>
        <Text style={styles.editButtonText}>Редактировать профиль</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingLine}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Обновляем профиль</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.tabs}>
        {(['posts', 'videos', 'drafts', 'saved'] as ProfileTab[]).map((tab) => {
          const active = activeTab === tab;
          const count = profile.stats[tab];
          const handleTabPress = () => {
            if (tab === 'saved') {
              onOpenSaved();
              return;
            }
            setActiveTab(tab);
          };
          return (
            <Pressable accessibilityRole="button" key={tab} onPress={handleTabPress} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tabLabels[tab]} {count}</Text>
            </Pressable>
          );
        })}
      </View>

      {visiblePostItems.length > 0 || visibleVideoItems.length > 0 ? (
        <View style={styles.itemsList}>
          {visiblePostItems.map((item) => (
            <PostPreviewCard item={item} key={item.id} onOpen={activeTab === 'posts' ? onOpenPost : undefined} />
          ))}
          {visibleVideoItems.map((item) => (
            <VideoPreviewCard item={item} key={item.id} onOpen={onOpenVideo} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyText}>{currentEmptyText}</Text>
        </View>
      )}
    </ScrollView>
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
  profileMeta: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 18
  },
  profileHint: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 18
  },
  editButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    minHeight: 42,
    justifyContent: 'center'
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700'
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
    minHeight: 160,
    justifyContent: 'center'
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600'
  }
});
