import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AvatarPicker } from '../../components/AvatarPicker';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [avatar, setAvatar] = useState('avatar1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, updateUser } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) return;
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null);
    try {
      await register(username.trim(), email.trim(), password);
      await updateUser({ profile_details: { bio: '', availability: '', profile_pic: avatar } } as any);
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40, paddingHorizontal: 28 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topRow}>
        <PrimaryButton icon="chevron-left" onPress={() => router.back()} variant="secondary" style={styles.backBtn} />
        <Image source={require('../../assets/images/icon3.png')} style={styles.miniLogo} resizeMode="contain" />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>Join the board game community</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AvatarPicker selected={avatar} onSelect={setAvatar} />

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>USERNAME</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Your display name"
              placeholderTextColor={colors.mutedForeground} value={username} onChangeText={setUsername}
              autoCapitalize="words" autoCorrect={false} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail}
              autoCapitalize="none" keyboardType="email-address" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="At least 6 characters"
              placeholderTextColor={colors.mutedForeground} secureTextEntry={!showPass}
              value={password} onChangeText={setPassword} />
            <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground}
              style={styles.eyeIcon} onPress={() => setShowPass((v) => !v)} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM PASSWORD</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput style={[styles.input, { color: colors.foreground }]} placeholder="Re-enter password"
              placeholderTextColor={colors.mutedForeground} secureTextEntry
              value={confirmPassword} onChangeText={setConfirmPassword} />
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive }]}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={loading ? 'Creating account…' : 'CREATE ACCOUNT'}
          onPress={handleRegister}
          disabled={loading || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
          style={styles.button}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account?</Text>
        <PrimaryButton title="SIGN IN" onPress={() => router.back()} variant="secondary" style={styles.registerButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44 },
  miniLogo: { width: 44, height: 44 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 4 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 24 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  eyeIcon: { marginLeft: 8 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },
  button: { marginTop: 4 },
  footer: { alignItems: 'center', marginTop: 24, gap: 12 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  registerButton: { width: '100%' },
});
