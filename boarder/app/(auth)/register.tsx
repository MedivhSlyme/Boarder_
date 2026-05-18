import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { KeyboardAwareScrollViewCompat } from '../../components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) return;
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}
      bottomOffset={20}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>NEW PLAYER</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>CREATE YOUR PROFILE</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>USERNAME</Text>
          <TextInput style={inputStyle} placeholder="Your display name" placeholderTextColor={colors.mutedForeground}
            value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
          <TextInput style={inputStyle} placeholder="email@domain.com" placeholderTextColor={colors.mutedForeground}
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
          <TextInput style={inputStyle} placeholder="At least 6 characters" placeholderTextColor={colors.mutedForeground}
            value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM PASSWORD</Text>
          <TextInput style={inputStyle} placeholder="Re-enter password" placeholderTextColor={colors.mutedForeground}
            value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        </View>

        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

        <PrimaryButton
          title={loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          onPress={handleRegister}
          disabled={loading || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
          style={{ marginTop: 8 }}
        />
        <PrimaryButton title="BACK TO LOGIN" onPress={() => router.back()} variant="secondary" style={{ marginTop: 8 }} />
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 36 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: 2, marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 2 },
  form: { gap: 18 },
  group: { gap: 8 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1 },
  input: { height: 52, borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Inter_500Medium', fontSize: 16 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});
