import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { useColors } from '../hooks/useColors';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}

export function Toast({ message, visible, type = 'info', onHide }: ToastProps) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor =
    type === 'success' ? colors.primary :
    type === 'error' ? colors.destructive :
    colors.surfaceHigh;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, opacity },
        Platform.OS === 'web' ? styles.webPos : styles.nativePos,
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const [toastState, setToastState] = React.useState<{
    message: string;
    visible: boolean;
    type: 'success' | 'error' | 'info';
  }>({ message: '', visible: false, type: 'info' });

  const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastState({ message, visible: true, type });
  };

  const hide = () => setToastState((s) => ({ ...s, visible: false }));

  return { toastState, show, hide };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  webPos: { bottom: 100 },
  nativePos: { bottom: 100 },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});
