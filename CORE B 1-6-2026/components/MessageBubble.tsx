import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';
import { Message } from '../models/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSenderName?: boolean; // Added optional property for group chat support
}

export function MessageBubble({ message, isOwn, showSenderName }: MessageBubbleProps) {
  const colors = useColors();
  const date = new Date(message.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isMatchResult = message.text.startsWith('🏆') || message.text.startsWith('📋');

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {/* Conditionally render the sender's name for incoming group messages */}
      {showSenderName && !isOwn && (message as any).senderName && (
        <Text style={[styles.senderName, { color: colors.mutedForeground }]}>
          {(message as any).senderName}
        </Text>
      )}

      <View
        style={[
          styles.bubble,
          isMatchResult
            ? [styles.matchBubble, { borderColor: isOwn ? colors.accent : colors.border, backgroundColor: colors.accent + '18' }]
            : isOwn
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.text, { color: isMatchResult ? colors.foreground : isOwn ? colors.primaryForeground : colors.foreground }]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{timeString}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, maxWidth: '80%' },
  containerOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  containerOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 4, paddingHorizontal: 4 },
  bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, marginBottom: 4 },
  matchBubble: { borderWidth: 1, borderRadius: 14, maxWidth: 280 },
  text: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  timestamp: { fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'], paddingHorizontal: 4 },
});