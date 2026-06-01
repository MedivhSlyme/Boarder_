import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useMatchRequests } from '../../context/MatchRequestContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { ScoreDialog } from '../../components/ScoreDialog';
import { EmptyState } from '../../components/EmptyState';
import Animated, { FadeInDown } from 'react-native-reanimated';

const MEDAL: Record<number, { icon: string; color: string }> = { 0: { icon: '🥇', color: '#FFD700' }, 1: { icon: '🥈', color: '#C0C0C0' }, 2: { icon: '🥉', color: '#CD7F32' } };

const WITTY_QUOTES = [
  "Liar liar pants on fire! 🔥",
  "Fool me once... 🤨",
  "Nice try, but no points for you! 🛑",
  "Are we playing the same game? 🤔"
];

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { allUsers, friends } = useFriends();
  const { currentUser } = useAuth();
  const { pendingRequests, acceptRequest, declineRequest, submitMatchRequest } = useMatchRequests();
  
  const [tab, setTab] = useState<'ranks' | 'matches'>('ranks');
  const [scoreVisible, setScoreVisible] = useState(false);
  
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const ranked = useMemo(() => [...allUsers].sort((a, b) => (b.boardPoints ?? 0) - (a.boardPoints ?? 0)).slice(0, 50), [allUsers]);
  const myRank = ranked.findIndex((u) => u.id === currentUser?.id);

  const handleDecline = async (id: string) => {
    await declineRequest(id);
    const quote = WITTY_QUOTES[Math.floor(Math.random() * WITTY_QUOTES.length)];
    if (Platform.OS === 'web') alert(`Declined: ${quote}`);
    else Alert.alert("Match Declined", quote);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={[styles.header, { paddingHorizontal: 20, paddingBottom: 14, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>RANKS</Text>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <Pressable style={[styles.tab, tab === 'ranks' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab('ranks')}>
          <Text style={[styles.tabText, { color: tab === 'ranks' ? colors.primary : colors.mutedForeground }]}>Leaderboard</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'matches' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab('matches')}>
          <Text style={[styles.tabText, { color: tab === 'matches' ? colors.primary : colors.mutedForeground }]}>
            Matches {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {tab === 'ranks' ? (
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 8 }}
          renderItem={({ item, index }) => {
            const isMe = item.id === currentUser?.id;
            return (
              <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
                <View style={[styles.row, { backgroundColor: isMe ? colors.primary + '18' : colors.card, borderColor: isMe ? colors.primary : colors.border }]}>
                  <View style={styles.rankWrap}>
                    {MEDAL[index] ? <Text style={styles.medal}>{MEDAL[index].icon}</Text> : <Text style={[styles.rank, { color: colors.mutedForeground }]}>#{index + 1}</Text>}
                  </View>
                  <Avatar username={item.username} profilePic={item.profile_details?.profile_pic} size={40} />
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: isMe ? colors.primary : colors.foreground }]}>{item.username}{isMe ? ' (you)' : ''}</Text>
                    {item.games?.[0] && <Text style={[styles.game, { color: colors.mutedForeground }]} numberOfLines={1}>{item.games[0].name}</Text>}
                  </View>
                  <View style={[styles.pointsBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}>
                    <Text style={[styles.points, { color: colors.accent }]}>{item.boardPoints ?? 0}</Text>
                    <Text style={[styles.pts, { color: colors.accent }]}>pts</Text>
                  </View>
                </View>
              </Animated.View>
            );
          }}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setScoreVisible(true)} style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>Submit a Match</Text>
          </Pressable>
          <FlatList
            data={pendingRequests}
            keyExtractor={r => r.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
            renderItem={({ item }) => (
              <View style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.reqText, { color: colors.foreground }]}>
                  <Text style={{ fontFamily: 'Inter_700Bold' }}>{item.fromName}</Text> claims they <Text style={{ fontFamily: 'Inter_700Bold', color: item.outcome === 'win' ? '#ef4444' : '#22c55e' }}>{item.outcome === 'win' ? 'beat you' : 'lost to you'}</Text> at {item.game}.
                </Text>
                <View style={styles.reqActions}>
                  <Pressable onPress={() => acceptRequest(item)} style={[styles.btn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Confirm</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDecline(item.id)} style={[styles.btn, { backgroundColor: colors.destructive + '22' }]}>
                    <Text style={[styles.btnText, { color: colors.destructive }]}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={<EmptyState icon="check-circle" title="ALL CAUGHT UP" subtitle="No pending match requests." />}
          />
        </View>
      )}

      {currentUser && (
        <ScoreDialog
          visible={scoreVisible}
          currentUser={currentUser}
          friends={friends}
          onClose={() => setScoreVisible(false)}
          onSubmit={async (opponent, outcome, game) => await submitMatchRequest(opponent.id, opponent.username, outcome, game)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, marginBottom: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8, gap: 12 },
  rankWrap: { width: 36, alignItems: 'center' },
  rank: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  medal: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  game: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  pointsBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  points: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  pts: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginVertical: 12, paddingVertical: 14, borderRadius: 12 },
  submitBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  reqCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  reqText: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22 },
  reqActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});