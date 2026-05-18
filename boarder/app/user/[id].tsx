import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GameRow } from '../../components/GameRow';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Toast, useToast } from '../../components/Toast';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const {
    friends,
    allUsers,
    nearbyPlayers,
    sentRequests,
    receivedRequests,
    blockedUserIds,
    sendFriendRequest,
    acceptFriendRequest,
    denyFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    getFriendStatus,
  } = useFriends();
  const { toastState, show, hide } = useToast();

  const [confirmUnfriend, setConfirmUnfriend] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState(false);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 16;

  if (id === currentUser?.id) {
    setTimeout(() => router.replace('/(tabs)/profile'), 0);
    return null;
  }

  const user = allUsers.find((u) => u.id === id) || nearbyPlayers.find((p) => p.id === id);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Player not found</Text>
      </View>
    );
  }

  const status = getFriendStatus(id);
  const isBlocked = blockedUserIds.includes(id);
  const isFriend = status === 'friend';
  const nearby = nearbyPlayers.find((p) => p.id === id);
  const profilePic = 'profile_details' in user ? (user as any).profile_details?.profile_pic : '';
  const bio = 'profile_details' in user ? (user as any).profile_details?.bio : '';
  const availability = 'profile_details' in user ? (user as any).profile_details?.availability : '';
  const games = user.games ?? [];

  const pendingRequest = receivedRequests.find((r) => r.fromId === id);

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      await sendFriendRequest(id);
      show('Friend request sent!', 'success');
    } catch {
      show('Failed to send request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!pendingRequest) return;
    setLoading(true);
    try {
      await acceptFriendRequest(pendingRequest.id);
      show('Friend added!', 'success');
    } catch {
      show('Failed to accept', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!pendingRequest) return;
    setLoading(true);
    try {
      await denyFriendRequest(pendingRequest.id);
      show('Request declined', 'info');
    } catch {
      show('Failed to decline', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async () => {
    setLoading(true);
    try {
      await removeFriend(id);
      show('Removed from friends', 'info');
    } catch {
      show('Failed to unfriend', 'error');
    } finally {
      setLoading(false);
      setConfirmUnfriend(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      await blockUser(id);
      show('User blocked', 'info');
      router.back();
    } catch {
      show('Failed to block user', 'error');
    } finally {
      setLoading(false);
      setConfirmBlock(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      await unblockUser(id);
      show('User unblocked', 'success');
    } catch {
      show('Failed to unblock', 'error');
    } finally {
      setLoading(false);
      setConfirmUnblock(false);
    }
  };

  const renderFriendButton = () => {
    if (isBlocked) return null;

    if (status === 'friend') {
      return (
        <PrimaryButton
          title="FRIENDS ✓"
          icon="user-check"
          onPress={() => setConfirmUnfriend(true)}
          variant="secondary"
          style={{ flex: 1, marginRight: 8 }}
          disabled={loading}
        />
      );
    }

    if (status === 'sent') {
      return (
        <PrimaryButton
          title="REQUEST SENT"
          icon="clock"
          onPress={() => {}}
          variant="secondary"
          disabled
          style={{ flex: 1, marginRight: 8 }}
        />
      );
    }

    if (status === 'received') {
      return (
        <View style={{ flex: 1, marginRight: 8, gap: 8 }}>
          <PrimaryButton title="ACCEPT" icon="user-check" onPress={handleAccept} disabled={loading} />
          <PrimaryButton title="DECLINE" icon="x" onPress={handleDeny} variant="secondary" disabled={loading} />
        </View>
      );
    }

    return (
      <PrimaryButton
        title="ADD FRIEND"
        icon="user-plus"
        onPress={handleSendRequest}
        style={{ flex: 1, marginRight: 8 }}
        disabled={loading}
      />
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: insets.bottom + 40, paddingHorizontal: 24 }}
    >
      <PrimaryButton icon="chevron-left" onPress={() => router.back()} variant="secondary" style={styles.backBtn} />

      <View style={styles.header}>
        <Avatar username={user.username} profilePic={profilePic} size={100} />
        <Text style={[styles.username, { color: colors.foreground }]}>{user.username}</Text>

        {'active' in user && (
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: (user as any).active ? colors.primary : colors.mutedForeground }]} />
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
              {(user as any).active ? 'Online now' : 'Offline'}
            </Text>
          </View>
        )}

        {nearby && (
          <Text style={[styles.distance, { color: colors.primary }]}>
            {nearby.distanceKm.toFixed(1)} km away
          </Text>
        )}

        {bio ? <Text style={[styles.bio, { color: colors.textDim }]}>{bio}</Text> : null}

        {availability ? (
          <View style={[styles.availRow, { borderColor: colors.border }]}>
            <Feather name="clock" size={12} color={colors.accent} />
            <Text style={[styles.avail, { color: colors.accent }]}>{availability}</Text>
          </View>
        ) : null}
      </View>

      {isBlocked ? (
        <View style={styles.blockedBanner}>
          <Text style={[styles.blockedText, { color: colors.mutedForeground }]}>You have blocked this user.</Text>
          <PrimaryButton
            title="UNBLOCK"
            icon="unlock"
            onPress={() => setConfirmUnblock(true)}
            variant="secondary"
            style={{ marginTop: 12 }}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          {renderFriendButton()}
          <PrimaryButton
            title="MESSAGE"
            icon="message-square"
            onPress={() => router.push(`/chat/${id}`)}
            variant="secondary"
            style={{ flex: 1, marginLeft: status === 'received' ? 0 : 8 }}
            disabled={!isFriend}
          />
        </View>
      )}

      {!isBlocked && (
        <PrimaryButton
          title="BLOCK USER"
          icon="slash"
          onPress={() => setConfirmBlock(true)}
          variant="destructive"
          style={{ marginBottom: 20 }}
        />
      )}

      {games.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAMES</Text>
          {games.map((g, i) => <GameRow key={i} game={g} />)}
        </View>
      )}

      <ConfirmDialog
        visible={confirmUnfriend}
        title="Unfriend"
        message={`Remove ${user.username} from your friends? You'll no longer be able to chat.`}
        confirmLabel="Unfriend"
        onConfirm={handleUnfriend}
        onCancel={() => setConfirmUnfriend(false)}
      />

      <ConfirmDialog
        visible={confirmBlock}
        title="Block User"
        message={`Block ${user.username}? They won't be able to send you messages or friend requests.`}
        confirmLabel="Block"
        onConfirm={handleBlock}
        onCancel={() => setConfirmBlock(false)}
      />

      <ConfirmDialog
        visible={confirmUnblock}
        title="Unblock User"
        message={`Unblock ${user.username}? They'll be able to send you friend requests again.`}
        confirmLabel="Unblock"
        confirmVariant="primary"
        onConfirm={handleUnblock}
        onCancel={() => setConfirmUnblock(false)}
      />

      <Toast message={toastState.message} visible={toastState.visible} type={toastState.type} onHide={hide} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 48, marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  username: { fontFamily: 'Inter_700Bold', fontSize: 26, marginTop: 14, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  distance: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 10, letterSpacing: 0.5 },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  avail: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  actions: { flexDirection: 'row', marginBottom: 12 },
  blockedBanner: { alignItems: 'center', paddingVertical: 16, marginBottom: 20 },
  blockedText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 2, marginBottom: 10 },
});
