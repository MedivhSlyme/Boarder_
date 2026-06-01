import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { SuggestedPlayer } from '../models/types';
import { Avatar } from './Avatar';

interface Props {
  item: SuggestedPlayer;
  index: number;
  colors: any;
  isFriend: boolean;
  hasSent: boolean;
  onAddFriend: (userId: string, username: string) => void;
}

/**
 * Dedicated card for ML-suggested players in the Discover tab.
 *
 * Displays:
 *  – Avatar + username
 *  – Shared games (content-based signal)
 *  – Distance (geographic signal)
 *  – Match % bar (combined ML score visualised)
 *  – Add-friend button (disabled when already friend or request sent)
 */
export function SuggestionsCard({ item, index, colors, isFriend, hasSent, onAddFriend }: Props) {
  const router = useRouter();
  const u = item.user;
  const matchPct = Math.round(item.score * 100);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Left: avatar + info */}
        <Pressable style={styles.left} onPress={() => router.push(`/user/${u.id}`)}>
          <Avatar
            username={u.username}
            profilePic={u.profile_details?.profile_pic}
            size={52}
          />
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]}>{u.username}</Text>

            {item.sharedGames.length > 0 ? (
              <Text style={[styles.shared, { color: colors.primary }]} numberOfLines={1}>
                Shared: {item.sharedGames.join(', ')}
              </Text>
            ) : (
              <Text style={[styles.shared, { color: colors.mutedForeground }]}>
                {item.distanceKm.toFixed(1)} km away
              </Text>
            )}

            {/* ML match bar */}
            <View style={styles.matchRow}>
              <View style={[styles.matchBar, { backgroundColor: colors.surfaceHigh }]}>
                <View
                  style={[
                    styles.matchFill,
                    {
                      width: `${matchPct}%` as any,
                      backgroundColor:
                        matchPct >= 70
                          ? colors.primary
                          : matchPct >= 40
                          ? colors.accent
                          : colors.mutedForeground,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.matchPct, { color: colors.primary }]}>{matchPct}% match</Text>
            </View>

            {/* Sub-signals */}
            <View style={styles.tagsRow}>
              {item.sharedGames.length > 0 && (
                <View style={[styles.tag, { backgroundColor: colors.primary + '22' }]}>
                  <Feather name="grid" size={10} color={colors.primary} />
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {item.sharedGames.length} game{item.sharedGames.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              <View style={[styles.tag, { backgroundColor: colors.accent + '22' }]}>
                <Feather name="map-pin" size={10} color={colors.accent} />
                <Text style={[styles.tagText, { color: colors.accent }]}>
                  {item.distanceKm.toFixed(1)} km
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Right: add button */}
        <Pressable
          onPress={() => !isFriend && !hasSent && onAddFriend(u.id, u.username)}
          disabled={isFriend || hasSent}
          style={[
            styles.addBtn,
            {
              backgroundColor: isFriend
                ? colors.surfaceHigh
                : hasSent
                ? colors.muted
                : colors.primary,
            },
          ]}
        >
          <Feather
            name={isFriend ? 'user-check' : hasSent ? 'clock' : 'user-plus'}
            size={16}
            color={isFriend || hasSent ? colors.mutedForeground : colors.primaryForeground}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 3 },
  shared: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 6 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  matchBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  matchFill: { height: '100%', borderRadius: 2 },
  matchPct: { fontFamily: 'Inter_600SemiBold', fontSize: 11, width: 60 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
