import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColors } from '../hooks/useColors';
import { Avatar } from './Avatar';
import { Game } from '../models/types';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PlayerCardProps {
  id: string;
  username: string;
  profilePic?: string;
  games: Game[];
  distanceKm?: number;
  onPress: () => void;
  index?: number;
}

export function PlayerCard({ username, profilePic, games, distanceKm, onPress, index = 0 }: PlayerCardProps) {
  const colors = useColors();
  const topGame = games[0];

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={onPress}
      >
        <Avatar username={username} profilePic={profilePic} size={48} />

        <View style={styles.content}>
          <Text style={[styles.username, { color: colors.foreground }]}>{username}</Text>
          {topGame ? (
            <Text style={[styles.game, { color: colors.primary }]}>
              {topGame.name}
              <Text style={{ color: colors.mutedForeground }}> · {topGame.skill}</Text>
            </Text>
          ) : (
            <Text style={[styles.game, { color: colors.mutedForeground }]}>No games listed</Text>
          )}
        </View>

        {distanceKm !== undefined && (
          <Text style={[styles.distance, { color: colors.mutedForeground }]}>
            {distanceKm.toFixed(1)} km
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  game: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  distance: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
