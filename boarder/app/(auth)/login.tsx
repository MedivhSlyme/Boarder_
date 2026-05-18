import React, { useState } from 'react';
import { View, Text, Image, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { KeyboardAwareScrollViewCompat } from '../../components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        paddingTop: insets.top + 60,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 24,
      }}
      bottomOffset={20}
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.primary }]}>BOARDER</Text>
        
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Board Games :: Social Network</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>COMMS LINK</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="email@domain"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>AUTHORIZATION</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <PrimaryButton
          title={loading ? 'AUTHENTICATING...' : 'SYSTEM LOGIN'}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
          style={styles.button}
        />

        <PrimaryButton
          title="REGISTER NEW AGENT"
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
  header: { alignItems: 'center', marginBottom: 60 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 48, letterSpacing: 4, marginBottom: 8 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 2 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1 },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  button: { marginTop: 12 },
  registerButton: { marginTop: 8 },
  logo: {
  width: "100%",
  maxWidth: 400,
  height: 200
  }
});
