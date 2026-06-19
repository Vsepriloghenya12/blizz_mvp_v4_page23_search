import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
import Svg, { Circle, Path } from 'react-native-svg';
import { ApiError } from '../../../shared/api/client';
import type { AuthResponse } from '../../../shared/api/types';
import { colors, spacing } from '../../../shared/ui/theme';
import { login as loginRequest, register as registerRequest } from '../api/authApi';

function EyeOpenIcon() {
  return (
    <Svg height={20} viewBox="0 0 24 24" width={20}>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" fill="none" stroke={colors.textSecondary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Circle cx={12} cy={12} fill="none" r={3} stroke={colors.textSecondary} strokeWidth={1.8} />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg height={20} viewBox="0 0 24 24" width={20}>
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" fill="none" stroke={colors.textSecondary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" fill="none" stroke={colors.textSecondary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Circle cx={12} cy={12} fill="none" r={3} stroke={colors.textSecondary} strokeWidth={1.8} />
      <Path d="M3 3l18 18" fill="none" stroke={colors.textSecondary} strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

type AuthMode = 'register' | 'login';
type AuthScreenProps = { onAuthSuccess: (auth: AuthResponse) => void };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const heroImage = require('../../../../assets/auth-hero.png');

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegisterMode = mode === 'register';

  async function submit() {
    const trimmedLogin = login.trim();
    if (!trimmedLogin) { setError('Введите телефон или email'); return; }
    if (!password) { setError('Введите пароль'); return; }
    if (password.length < 6) { setError('Пароль должен быть не короче 6 символов'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const response = isRegisterMode
        ? await registerRequest(trimmedLogin, password)
        : await loginRequest(trimmedLogin, password);
      onAuthSuccess(response);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(m => m === 'register' ? 'login' : 'register');
    setError(null);
  }

  const form = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.kav}
    >
      <View style={styles.formArea}>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => mode !== 'register' && switchMode()}
            style={[styles.tab, mode === 'register' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              Регистрация
            </Text>
          </Pressable>
          <Pressable
            onPress={() => mode !== 'login' && switchMode()}
            style={[styles.tab, mode === 'login' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Войти
            </Text>
          </Pressable>
        </View>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setLogin}
          placeholder="Телефон или email"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={login}
        />

        <View style={styles.passwordRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="Пароль"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
            secureTextEntry={!passwordVisible}
            style={[styles.input, styles.inputPassword]}
            value={password}
          />
          <Pressable
            hitSlop={12}
            onPress={() => setPasswordVisible(v => !v)}
            style={styles.eyeBtn}
          >
            {passwordVisible ? <EyeOpenIcon /> : <EyeOffIcon />}
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={submitting}
          onPress={submit}
          style={[styles.cta, submitting && styles.ctaDisabled]}
        >
          {submitting
            ? <ActivityIndicator color={colors.surface} />
            : <Text style={styles.ctaText}>{isRegisterMode ? 'Создать аккаунт' : 'Войти'}</Text>
          }
        </Pressable>

        <Text style={styles.legal}>
          Регистрируясь, вы соглашаетесь с{' '}
          <Text style={styles.legalLink}>пользовательским соглашением</Text>
        </Text>

      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.root}>
      <ImageBackground
        resizeMode="stretch"
        source={heroImage}
        style={styles.hero}
      />
      <SafeAreaView style={styles.overlay}>
        {form}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SW,
    height: SH,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  formArea: {
    paddingHorizontal: spacing.screenX + 4,
    paddingTop: spacing.block,
    paddingBottom: 36,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.block,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.screenX,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: spacing.row,
  },
  passwordRow: {
    position: 'relative',
  },
  inputPassword: {
    paddingRight: 52,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.screenX,
    top: 0,
    bottom: spacing.row,
    justifyContent: 'center',
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.row,
    lineHeight: 18,
  },

  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  legal: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
