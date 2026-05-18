import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '../hooks/useColors';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

interface PrimaryButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function PrimaryButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon,
  style, 
  textStyle,
  disabled 
}: PrimaryButtonProps) {
  const colors = useColors();

  const getBgColor = () => {
    if (disabled) return colors.muted;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'destructive': return colors.destructive;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.mutedForeground;
    switch (variant) {
      case 'primary': return colors.primaryForeground;
      case 'secondary': return colors.secondaryForeground;
      case 'destructive': return colors.destructiveForeground;
      default: return colors.primaryForeground;
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBgColor() },
        pressed && !disabled && { opacity: 0.8 },
        !title && icon ? { width: 48, paddingHorizontal: 0 } : {},
        style,
      ]}
    >
      {icon && (
        <Feather 
          name={icon} 
          size={20} 
          color={getTextColor()} 
          style={title ? { marginRight: 8 } : {}} 
        />
      )}
      {title && (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
