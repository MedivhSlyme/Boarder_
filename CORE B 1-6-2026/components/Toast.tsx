import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
  duration?: number;
}

const ICON_MAP: Record<ToastType, 'check-circle' | 'alert-circle' | 'info'> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

export function Toast({ visible, message, type = 'info', onHide, duration = 2500 }: ToastProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  const iconColor = type === 'success' ? colors.primary : type === 'error' ? colors.destructive : colors.accent;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 100, backgroundColor: colors.card, borderColor: colors.border, opacity },
      ]}
    >
      <View style={styles.inner}>
        <Feather name={ICON_MAP[type]} size={18} color={iconColor} />
        <Text style={[styles.text, { color: colors.foreground }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 999,
    elevation: 10,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { fontFamily: 'Inter_500Medium', fontSize: 14, flex: 1 },
});
