import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMessages } from '../../context/MessagesContext';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ChatScreen() {
  const { messages } = useMessages();
  const { allUsers } = useFriends();
  const { currentUser } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const conversations = useMemo(() => {
    if (!currentUser) return [];
    const latest = new Map<string, typeof messages[0]>();
    messages.forEach((m) => {
      const otherId = m.senderId === currentUser.id ? m.receiverId : m.senderId;
      const existing = latest.get(otherId);
      if (!existing || m.timestamp > existing.timestamp) {
        latest.set(otherId, m);
      }
    });
    return Array.from(latest.entries())
      .map(([otherId, lastMsg]) => ({
        otherId,
        lastMsg,
        user: allUsers.find((u) => u.id === otherId),
      }))
      .filter((c) => c.user)
      .sort((a, b) => b.lastMsg.timestamp - a.lastMsg.timestamp);
  }, [messages, allUsers, currentUser]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.otherId}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item, index }) => {
          const u = item.user!;
          const profilePic = u.profile_details?.profile_pic ?? '';
          const unread = item.lastMsg.senderId !== currentUser?.id;
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => router.push(`/chat/${item.otherId}`)}
              >
                <Avatar username={u.username} profilePic={profilePic} size={48} />
                <View style={styles.content}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{u.username}</Text>
                  <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.lastMsg.text}
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {new Date(item.lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="message-square" title="NO MESSAGES YET" subtitle="Tap a player on the map to start a conversation." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  content: { flex: 1, marginLeft: 12 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 3 },
  preview: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  meta: { alignItems: 'flex-end', gap: 6 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11, fontVariant: ['tabular-nums'] },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
