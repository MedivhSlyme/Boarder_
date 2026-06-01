import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ScrollView, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { auth, db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useTheme } from '../../context/ThemeContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ThemeName, THEME_META, THEMES } from '../../constants/colors';

const THEME_ORDER: ThemeName[] = [
  'base', 'coral', 'sunset', 'nightBlue', 'nemesis', 'holy', 'crimson', 'druid',
];

const APP_VERSION = '1.0.0';
const APP_DESCRIPTION =
  'Boarder connects board game enthusiasts. Find nearby players, track your matches, discover events and climb the leaderboard.';

export default function SettingsScreen() {
  const { currentUser, firebaseUser, logout } = useAuth();
  const colors = useColors();
  const { themeName, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [contactingAdmin, setContactingAdmin] = useState(false);

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const handleThemeSelect = (name: ThemeName) => {
    setTheme(name, currentUser?.id);
  };

  const handleContactAdmin = async () => {
    setContactingAdmin(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('isAdmin', '==', true), limit(1)),
      );
      if (snap.empty) {
        Alert.alert('No Admin', 'No admin account found at this time.');
        return;
      }
      router.push(`/chat/${snap.docs[0].id}`);
    } catch {
      Alert.alert('Error', 'Could not reach admin. Please try again.');
    } finally {
      setContactingAdmin(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser || !currentUser) return;
    setDeletingAccount(true);
    try {
      await deleteDoc(doc(db, 'users', firebaseUser.uid));
      await deleteUser(firebaseUser);
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'Please sign out and sign back in, then try deleting your account again.',
        );
        await logout();
        return;
      }
      Alert.alert('Error', 'Could not delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topInset,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 20,
      }}
    >
      {/* ── Header ── */}
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>SETTINGS</Text>

      {/* ── Theme ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>THEME</Text>
        <View style={styles.themeGrid}>
          {THEME_ORDER.map((name) => {
            const meta = THEME_META[name];
            const palette = THEMES[name];
            const active = themeName === name;
            return (
              <Pressable
                key={name}
                onPress={() => handleThemeSelect(name)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.themePreviewBg, { backgroundColor: palette.background }]}>
                  <View style={styles.themeSwatches}>
                    {meta.preview.map((hex, i) => (
                      <View
                        key={i}
                        style={[styles.swatch, { backgroundColor: hex, borderColor: palette.border }]}
                      />
                    ))}
                  </View>
                  {active && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={8} color={colors.primaryForeground} />
                    </View>
                  )}
                </View>
                <View style={styles.themeCardFooter}>
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: active ? colors.primary : palette.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {meta.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── About ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Feather name="info" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutApp, { color: colors.foreground }]}>Boarder</Text>
              <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
                Version {APP_VERSION}
              </Text>
            </View>
          </View>
          <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
            {APP_DESCRIPTION}
          </Text>
        </View>
      </View>

      {/* ── Contact Admin ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SUPPORT</Text>
        <Pressable
          onPress={handleContactAdmin}
          disabled={contactingAdmin}
          style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {contactingAdmin ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="mail" size={18} color={colors.primary} />
          )}
          <Text style={[styles.actionText, { color: colors.foreground }]}>Contact Admin</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* ── Danger Zone ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.destructive }]}>DANGER ZONE</Text>
        <Pressable
          onPress={() => setConfirmVisible(true)}
          style={[
            styles.actionRow,
            { backgroundColor: colors.card, borderColor: colors.destructive + '66' },
          ]}
        >
          {deletingAccount ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <Feather name="trash-2" size={18} color={colors.destructive} />
          )}
          <Text style={[styles.actionText, { color: colors.destructive }]}>Delete My Account</Text>
          <Feather name="chevron-right" size={16} color={colors.destructive} />
        </Pressable>
        <Text style={[styles.dangerHint, { color: colors.mutedForeground }]}>
          This permanently removes your profile, games and match history.
        </Text>
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Account?"
        message="This will permanently delete your account and all your data. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { setConfirmVisible(false); handleDeleteAccount(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: 1,
    marginBottom: 24,
    marginTop: 8,
  },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
  },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  themeCard: { width: '23.5%', borderRadius: 8, overflow: 'hidden' },
  themePreviewBg: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeSwatches: { flexDirection: 'row', gap: 3 },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  themeCardFooter: { paddingHorizontal: 4, paddingVertical: 6, alignItems: 'center' },
  themeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'center' },
  checkBadge: {
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', top: 3, right: 3,
  },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  aboutApp: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  aboutVersion: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  aboutDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1,
  },
  actionText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  dangerHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8 },
});
