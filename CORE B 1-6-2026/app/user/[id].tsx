import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useFriendRequests } from '../../context/FriendRequestsContext';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GameRow } from '../../components/GameRow';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { timeAgo } from '../../lib/timeAgo';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { friends, allUsers, nearbyPlayers, removeFriend } = useFriends();
  const { sendRequest, acceptRequest, declineRequest, hasSentTo, hasPendingFrom, incoming } = useFriendRequests();

  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 16;

  if (id === currentUser?.id) {
    setTimeout(() => router.replace('/(tabs)/profile'), 0);
    return null;
  }

  const user = allUsers.find((u) => u.id === id) || nearbyPlayers.find((p) => p.id === id);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>User not found</Text>
      </View>
    );
  }

  const isFriend = friends.some((f) => f.id === user.id);
  const sentRequest = hasSentTo(user.id);
  const receivedRequest = hasPendingFrom(user.id);

  const handleUnfriend = async () => {
    try {
      await removeFriend(user.id);
      setConfirmUnfriend(false);
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      const matchingRequest = incoming.find((r) => r.fromId === user.id);
      if (matchingRequest) {
        await acceptRequest(matchingRequest);
      }
    } catch (err) {
      console.error("Failed to accept friend request:", err);
    }
  };

  const handleDeclineFriendRequest = async () => {
    try {
      const matchingRequest = incoming.find((r) => r.fromId === user.id);
      if (matchingRequest) {
        await declineRequest(matchingRequest);
      }
    } catch (err) {
      console.error("Failed to decline friend request:", err);
    }
  };

  const renderActionButtons = () => {
    return (
      <View style={styles.actions}>
        {isFriend ? (
          <>
            <PrimaryButton
              title="MESSAGE"
              onPress={() => router.push(`/chat/${user.id}`)}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title="UNFRIEND"
              onPress={() => setConfirmUnfriend(true)}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </>
        ) : receivedRequest ? (
          <>
            <PrimaryButton title="ACCEPT" onPress={handleAcceptFriendRequest} style={{ flex: 1 }} />
            <PrimaryButton title="DECLINE" onPress={handleDeclineFriendRequest} variant="secondary" style={{ flex: 1 }} />
          </>
        ) : sentRequest ? (
          <PrimaryButton title="REQUEST PENDING" onPress={() => {}} variant="secondary" disabled style={{ flex: 1 }} />
        ) : (
          <PrimaryButton title="ADD FRIEND" onPress={() => sendRequest(user.id, user.username)} style={{ flex: 1 }} />
        )}
      </View>
    );
  };

  // Safe structural extraction based on your types.ts schema to satisfy TypeScript
  const active = 'active' in user ? user.active : false;
  const games = user.games || [];
  const distance = (user as any).distanceKm;
  const lastSeen = 'last_seen_on' in user ? user.last_seen_on : null;

  // Safely extract profile details elements if they exist, fallback if root-level (NearbyPlayer fallback)
  const profilePic = 'profile_details' in user ? user.profile_details?.profile_pic : (user as any).profile_pic;
  const bio = 'profile_details' in user ? user.profile_details?.bio : null;
  const availability = 'profile_details' in user ? user.profile_details?.availability : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={24} color={colors.foreground} />
      </Pressable>

      <View style={styles.header}>
        <Avatar username={user.username} profilePic={profilePic} size={100} />
        <Text style={[styles.username, { color: colors.foreground }]}>{user.username}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: active ? colors.primary : colors.mutedForeground }]} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {active ? 'Active Now' : lastSeen ? `Last seen ${timeAgo(lastSeen)}` : 'Offline'}
          </Text>
        </View>

        {'boardPoints' in user && user.boardPoints !== undefined && (
          <View style={[styles.pointsBadge, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
            <Feather name="award" size={14} color={colors.accent} />
            <Text style={[styles.pointsText, { color: colors.accent }]}>{user.boardPoints} PTS</Text>
          </View>
        )}

        {distance !== undefined && (
          <Text style={[styles.distance, { color: colors.mutedForeground }]}>
            {distance === 0 ? 'In your location' : `${distance.toFixed(1)} km away`}
          </Text>
        )}

        {bio ? (
          <Text style={[styles.bio, { color: colors.foreground }]}>{bio}</Text>
        ) : null}

        {availability ? (
          <View style={[styles.availRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.avail, { color: colors.mutedForeground }]}>{availability}</Text>
          </View>
        ) : null}
      </View>

      {renderActionButtons()}

      {games.length > 0 && (
        <View style={styles.gamesSection}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAMES</Text>
          {games.map((g, i) => <GameRow key={i} game={g} />)}
        </View>
      )}

      <ConfirmDialog
        visible={confirmUnfriend}
        title="Unfriend User"
        message={`Are you sure you want to remove ${user.username} from your friends?`}
        onConfirm={handleUnfriend}
        onCancel={() => setConfirmUnfriend(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 48, marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  username: { fontFamily: 'Inter_700Bold', fontSize: 26, marginTop: 14, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  pointsText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  distance: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 10, letterSpacing: 0.5 },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  avail: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  actions: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 28, alignItems: 'center' },
  gamesSection: { width: '100%' },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1, marginBottom: 12 },
});