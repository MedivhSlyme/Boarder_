import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';
import { Message } from '../models/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const colors = useColors();
  
  const date = new Date(message.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      <View
        style={[
          styles.bubble,
          isOwn 
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } 
            : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border }
        ]}
      >
        <Text style={[styles.text, { color: isOwn ? colors.primaryForeground : colors.foreground }]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
        {timeString}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 4,
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  timestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 4,
  },
});
