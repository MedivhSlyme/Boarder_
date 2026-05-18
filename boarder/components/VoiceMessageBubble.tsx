import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';

interface VoiceMessageBubbleProps {
  audioUrl: string;
  duration: number;
  isSent: boolean;
  timestamp: number;
}

export function VoiceMessageBubble({ audioUrl, duration, isSent, timestamp }: VoiceMessageBubbleProps) {
  const colors = useColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const bgColor = isSent ? colors.primary : colors.card;
  const textColor = isSent ? colors.primaryForeground : colors.foreground;

  return (
    <View style={[styles.container, { marginLeft: isSent ? 40 : 0, marginRight: isSent ? 0 : 40 }]}>
      <Pressable
        onPress={togglePlay}
        style={[
          styles.bubble,
          { backgroundColor: bgColor, borderColor: isSent ? bgColor : colors.border },
        ]}
      >
        <Feather name={isPlaying ? 'pause-circle' : 'play-circle'} size={28} color={textColor} />
        <View style={styles.info}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${(currentTime / duration) * 100}%`, backgroundColor: textColor }]} />
          </View>
          <Text style={[styles.duration, { color: textColor }]}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </Pressable>
      <Text style={[styles.time, { color: colors.mutedForeground }]}>
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minWidth: 200,
  },
  info: { flex: 1, gap: 4 },
  progressBar: {
    height: 2,
    backgroundColor: '#ffffff30',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progress: { height: '100%' },
  duration: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
});
