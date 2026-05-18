import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { PlayerCard } from '../../components/PlayerCard';
import { EmptyState } from '../../components/EmptyState';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Toast, useToast } from '../../components/Toast';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Tab = 'friends' | 'requests';

export default function FriendsScreen() {
  const { friends, receivedRequests, sentRequests, allUsers, acceptFriendRequest, denyFriendRequest } = useFriends();
  const { currentUser } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const { toastState, show, hide } = useToast();

  const pendingCount = receivedRequests.length;

  const handleAccept = async (reqId: string) => {
    try {
      await acceptFriendRequest(reqId);
      show('Friend added!', 'success');
    } catch {
      show('Failed to accept request', 'error');
    }
  };

  const handleDeny = async (reqId: string) => {
    try {
      await denyFriendRequest(reqId);
      show('Request declined', 'info');
    } catch {
      show('Failed to decline request', 'error');
    }
  };

  const renderRequest = ({ item, index }: { item: typeof receivedRequests[0]; index: number }) => {
    const user = allUsers.find((u) => u.id === item.fromId);
    if (!user) return null;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.reqLeft} onPress={() => router.push(`/user/${user.id}`)}>
            <Avatar username={user.username} profilePic={user.profile_details?.profile_pic} size={46} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.reqName, { color: colors.foreground }]}>{user.username}</Text>
              <Text style={[styles.reqSub, { color: colors.mutedForeground }]}>Wants to be your friend</Text>
            </View>
          </Pressable>
          <View style={styles.reqActions}>
            <PrimaryButton
              title="Accept"
              onPress={() => handleAccept(item.id)}
              style={styles.acceptBtn}
            />
            <PrimaryButton
              title="Deny"
              onPress={() => handleDeny(item.id)}
              variant="secondary"
              style={styles.denyBtn}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSentRequest = ({ item, index }: { item: typeof sentRequests[0]; index: number }) => {
    const user = allUsers.find((u) => u.id === item.toId);
    if (!user) return null;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Pressable
          style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/user/${user.id}`)}
        >
          <Avatar username={user.username} profilePic={user.profile_details?.profile_pic} size={46} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.reqName, { color: colors.foreground }]}>{user.username}</Text>
            <Text style={[styles.reqSub, { color: colors.accent }]}>Request pending...</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, activeTab === 'friends' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.primary : colors.mutedForeground }]}>
            FRIENDS
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'requests' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.tabInner}>
            <Text style={[styles.tabText, { color: activeTab === 'requests' ? colors.primary : colors.mutedForeground }]}>
              REQUESTS
            </Text>
            {pendingCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {activeTab === 'friends' ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item, index }) => (
            <PlayerCard
              id={item.id}
              username={item.username}
              profilePic={item.profile_details?.profile_pic}
              games={item.games ?? []}
              onPress={() => router.push(`/user/${item.id}`)}
              index={index}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="users" title="NO FRIENDS YET" subtitle="Browse the map, find players and send them a friend request." />
          }
        />
      ) : (
        <FlatList
          data={[...receivedRequests, ...sentRequests]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item, index }) => {
            if (item.toId === currentUser?.id) {
              return renderRequest({ item, index });
            }
            return renderSentRequest({ item, index });
          }}
          ListHeaderComponent={
            receivedRequests.length > 0 && sentRequests.length > 0 ? (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INCOMING</Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="user-plus"
              title="NO REQUESTS"
              subtitle="Send friend requests from a player's profile page."
            />
          }
        />
      )}

      <Toast
        message={toastState.message}
        visible={toastState.visible}
        type={toastState.type}
        onHide={hide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  reqCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  reqLeft: { flexDirection: 'row', alignItems: 'center' },
  reqName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  reqSub: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  reqActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, height: 40 },
  denyBtn: { flex: 1, height: 40 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
});
