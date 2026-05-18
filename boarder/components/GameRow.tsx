import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { Game } from '../models/types';

const SKILL_COLOR: Record<string, string> = {
  Beginner: '#8b949e',
  Amateur: '#3fb8af',
  Intermediate: '#e8a838',
  Advanced: '#9b5de5',
  Expert: '#e05c5c',
};

interface GameRowProps {
  game: Game;
  onDelete?: () => void;
}

export function GameRow({ game, onDelete }: GameRowProps) {
  const colors = useColors();
  const skillColor = SKILL_COLOR[game.skill] ?? colors.mutedForeground;

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.left}>
        {game.favorite && (
          <Feather name="star" size={14} color={colors.accent} style={{ marginRight: 6 }} />
        )}
        <Text style={[styles.name, { color: colors.foreground }]}>{game.name}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: skillColor + '22', borderColor: skillColor }]}>
        <Text style={[styles.skill, { color: skillColor }]}>{game.skill}</Text>
      </View>
      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={8} style={{ marginLeft: 10 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  skill: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
