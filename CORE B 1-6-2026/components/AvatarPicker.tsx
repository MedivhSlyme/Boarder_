import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { AVATAR_MAP } from '../models/types';

interface AvatarPickerProps {
  selected: string;
  onSelect: (key: string) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  const colors = useColors();

  // Safely grab keys from local app asset dictionary maps
  const avatarKeys = AVATAR_MAP ? Object.keys(AVATAR_MAP) : [];

  return (
    <View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>CHOOSE AVATAR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {avatarKeys.map((key) => {
          const isActive = selected === key;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={[
                styles.cell,
                {
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 3 : 1,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Image source={AVATAR_MAP[key]} style={styles.img} />
              
              {/* Using a explicit ternary blocks the ts(2322) type-leak condition safely */}
              {isActive ? (
                <View style={[styles.check, { backgroundColor: colors.primary }]}>
                  <Feather name="check" size={9} color={colors.primaryForeground} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  row: { gap: 10, paddingVertical: 4 },
  cell: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%' },
  check: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});