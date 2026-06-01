import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Platform } from 'react-native';

interface SplashOverlayProps {
  visible: boolean;
}

export function SplashOverlay({ visible }: SplashOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: Platform.OS !== 'web', }),
        Animated.delay(900),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web', }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Image
        source={require('../assets/images/icon2.png')}
        style={styles.slogan}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    gap: 16,
  },
  slogan: {
    width: 200
  },
});
