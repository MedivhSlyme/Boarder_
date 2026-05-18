import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useColors } from '../hooks/useColors';

// This map links your database strings to the actual local files
export const AVATAR_MAP: Record<string, any> = {
  'avatar1': require('../assets/avatars/avatar1.png'),
  'avatar2': require('../assets/avatars/avatar2.png'),
  'avatar3': require('../assets/avatars/avatar3.png'),
  'avatar4': require('../assets/avatars/avatar4.png'),
  'avatar5': require('../assets/avatars/avatar5.png'),
  'avatar6': require('../assets/avatars/avatar6.png'),
  'avatar7': require('../assets/avatars/avatar7.png'),
  'avatar8': require('../assets/avatars/avatar8.png'),
  'avatar9': require('../assets/avatars/avatar9.png'),
  'avatar10': require('../assets/avatars/avatar10.png'),
  'avatar11': require('../assets/avatars/avatar11.png'),
  'avatar12': require('../assets/avatars/avatar12.png'),
};

const AVATAR_COLORS = ['#e05c5c', '#3fb8af', '#e8a838', '#9b5de5', '#2a9d8f', '#f4a261'];

function getInitialsColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AvatarProps {
  username: string;
  profilePic?: string; // This will now be keys like 'avatar1'
  size?: number;
}

export function Avatar({ username, profilePic, size = 48 }: AvatarProps) {
  const colors = useColors();
  const initials = username.substring(0, 2).toUpperCase();
  const bgColor = getInitialsColor(username);

  // Check if the profilePic string exists in our local map
  const source = profilePic ? AVATAR_MAP[profilePic] : null;

  if (source) {
    return (
      <Image
        source={source}
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.border,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38, color: '#fff' }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: 'Inter_700Bold',
  },
});