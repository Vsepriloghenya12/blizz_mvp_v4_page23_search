import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

function IconSwitch() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M2 7h12M10 4l4 3-4 3" stroke="#101828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18 13H6M10 10l-4 3 4 3" stroke="#101828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
import type { AuthResponse, PostItem, Profile, VideoItem } from '../../shared/api/types';
import type { BlizzIconName } from '../../shared/ui/BlizzIcon';
import { colors } from '../../shared/ui/theme';
import { BlizzIcon } from '../../shared/ui/BlizzIcon';
import { getMyProfile, getProfileFromAuth } from '../../features/profile/api/profileApi';
import { getMyDrafts, getMyPosts } from '../../features/posts/api/postsApi';
import { getMyVideos } from '../../features/videos/api/videosApi';

const SW = Dimensions.get('window').width;
const GRID_GAP = 2;
const CELL = (SW - 32 - GRID_GAP * 2) / 3;

type ProfileTab = 'posts' | 'videos' | 'drafts';

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

export function ProfileScreen({
  auth,
  onOpenMessages,
  onOpenMenu,
  onEditProfile,
  onOpenAccountSwitcher,
  onOpenFollowers,
  onOpenFollowing,
  onOpenPost,
  onOpenSaved,
  onOpenVideo,
}: ProfileScreenProps) {
  const [profile, setProfile] = useState<Profile>(() => getProfileFromAuth(auth));
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [drafts, setDrafts] = useState<PostItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, postsRes, videosRes, draftsRes] = await Promise.all([
          getMyProfile(auth.session.token),
          getMyPosts(auth.session.token),
          getMyVideos(auth.session.token),
          getMyDrafts(auth.session.token),
        ]);
        if (mounted) {
          setProfile(profileRes.profile);
          setPosts(postsRes.posts);
          setVideos(videosRes.videos);
          setDrafts(draftsRes.drafts);
        }
      } catch {
        if (mounted) {
          setProfile(getProfileFromAuth(auth));
          setError('Не удалось обновить профиль.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [auth.activeAccount.id, auth.session.token]);

  const visiblePosts = activeTab === 'posts' ? posts : activeTab === 'drafts' ? drafts : [];
  const visibleVideos = activeTab === 'videos' ? videos : [];

  const emptyText = useMemo(() => {
    if (activeTab === 'videos') return 'Нет видео';
    if (activeTab === 'drafts') return 'Нет черновиков';
    return 'Нет публикаций';
  }, [activeTab]);

  const tabs: { key: ProfileTab; icon: BlizzIconName; count: number }[] = [
    { key: 'posts', icon: 'home', count: profile.stats.posts },
    { key: 'videos', icon: 'play', count: profile.stats.videos ?? 0 },
    { key: 'drafts', icon: 'bookmark', count: drafts.length },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header row */}
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.nameText}>{profile.name}</Text>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.headerBtn}>
            <IconSwitch />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenMessages} style={styles.headerBtn}>
            <BlizzIcon name="message" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenMenu} style={styles.headerBtn}>
            <BlizzIcon name="moreHorizontal" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Avatar + stats */}
      <View style={styles.profileRow}>
        <View style={styles.avatarWrap}>
          {profile.avatar ? (
            <Image resizeMode="cover" source={{ uri: profile.avatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{profile.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <Svg width={92} height={92} style={styles.avatarRingSvg}>
            <Defs>
              <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#0B3D99" />
                <Stop offset="1" stopColor="#4F8EF7" />
              </LinearGradient>
            </Defs>
            <Circle cx={46} cy={46} r={44} fill="none" stroke="url(#ring)" strokeWidth={2.5} />
          </Svg>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Постов" value={profile.stats.posts} />
          <Pressable accessibilityRole="button" onPress={onOpenFollowers}>
            <StatItem label="Подписчики" value={profile.stats.followers} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenFollowing}>
            <StatItem label="Подписки" value={profile.stats.following} />
          </Pressable>
        </View>
      </View>

      {/* Name + bio */}
      <View style={styles.bioBlock}>
        <Text style={styles.bioName}>{profile.name}</Text>
        {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        {profile.city ? (
          <View style={styles.bioMeta}>
            <BlizzIcon name="mapPin" size={13} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.bioMetaText}>{profile.city}</Text>
          </View>
        ) : null}
        {profile.link ? (
          <Text style={styles.bioLink}>{profile.link}</Text>
        ) : null}
        {!profile.bio && !profile.city && !profile.link ? (
          <Text style={styles.bioHint}>Заполните профиль, чтобы вас было проще найти</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" onPress={onEditProfile} style={styles.editBtn}>
          <Text style={styles.editBtnText}>Редактировать</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenSaved} style={styles.savedBtn}>
          <BlizzIcon name="bookmark" size={18} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(({ key, icon, count }) => {
          const active = activeTab === key;
          return (
            <Pressable
              accessibilityRole="button"
              key={key}
              onPress={() => setActiveTab(key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <BlizzIcon
                name={icon as any}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
                strokeWidth={active ? 2.4 : 2}
              />
              {count > 0 ? (
                <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Grid */}
      {visiblePosts.length > 0 ? (
        <PostGrid posts={visiblePosts} isDraft={activeTab === 'drafts'} onOpen={activeTab === 'posts' ? onOpenPost : undefined} />
      ) : visibleVideos.length > 0 ? (
        <VideoGrid videos={visibleVideos} onOpen={onOpenVideo} />
      ) : (
        <View style={styles.emptyBlock}>
          <BlizzIcon name={tabs.find(t => t.key === activeTab)?.icon ?? 'home'} size={40} color={colors.border} strokeWidth={1.5} />
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}

    </ScrollView>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PostGrid({ posts, isDraft, onOpen }: { posts: PostItem[]; isDraft: boolean; onOpen?: (id: string) => void }) {
  const rows: PostItem[][] = [];
  for (let i = 0; i < posts.length; i += 3) rows.push(posts.slice(i, i + 3));
  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map((item) => {
            const imgUrl = item.media[0]?.url;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => onOpen?.(item.id)}
                style={styles.gridCell}
              >
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.gridImg} resizeMode="cover" />
                ) : (
                  <View style={styles.gridImgFallback}>
                    <BlizzIcon name="plus" size={24} color={colors.border} strokeWidth={1.5} />
                  </View>
                )}
                {isDraft ? (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>Черновик</Text>
                  </View>
                ) : item.media.length > 1 ? (
                  <View style={styles.multiBadge}>
                    <BlizzIcon name="share" size={12} color="#fff" strokeWidth={2} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          {row.length < 3 ? Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.gridCell} />
          )) : null}
        </View>
      ))}
    </View>
  );
}

function VideoGrid({ videos, onOpen }: { videos: VideoItem[]; onOpen: (id: string) => void }) {
  const rows: VideoItem[][] = [];
  for (let i = 0; i < videos.length; i += 3) rows.push(videos.slice(i, i + 3));
  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map((item) => (
            <Pressable accessibilityRole="button" key={item.id} onPress={() => onOpen(item.id)} style={styles.gridCell}>
              {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={styles.gridImg} resizeMode="cover" />
              ) : (
                <View style={[styles.gridImgFallback, { backgroundColor: '#071B3A' }]}>
                  <BlizzIcon name="play" size={24} color="#fff" strokeWidth={2} />
                </View>
              )}
              <View style={styles.playOverlay}>
                <BlizzIcon name="play" size={14} color="#fff" strokeWidth={2.5} />
              </View>
            </Pressable>
          ))}
          {row.length < 3 ? Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.gridCell} />
          )) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 32 },

  // Header
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  nameText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },

  // Avatar + stats
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  avatarWrap: {
    alignItems: 'center',
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  avatarImg: {
    borderRadius: 42,
    height: 84,
    width: 84,
    position: 'absolute',
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    position: 'absolute',
    width: 84,
  },
  avatarLetter: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
  },
  avatarRingSvg: { position: 'absolute', top: 0, left: 0 },

  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNum: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  // Bio
  bioBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  bioName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  bioText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  bioMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  bioMetaText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  bioLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  bioHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  editBtn: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 12,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  editBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  savedBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },

  loadingRow: { alignItems: 'center', paddingTop: 12 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 8, paddingHorizontal: 16 },

  // Tabs
  tabs: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
  },
  tabCount: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabCountActive: { color: colors.primary },

  // Grid
  grid: { paddingHorizontal: 16, paddingTop: 2 },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginTop: GRID_GAP,
  },
  gridCell: {
    borderRadius: 10,
    height: CELL,
    overflow: 'hidden',
    width: CELL,
  },
  gridImg: { height: '100%', width: '100%' },
  gridImgFallback: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    flex: 1,
    justifyContent: 'center',
  },
  draftBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
  },
  draftBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  multibadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  multiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  playOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },

  // Empty
  emptyBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
