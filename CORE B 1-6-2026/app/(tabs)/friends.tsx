import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useFriendRequests } from '../../context/FriendRequestsContext';
import { PlayerCard } from '../../components/PlayerCard';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { SuggestionsCard } from '../../components/SuggestionsCard';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Tab = 'friends' | 'requests' | 'discover';

export default function FriendsScreen() {
  const { friends, suggestions } = useFriends();
  const { currentUser } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    incoming,
    outgoing,
    pendingIncomingCount,
    sendRequest,
    acceptRequest,
    declineRequest,
    hasSentTo,
  } = useFriendRequests();
  const [tab, setTab] = useState<Tab>('friends');
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'friends', label: `Friends (${friends.length})` },
    { key: 'requests', label: 'Requests', badge: pendingIncomingCount },
    { key: 'discover', label: 'Discover' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* ── Tab bar ── */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tab,
              {
                borderBottomColor: tab === t.key ? colors.primary : 'transparent',
                borderBottomWidth: 2,
              },
            ]}
          >
            <View style={styles.tabInner}>
              <Text
                style={[
                  styles.tabText,
                  { color: tab === t.key ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t.label}
              </Text>
              {!!t.badge && t.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{t.badge}</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {/* ── Friends tab ── */}
      {tab === 'friends' && (
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
            <EmptyState
              icon="users"
              title="NO FRIENDS YET"
              subtitle="Browse the map or Discover tab to add players."
            />
          }
        />
      )}

      {/* ── Requests tab ── */}
      {tab === 'requests' && (
        <FlatList
          data={incoming}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListHeaderComponent={
            outgoing.length > 0 ? (
              <View style={styles.outgoingSection}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                  SENT ({outgoing.length})
                </Text>
                {outgoing.map((r) => (
                  <View
                    key={r.id}
                    style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Feather name="clock" size={16} color={colors.mutedForeground} />
                    <Text style={[styles.reqName, { color: colors.mutedForeground }]}>
                      Pending: {r.fromUsername}
                    </Text>
                  </View>
                ))}
                <Text
                  style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 16 }]}
                >
                  INCOMING ({incoming.length})
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <View
                style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Avatar username={item.fromUsername} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.reqName, { color: colors.foreground }]}>
                    {item.fromUsername}
                  </Text>
                  <Text style={[styles.reqSub, { color: colors.mutedForeground }]}>
                    Wants to be your friend
                  </Text>
                </View>
                <View style={styles.reqActions}>
                  <Pressable
                    onPress={() => acceptRequest(item)}
                    style={[styles.reqBtn, { backgroundColor: colors.primary }]}
                  >
                    <Feather name="check" size={16} color={colors.primaryForeground} />
                  </Pressable>
                  <Pressable
                    onPress={() => declineRequest(item)}
                    style={[styles.reqBtn, { backgroundColor: colors.secondary }]}
                  >
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="inbox"
              title="NO REQUESTS"
              subtitle="You have no incoming friend requests."
            />
          }
        />
      )}

      {/* ── Discover tab – ML suggestions ── */}
      {tab === 'discover' && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListHeaderComponent={
            <Text style={[styles.discoverHint, { color: colors.mutedForeground }]}>
              Matched by cosine similarity on game profiles &amp; proximity
            </Text>
          }
          renderItem={({ item, index }) => (
            <SuggestionsCard
              item={item}
              index={index}
              colors={colors}
              isFriend={!!currentUser?.friends?.includes(item.user.id)}
              hasSent={hasSentTo(item.user.id)}
              onAddFriend={(uid, username) => sendRequest(uid, username)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="compass"
              title="NO SUGGESTIONS YET"
              subtitle="Add games to your profile to get personalised matches."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 1 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  outgoingSection: { marginBottom: 8 },
  reqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reqName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  reqSub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  reqActions: { flexDirection: 'row', gap: 8 },
  reqBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  discoverHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
});
