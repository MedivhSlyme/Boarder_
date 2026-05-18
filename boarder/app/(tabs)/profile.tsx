import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GameRow } from '../../components/GameRow';

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  if (!currentUser) return null;

  const { profile_details, games } = currentUser;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: insets.bottom + 100, paddingHorizontal: 24 }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/edit-profile')} style={styles.avatarWrap}>
          <Avatar username={currentUser.username} profilePic={profile_details?.profile_pic} size={96} />
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={12} color="#fff" />
          </View>
        </Pressable>
        <Text style={[styles.username, { color: colors.foreground }]}>{currentUser.username}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{currentUser.email}</Text>
        {profile_details?.bio ? (
          <Text style={[styles.bio, { color: colors.textDim }]}>{profile_details.bio}</Text>
        ) : null}
        {profile_details?.availability ? (
          <View style={[styles.availRow, { borderColor: colors.border }]}>
            <Feather name="clock" size={12} color={colors.primary} />
            <Text style={[styles.avail, { color: colors.primary }]}>{profile_details.availability}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAMES</Text>
        {games && games.length > 0 ? (
          games.map((g, i) => <GameRow key={i} game={g} />)
        ) : (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No games added yet. Edit your profile to add some.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LOCATION</Text>
        <View style={[styles.locCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.locText, { color: colors.primary }]}>
            {currentUser.location.lat.toFixed(4)}, {currentUser.location.lng.toFixed(4)}
          </Text>
          <View style={[styles.activeDot, { backgroundColor: currentUser.active ? colors.primary : colors.mutedForeground }]} />
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="EDIT PROFILE" icon="edit-2" onPress={() => router.push('/edit-profile')} variant="secondary" />
        <PrimaryButton title="SIGN OUT" icon="log-out" onPress={logout} variant="destructive" style={{ marginTop: 10 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  username: { fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 4 },
  email: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 8 },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  avail: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, fontStyle: 'italic' },
  locCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1 },
  locText: { fontFamily: 'Inter_500Medium', fontSize: 14, fontVariant: ['tabular-nums'] },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  actions: { marginTop: 8 },
});
