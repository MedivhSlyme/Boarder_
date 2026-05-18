import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGamification } from '../../context/GamificationContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function LeaderboardScreen() {
  const { leaderboard, userBoardPoints } = useGamification();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'winrate'>('points');

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'points') return b.totalPoints - a.totalPoints;
    if (sortBy === 'wins') return b.wins - a.wins;
    return b.winRate - a.winRate;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Feather name="award" size={24} color={colors.primary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>BOARD POINTS</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Leaderboard</Text>
          </View>
        </View>
        {userBoardPoints && (
          <View style={[styles.userStatsBox, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{userBoardPoints.totalPoints}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>Your Points</Text>
          </View>
        )}
      </View>

      {/* Sort Buttons */}
      <View style={[styles.sortBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setSortBy('points')}
          style={[
            styles.sortBtn,
            sortBy === 'points' && { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.sortBtnText, { color: sortBy === 'points' ? colors.primaryForeground : colors.foreground }]}>
            Top Points
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSortBy('wins')}
          style={[
            styles.sortBtn,
            sortBy === 'wins' && { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.sortBtnText, { color: sortBy === 'wins' ? colors.primaryForeground : colors.foreground }]}>
            Most Wins
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSortBy('winrate')}
          style={[
            styles.sortBtn,
            sortBy === 'winrate' && { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.sortBtnText, { color: sortBy === 'winrate' ? colors.primaryForeground : colors.foreground }]}>
            Win Rate
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedLeaderboard}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item, index }) => {
          const isTopThree = index < 3;
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rankSection}>
                  <Text style={[styles.medal, { fontSize: isTopThree ? 24 : 14 }]}>
                    {isTopThree ? medals[index] : `#${item.rank}`}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={[styles.name, { color: colors.foreground }]}>Player #{item.userId.slice(0, 8)}</Text>
                  <View style={styles.statsRow}>
                    <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>{item.gamesPlayed}</Text> games
                    </Text>
                    <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>{item.wins}</Text>W
                    </Text>
                    <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>{item.losses}</Text>L
                    </Text>
                    <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                      {item.winRate.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.pointsSection}>
                  <Text style={[styles.points, { color: colors.primary }]}>{item.totalPoints}</Text>
                  <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>pts</Text>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="trophy" title="NO MATCHES YET" subtitle="Complete matches to earn Board Points and climb the leaderboard." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 1 },
  headerSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  userStatsBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  sortBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  sortBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', backgroundColor: 'transparent' },
  sortBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rankSection: { width: 40, alignItems: 'center', justifyContent: 'center' },
  medal: { textAlign: 'center' },
  infoSection: { flex: 1, marginLeft: 12 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  pointsSection: { alignItems: 'flex-end' },
  points: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  pointsLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
});
