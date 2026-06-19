import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AuthResponse } from "../shared/api/types";
import { BlizzIcon, type BlizzIconName } from "../shared/ui/BlizzIcon";
import { colors } from "../shared/ui/theme";
import { BottomSignalLine } from "./BottomSignalLine";
import { HomeScreen } from "../screens/home/HomeScreen";
import { VideoFeedScreen } from "../screens/video/VideoFeedScreen";
import { MapScreen } from "../screens/map/MapScreen";
import {
  CreateActionIntroScreen,
  CreateHubScreen,
  type CreateActionType,
} from "../screens/create/CreateScreen";
import { MessagesScreen } from "../screens/messages/MessagesScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { ProfileMenuScreen } from "../screens/profile/ProfileMenuScreen";
import { AccountSwitcherScreen } from "../screens/profile/AccountSwitcherScreen";
import { CreateBusinessScreen } from "../screens/business/CreateBusinessScreen";
import { BusinessProfileScreen } from "../screens/business/BusinessProfileScreen";
import { CreatePostScreen } from "../screens/posts/CreatePostScreen";
import { PostDetailScreen } from "../screens/posts/PostDetailScreen";
import { CreateVideoScreen } from "../screens/video/CreateVideoScreen";
import { VideoDetailScreen } from "../screens/video/VideoDetailScreen";
import { CreateStoryScreen } from "../screens/stories/CreateStoryScreen";
import { StoryDetailScreen } from "../screens/stories/StoryDetailScreen";
import { CreateOfferScreen } from "../screens/offers/CreateOfferScreen";
import { OfferDetailScreen } from "../screens/offers/OfferDetailScreen";
import { SavedScreen } from "../screens/saved/SavedScreen";
import { SettingsActionsScreen } from "../screens/settings/SettingsActionsScreen";
import { FollowListScreen } from "../screens/follows/FollowListScreen";
import { FollowRequestsScreen } from "../screens/follows/FollowRequestsScreen";
import { PublicProfileScreen } from "../screens/publicProfile/PublicProfileScreen";
import { SearchScreen } from "../screens/search/SearchScreen";
import { BlockedAccountsScreen } from "../screens/blocks/BlockedAccountsScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { MetricsScreen } from "../screens/metrics/MetricsScreen";
import { BusinessOwnerDashboardScreen } from "../screens/businessDashboard/BusinessOwnerDashboardScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { createBusinessConversation } from "../features/messages/api/messagesApi";

type TabKey = "home" | "video" | "create" | "map" | "profile";
type RouteState =
  | { type: "tab"; tab: TabKey }
  | { type: "messages"; previousTab: TabKey; conversationId?: string | null }
  | { type: "editProfile" }
  | { type: "profileMenu" }
  | {
      type: "accountSwitcher";
      previous:
        | "profile"
        | "create"
        | "createPost"
        | "createVideo"
        | "createStory"
        | "createOffer";
    }
  | { type: "createActionIntro"; action: CreateActionType }
  | { type: "createPost" }
  | { type: "createVideo" }
  | { type: "createStory" }
  | { type: "createOffer" }
  | { type: "offerDetail"; offerId: string; previousTab: TabKey }
  | { type: "postDetail"; postId: string; previousTab: TabKey }
  | { type: "videoDetail"; videoId: string; previousTab: TabKey }
  | { type: "storyDetail"; storyId: string; previousTab: TabKey }
  | { type: "saved"; previousTab: TabKey }
  | { type: "settings" }
  | {
      type: "followers";
      accountId: string;
      mode: "followers" | "following";
      previous: "profile" | "settings";
    }
  | { type: "followRequests"; previous: "settings" }
  | { type: "blockedAccounts"; previous: "settings" }
  | { type: "notifications"; previousTab: TabKey | "settings" | "profileMenu" }
  | {
      type: "metrics";
      previousTab: TabKey | "settings" | "profileMenu" | "businessDashboard";
    }
  | {
      type: "businessDashboard";
      previousTab: TabKey | "settings" | "profileMenu";
    }
  | {
      type: "reports";
      previousTab: TabKey | "settings" | "profileMenu" | "businessDashboard";
    }
  | { type: "publicProfile"; accountId: string; previousTab: TabKey }
  | {
      type: "search";
      previousTab: TabKey;
      initialType?:
        | "all"
        | "people"
        | "business"
        | "places"
        | "offers"
        | "posts"
        | "videos";
    }
  | {
      type: "createBusiness";
      previous: "profileMenu" | "accountSwitcher" | "profile";
    };

