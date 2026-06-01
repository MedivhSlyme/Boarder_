import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useColors } from '../hooks/useColors';
import { AVATAR_MAP } from '../models/types';

const AVATAR_COLORS = [
  '#e05c5c', '#3fb8af', '#e8a838', '#9b5de5', '#2a9d8f', '#f4a261',
];

function getInitialsColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AvatarProps {
  username: string;
  profilePic?: string;
  size?: number;
}

export function Avatar({ username, profilePic, size = 48 }: AvatarProps) {
  const colors = useColors();
  const initials = username.substring(0, 2).toUpperCase();
  const bgColor = getInitialsColor(username);

  if (profilePic) {
    const localSource = AVATAR_MAP[profilePic];
    return (
      <Image
        source={localSource ?? { uri: profilePic }}
        style={[
          styles.base,
          { width: size, height: size, borderRadius: size / 2, borderColor: colors.border },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38, color: '#fff' }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { fontFamily: 'Inter_700Bold' },
});
