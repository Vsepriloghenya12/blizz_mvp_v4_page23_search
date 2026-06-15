import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse } from '../shared/api/types';
import { colors } from '../shared/ui/theme';
import { getSessionToken, saveSessionToken, clearSessionToken } from '../shared/lib/sessionStorage';
import { me as meRequest, logout as logoutRequest } from '../features/auth/api/authApi';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { MainTabs } from '../navigation/MainTabs';

type AppStatus = 'checkingSession' | 'guest' | 'authenticated';

export function AppRoot() {
  const [status, setStatus] = useState<AppStatus>('checkingSession');
  const [auth, setAuth] = useState<AuthResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const token = await getSessionToken();
      if (!token) {
        if (mounted) setStatus('guest');
        return;
      }

      try {
        const response = await meRequest(token);
        if (!mounted) return;
        setAuth(response);
        setStatus('authenticated');
      } catch (_error) {
        await clearSessionToken();
        if (mounted) setStatus('guest');
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleAuthSuccess(response: AuthResponse) {
    await saveSessionToken(response.session.token);
    setAuth(response);
    setStatus('authenticated');
  }

  async function handleLogout() {
    const token = auth?.session.token;
    if (token) {
      try {
        await logoutRequest(token);
      } catch (_error) {
        // Сброс локальной сессии всё равно нужен, чтобы пользователь не застрял.
      }
    }

    await clearSessionToken();
    setAuth(null);
    setStatus('guest');
  }

  if (status === 'checkingSession') {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContent}>
          <Text style={styles.logo}>Близз</Text>
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'guest' || !auth) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webPage}>
        <View style={styles.webShell}>
          <StatusBar barStyle="dark-content" />
          <MainTabs auth={auth} onAuthUpdate={setAuth} onLogout={handleLogout} />
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <MainTabs auth={auth} onAuthUpdate={setAuth} onLogout={handleLogout} />
    </>
  );
}

const styles = StyleSheet.create({
  webPage: {
    alignItems: 'center',
    backgroundColor: '#EEF2F7',
    flex: 1,
  },
  webShell: {
    flex: 1,
    maxWidth: 430,
    overflow: 'hidden',
    width: '100%',
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  logo: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800'
  },
  loader: {
    marginTop: 18
  }
});