type TabConfig = {
  key: TabKey;
  label: string;
  icon: BlizzIconName;
};

const tabs: TabConfig[] = [
  { key: "home", label: "Главная", icon: "home" },
  { key: "video", label: "Видео", icon: "play" },
  { key: "create", label: "Создать", icon: "plus" },
  { key: "map", label: "Карта", icon: "mapPin" },
  { key: "profile", label: "Профиль", icon: "user" },
];

type MainTabsProps = {
  auth: AuthResponse;
  onAuthUpdate: (auth: AuthResponse) => void;
  onLogout: () => void;
};

export function MainTabs({ auth, onAuthUpdate, onLogout }: MainTabsProps) {
  const [route, setRoute] = useState<RouteState>({ type: "tab", tab: "home" });
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const activeTab =
    route.type === "tab"
      ? route.tab
      : route.type === "messages"
        ? route.previousTab
        : route.type === "search"
          ? route.previousTab
          : route.type === "notifications"
            ? route.previousTab === "settings" ||
              route.previousTab === "profileMenu"
              ? "profile"
              : route.previousTab
            : route.type === "metrics"
              ? route.previousTab === "settings" ||
                route.previousTab === "profileMenu" ||
                route.previousTab === "businessDashboard"
                ? "profile"
                : route.previousTab
              : route.type === "businessDashboard"
                ? route.previousTab === "settings" ||
                  route.previousTab === "profileMenu"
                  ? "profile"
                  : route.previousTab
                : route.type === "reports"
                  ? route.previousTab === "settings" ||
                    route.previousTab === "profileMenu" ||
                    route.previousTab === "businessDashboard"
                    ? "profile"
                    : route.previousTab
                  : route.type === "saved"
                    ? route.previousTab
                    : route.type === "offerDetail"
                      ? route.previousTab
                      : route.type === "postDetail"
                        ? route.previousTab
                        : route.type === "videoDetail"
                          ? route.previousTab
                          : route.type === "storyDetail"
                            ? route.previousTab
                            : route.type === "publicProfile"
                              ? route.previousTab
                              : "profile";

  function openTab(tab: TabKey) {
    setRoute({ type: "tab", tab });
  }

  function openMessages(conversationId: unknown = null) {
    setRoute({
      type: "messages",
      previousTab: activeTab,
      conversationId:
        typeof conversationId === "string" ? conversationId : null,
    });
  }

  async function openBusinessChat(businessAccountId: string) {
    try {
      const response = await createBusinessConversation(
        auth.session.token,
        businessAccountId,
      );
      openMessages(response.conversation.id);
    } catch (_error) {
      openMessages();
    }
  }

  function closeMessages() {
    setRoute({ type: "tab", tab: activeTab });
  }

  function openEditProfile() {
    setRoute({ type: "editProfile" });
  }

  function openProfileMenu() {
    setRoute({ type: "profileMenu" });
  }

  function openAccountSwitcher(
    previous:
      | "profile"
      | "create"
      | "createPost"
      | "createVideo"
      | "createStory"
      | "createOffer" = "profile",
  ) {
    setRoute({ type: "accountSwitcher", previous });
  }

  function openCreateBusiness(
    previous: "profileMenu" | "accountSwitcher" | "profile" = "profileMenu",
  ) {
    setRoute({ type: "createBusiness", previous });
  }

  function backToProfile() {
    setRoute({ type: "tab", tab: "profile" });
  }

  function backToCreate() {
    setRoute({ type: "tab", tab: "create" });
  }

  function backFromAccountSwitcher() {
    if (route.type === "accountSwitcher" && route.previous === "create") {
      backToCreate();
      return;
    }

    if (route.type === "accountSwitcher" && route.previous === "createPost") {
      setRoute({ type: "createPost" });
      return;
    }

    if (route.type === "accountSwitcher" && route.previous === "createVideo") {
      setRoute({ type: "createVideo" });
      return;
    }

    if (route.type === "accountSwitcher" && route.previous === "createStory") {
      setRoute({ type: "createStory" });
      return;
    }

    if (route.type === "accountSwitcher" && route.previous === "createOffer") {
      setRoute({ type: "createOffer" });
      return;
    }

    backToProfile();
  }

  function openCreateActionIntro(action: CreateActionType) {
    if (action === "post") {
      setRoute({ type: "createPost" });
      return;
    }

    if (action === "video") {
      setRoute({ type: "createVideo" });
      return;
    }

    if (action === "offer") {
      setRoute({ type: "createOffer" });
      return;
    }

    setRoute({ type: "createActionIntro", action });
  }

  function backFromCreateBusiness() {
    if (
      route.type === "createBusiness" &&
      route.previous === "accountSwitcher"
    ) {
      setRoute({ type: "accountSwitcher", previous: "profile" });
      return;
    }
    if (route.type === "createBusiness" && route.previous === "profileMenu") {
      setRoute({ type: "profileMenu" });
      return;
    }
    backToProfile();
  }

  function openOfferDetail(offerId: string) {
    setRoute({ type: "offerDetail", offerId, previousTab: activeTab });
  }

  function openPostDetail(postId: string) {
    setRoute({ type: "postDetail", postId, previousTab: activeTab });
  }

  function openVideoDetail(videoId: string) {
    setRoute({ type: "videoDetail", videoId, previousTab: activeTab });
  }

  function openStoryDetail(storyId: string) {
    setRoute({ type: "storyDetail", storyId, previousTab: activeTab });
  }

  function closeOfferDetail() {
    if (route.type === "offerDetail") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "home" });
  }

  function closePostDetail() {
    if (route.type === "postDetail") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "home" });
  }

  function closeVideoDetail() {
    if (route.type === "videoDetail") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "video" });
  }

  function closeStoryDetail() {
    if (route.type === "storyDetail") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "home" });
  }

  function openSaved() {
    setRoute({ type: "saved", previousTab: activeTab });
  }

  function openSettings() {
    setRoute({ type: "settings" });
  }

  function openFollowers(
    mode: "followers" | "following",
    previous: "profile" | "settings" = "profile",
  ) {
    setRoute({
      type: "followers",
      accountId: auth.activeAccount.id,
      mode,
      previous,
    });
  }

  function openFollowRequests(previous: "settings" = "settings") {
    setRoute({ type: "followRequests", previous });
  }

  function openBlockedAccounts(previous: "settings" = "settings") {
    setRoute({ type: "blockedAccounts", previous });
  }

  function openNotifications(
    previousTab: TabKey | "settings" | "profileMenu" = activeTab,
  ) {
    setRoute({ type: "notifications", previousTab });
  }

  function openMetrics(
    previousTab:
      | TabKey
      | "settings"
      | "profileMenu"
      | "businessDashboard" = activeTab,
  ) {
    setRoute({ type: "metrics", previousTab });
  }

  function openBusinessDashboard(
    previousTab: TabKey | "settings" | "profileMenu" = activeTab,
  ) {
    setRoute({ type: "businessDashboard", previousTab });
  }

  function openReports(
    previousTab:
      | TabKey
      | "settings"
      | "profileMenu"
      | "businessDashboard" = activeTab,
  ) {
    setRoute({ type: "reports", previousTab });
  }

  function closeMetrics() {
    if (route.type === "metrics") {
      if (route.previousTab === "settings") {
        setRoute({ type: "settings" });
        return;
      }
      if (route.previousTab === "profileMenu") {
        setRoute({ type: "profileMenu" });
        return;
      }
      if (route.previousTab === "businessDashboard") {
        setRoute({ type: "businessDashboard", previousTab: "profile" });
        return;
      }
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "profile" });
  }

  function closeNotifications() {
    if (route.type === "notifications") {
      if (route.previousTab === "settings") {
        setRoute({ type: "settings" });
        return;
      }
      if (route.previousTab === "profileMenu") {
        setRoute({ type: "profileMenu" });
        return;
      }
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "home" });
  }

  function closeBusinessDashboard() {
    if (route.type === "businessDashboard") {
      if (route.previousTab === "settings") {
        setRoute({ type: "settings" });
        return;
      }
      if (route.previousTab === "profileMenu") {
        setRoute({ type: "profileMenu" });
        return;
      }
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "profile" });
  }

  function closeReports() {
    if (route.type === "reports") {
      if (route.previousTab === "settings") {
        setRoute({ type: "settings" });
        return;
      }
      if (route.previousTab === "profileMenu") {
        setRoute({ type: "profileMenu" });
        return;
      }
      if (route.previousTab === "businessDashboard") {
        setRoute({ type: "businessDashboard", previousTab: "profile" });
        return;
      }
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "profile" });
  }

  function openSearch(
    initialType:
      | "all"
      | "people"
      | "business"
      | "places"
      | "offers"
      | "posts"
      | "videos" = "all",
  ) {
    setRoute({ type: "search", previousTab: activeTab, initialType });
  }

  function closeSearch() {
    if (route.type === "search") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "home" });
  }

  function openPublicProfile(accountId: string) {
    if (accountId === auth.activeAccount.id) {
      setRoute({ type: "tab", tab: "profile" });
      return;
    }
    setRoute({ type: "publicProfile", accountId, previousTab: activeTab });
  }

  function closePublicProfile() {
    if (route.type === "publicProfile") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "home" });
  }

  function closeSaved() {
    if (route.type === "saved") {
      setRoute({ type: "tab", tab: route.previousTab });
      return;
    }
    setRoute({ type: "tab", tab: "profile" });
  }

  function renderProfileTab() {
    if (auth.activeAccount.type === "business") {
      return (
        <BusinessProfileScreen
          auth={auth}
          onOpenAccountSwitcher={() => openAccountSwitcher("profile")}
          onOpenMenu={openProfileMenu}
          onOpenMessages={openMessages}
          onOpenOffer={openOfferDetail}
          onOpenPost={openPostDetail}
          onOpenVideo={openVideoDetail}
          onCreateOffer={() => setRoute({ type: "createOffer" })}
          onOpenMetrics={() => openMetrics("profile")}
          onOpenDashboard={() => openBusinessDashboard("profile")}
        />
      );
    }

    return (
      <ProfileScreen
        auth={auth}
        onEditProfile={openEditProfile}
        onOpenAccountSwitcher={() => openAccountSwitcher("profile")}
        onOpenMenu={openProfileMenu}
        onOpenMessages={openMessages}
        onOpenFollowers={() => openFollowers("followers", "profile")}
        onOpenFollowing={() => openFollowers("following", "profile")}
        onOpenPost={openPostDetail}
        onOpenSaved={openSaved}
        onOpenVideo={openVideoDetail}
      />
    );
  }

  function renderTabScreen(tab: TabKey) {
    if (tab === "home")
      return (
        <HomeScreen
          auth={auth}
          onCreateStory={() => setRoute({ type: "createStory" })}
          onOpenMessages={openMessages}
          onOpenOffer={openOfferDetail}
          onOpenAccount={openPublicProfile}
          onOpenPost={openPostDetail}
          onOpenSearch={() => openSearch("all")}
          onOpenNotifications={() => openNotifications("home")}
        />
      );
    if (tab === "video")
      return (
        <VideoFeedScreen
          auth={auth}
          onOpenAccount={openPublicProfile}
          onOpenVideo={openVideoDetail}
        />
      );
    if (tab === "create") {
      return (
        <CreateHubScreen
          auth={auth}
          onOpenAccountSwitcher={() => openAccountSwitcher("create")}
          onOpenMessages={openMessages}
          onSelectAction={openCreateActionIntro}
        />
      );
    }
    if (tab === "map")
      return (
        <MapScreen
          auth={auth}
          onOpenOffer={openOfferDetail}
          onOpenVideo={openVideoDetail}
          onOpenPost={openPostDetail}
          onOpenStory={openStoryDetail}
          onOpenAccount={openPublicProfile}
          onOpenSearch={() => openSearch("places")}
        />
      );
    return renderProfileTab();
  }

  if (route.type === "businessDashboard") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BusinessOwnerDashboardScreen
          auth={auth}
          onBack={closeBusinessDashboard}
          onOpenMetrics={() => openMetrics("businessDashboard")}
          onOpenMessages={openMessages}
          onCreateOffer={() => setRoute({ type: "createOffer" })}
          onCreatePost={() => setRoute({ type: "createPost" })}
          onCreateVideo={() => setRoute({ type: "createVideo" })}
          onOpenOffer={openOfferDetail}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "reports") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ReportsScreen auth={auth} onBack={closeReports} />
      </SafeAreaView>
    );
  }

  if (route.type === "metrics") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MetricsScreen auth={auth} onBack={closeMetrics} />
      </SafeAreaView>
    );
  }

  if (route.type === "notifications") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <NotificationsScreen
          auth={auth}
          onBack={closeNotifications}
          onOpenAccount={openPublicProfile}
          onOpenMessages={(conversationId) =>
            setRoute({
              type: "messages",
              previousTab: activeTab,
              conversationId: conversationId || null,
            })
          }
          onOpenOffer={openOfferDetail}
          onOpenPost={openPostDetail}
          onOpenStory={openStoryDetail}
          onOpenVideo={openVideoDetail}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "search") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <SearchScreen
          auth={auth}
          initialType={route.initialType || "all"}
          onBack={closeSearch}
          onOpenAccount={openPublicProfile}
          onOpenOffer={openOfferDetail}
          onOpenPost={openPostDetail}
          onOpenMap={() => setRoute({ type: "tab", tab: "map" })}
          onOpenVideo={(videoId) =>
            videoId
              ? openVideoDetail(videoId)
              : setRoute({ type: "tab", tab: "video" })
          }
        />
      </SafeAreaView>
    );
  }

  if (route.type === "messages") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MessagesScreen
          auth={auth}
          initialConversationId={route.conversationId || null}
          onBack={closeMessages}
          onOpenPost={openPostDetail}
          onOpenStory={openStoryDetail}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "editProfile") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EditProfileScreen
          auth={auth}
          onAuthUpdate={onAuthUpdate}
          onBack={backToProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "profileMenu") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ProfileMenuScreen
          auth={auth}
          onBack={backToProfile}
          onCreateBusiness={() => openCreateBusiness("profileMenu")}
          onEditProfile={openEditProfile}
          onLogout={onLogout}
          onOpenAccountSwitcher={() => openAccountSwitcher("profile")}
          onOpenMessages={openMessages}
          onOpenSaved={openSaved}
          onOpenSettings={openSettings}
          onOpenNotifications={() => openNotifications("profileMenu")}
          onOpenMetrics={() => openMetrics("profileMenu")}
          onOpenBusinessDashboard={() => openBusinessDashboard("profileMenu")}
          onOpenReports={() => openReports("profileMenu")}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "settings") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <SettingsActionsScreen
          auth={auth}
          onBack={() => setRoute({ type: "profileMenu" })}
          onCreateBusiness={() => openCreateBusiness("profileMenu")}
          onLogout={onLogout}
          onOpenAccountSwitcher={() => openAccountSwitcher("profile")}
          onOpenSaved={openSaved}
          onOpenFollowRequests={() => openFollowRequests("settings")}
          onOpenFollowers={(mode) => openFollowers(mode, "settings")}
          onOpenBlockedAccounts={() => openBlockedAccounts("settings")}
          onOpenNotifications={() => openNotifications("settings")}
          onOpenMetrics={() => openMetrics("settings")}
          onOpenBusinessDashboard={() => openBusinessDashboard("settings")}
          onOpenReports={() => openReports("settings")}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "followers") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FollowListScreen
          auth={auth}
          accountId={route.accountId}
          mode={route.mode}
          onBack={() =>
            setRoute(
              route.previous === "settings"
                ? { type: "settings" }
                : { type: "tab", tab: "profile" },
            )
          }
          onOpenAccount={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "followRequests") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FollowRequestsScreen
          auth={auth}
          onBack={() => setRoute({ type: "settings" })}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "blockedAccounts") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BlockedAccountsScreen
          auth={auth}
          onBack={() => setRoute({ type: "settings" })}
          onOpenAccount={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "publicProfile") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PublicProfileScreen
          auth={auth}
          accountId={route.accountId}
          onBack={closePublicProfile}
          onOpenMessages={(conversationId) =>
            setRoute({
              type: "messages",
              previousTab: route.previousTab,
              conversationId,
            })
          }
          onOpenOffer={openOfferDetail}
          onOpenPost={openPostDetail}
          onOpenVideo={openVideoDetail}
          onOpenSelfProfile={() => setRoute({ type: "tab", tab: "profile" })}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "postDetail") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PostDetailScreen
          auth={auth}
          postId={route.postId}
          onBack={closePostDetail}
          onOpenAccount={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "videoDetail") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VideoDetailScreen
          auth={auth}
          videoId={route.videoId}
          onBack={closeVideoDetail}
          onOpenAccount={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "storyDetail") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StoryDetailScreen
          auth={auth}
          storyId={route.storyId}
          onBack={closeStoryDetail}
          onOpenAccount={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "accountSwitcher") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AccountSwitcherScreen
          auth={auth}
          onAuthUpdate={onAuthUpdate}
          onBack={backFromAccountSwitcher}
          onCreateBusiness={() => openCreateBusiness("accountSwitcher")}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "createActionIntro") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CreateActionIntroScreen
          auth={auth}
          action={route.action}
          onBack={backToCreate}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "createPost") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CreatePostScreen
          auth={auth}
          onBack={backToCreate}
          onDraftSaved={backToProfile}
          onOpenAccountSwitcher={() => openAccountSwitcher("createPost")}
          onPostPublished={backToProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "createVideo") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CreateVideoScreen
          auth={auth}
          onBack={backToCreate}
          onOpenAccountSwitcher={() => openAccountSwitcher("createVideo")}
          onVideoPublished={backToProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "createStory") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CreateStoryScreen
          auth={auth}
          onBack={() => setRoute({ type: "tab", tab: "home" })}
          onOpenAccountSwitcher={() => openAccountSwitcher("createStory")}
          onStoryPublished={() => setRoute({ type: "tab", tab: "home" })}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "createOffer") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CreateOfferScreen
          auth={auth}
          onBack={backToCreate}
          onOfferPublished={backToProfile}
          onOpenAccountSwitcher={() => openAccountSwitcher("createOffer")}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "saved") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <SavedScreen
          auth={auth}
          onBack={closeSaved}
          onOpenOffer={openOfferDetail}
          onOpenVideo={openVideoDetail}
          onOpenPost={openPostDetail}
          onOpenAccount={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "offerDetail") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <OfferDetailScreen
          auth={auth}
          offerId={route.offerId}
          onBack={closeOfferDetail}
          onOpenMessages={openMessages}
          onOpenBusinessChat={openBusinessChat}
          onOpenBusinessProfile={openPublicProfile}
        />
      </SafeAreaView>
    );
  }

  if (route.type === "createBusiness") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CreateBusinessScreen
          auth={auth}
          onAuthUpdate={onAuthUpdate}
          onBack={backFromCreateBusiness}
          onCreated={backToProfile}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>{renderTabScreen(route.tab)}</View>
      <View
        onLayout={(event) => setTabBarWidth(event.nativeEvent.layout.width)}
        style={styles.tabBar}
      >
        <View pointerEvents="none" style={styles.tabBarSurface} />
        <BottomSignalLine
          activeIndex={tabs.findIndex((tab) => tab.key === activeTab)}
          itemCount={tabs.length}
          reducedMotion={reducedMotion}
          width={tabBarWidth}
        />
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const isCreate = tab.key === "create";
          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={tab.key}
              onPress={() => openTab(tab.key)}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.tabIcon,
                  isCreate && styles.createIcon,
                  active && !isCreate && styles.tabIconActive,
                ]}
              >
                <BlizzIcon
                  color={isCreate ? "#FFFFFF" : active ? colors.primary : colors.textPrimary}
                  filled={active && !isCreate}
                  fillColor={active ? colors.primary : undefined}
                  name={tab.icon}
                  size={isCreate ? 27 : 24}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignSelf: "center",
    flex: 1,
    maxWidth: 430,
    width: "100%",
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    marginTop: -9,
    minHeight: 50,
    paddingBottom: 0,
    paddingHorizontal: 6,
    paddingTop: 9,
    position: "relative",
  },
  tabBarSurface: {
    backgroundColor: "#FFFFFF",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 9
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  tabIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 30,
    justifyContent: "center",
    width: 40
  },
  tabIconActive: {
    backgroundColor: "transparent"
  },
  createIcon: {
    backgroundColor: "#0B3D99",
    borderRadius: 13,
    height: 40,
    width: 40
  }
});
