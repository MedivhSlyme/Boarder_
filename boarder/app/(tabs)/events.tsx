import React from 'react';
import { View, FlatList, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationsContext';
import { useColors } from '../../hooks/useColors';
import { EmptyState } from '../../components/EmptyState';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function EventsScreen() {
  const { eventNotifications, markAsRead } = useNotifications();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'Chess Cafe': '♟️',
      'Library': '📚',
      'Gaming Club': '🎲',
      'Board Game Store': '🏪',
      'Bar / Pub': '🍺',
      'Community Center': '🏛️',
      'Other': '📍',
    };
    return emojiMap[category] || '📍';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Feather name="calendar" size={22} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>EVENTS</Text>
        {eventNotifications.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{eventNotifications.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={eventNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emoji}>{getCategoryEmoji(item.category)}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.spotName, { color: colors.foreground }]}>{item.spotName}</Text>
                <Text style={[styles.category, { color: colors.accent }]}>{item.category}</Text>
                <Text style={[styles.eventDate, { color: colors.primary }]}>
                  <Feather name="clock" size={12} /> {formatDate(item.eventDate)}
                </Text>
                {item.description && (
                  <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => markAsRead(item.id)}
                style={[styles.dismissBtn, { backgroundColor: colors.primary + '22' }]}
              >
                <Feather name="x" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar" title="NO UPCOMING EVENTS" subtitle="Events will be announced here when admins create them." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 1, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  emoji: { fontSize: 28, marginTop: 4 },
  spotName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  category: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  eventDate: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 4 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  dismissBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
