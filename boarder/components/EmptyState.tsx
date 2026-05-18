import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
