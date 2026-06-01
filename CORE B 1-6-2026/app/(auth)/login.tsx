import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { KeyboardAwareScrollViewCompat } from '../../components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 28,
        flexGrow: 1,
        justifyContent: 'center',
      }}
      bottomOffset={20}
    >
      {/* Logo block */}
      <View style={styles.logoBlock}>
        <Image
          source={require('../../assets/images/slogan.png')}
          style={styles.slogan}
          resizeMode="contain"
        />
      </View>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Sign in to find players near you</Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <Feather
              name={showPass ? 'eye-off' : 'eye'}
              size={16}
              color={colors.mutedForeground}
              style={styles.eyeIcon}
              onPress={() => setShowPass((v) => !v)}
            />
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive }]}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={loading ? 'Signing in…' : 'SIGN IN'}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
          style={styles.button}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>New to Boarder?</Text>
        <PrimaryButton
          title="CREATE ACCOUNT"
          onPress={() => router.push('/register')}
          variant="secondary"
          style={styles.registerButton}
        />
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoBlock: { alignItems: 'center', marginBottom: 24 },
  slogan: { width: 300 },
  card: {
    borderRadius: 20, borderWidth: 1,
    padding: 24, gap: 16,
  },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  cardSub: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: -8 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  eyeIcon: { marginLeft: 8 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },
  button: { marginTop: 4 },
  footer: { alignItems: 'center', marginTop: 24, gap: 12 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  registerButton: { width: '100%' },
});
