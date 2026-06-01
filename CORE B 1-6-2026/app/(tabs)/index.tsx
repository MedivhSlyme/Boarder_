import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LeafletMap } from '../../components/LeafletMap';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { useSpots } from '../../context/SpotsContext';
import { useEvents } from '../../context/EventsContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { Feather } from '@expo/vector-icons';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { currentUser, updateUser } = useAuth();
  const { nearbyPlayers, updateUserLocation } = useFriends();
  const { spots } = useSpots();
  const { feedItems: events } = useEvents();

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              updateUserLocation(pos.coords.latitude, pos.coords.longitude);
              if (currentUser) updateUser({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
            },
            () => updateUserLocation(36.8065, 10.1815),
          );
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        updateUserLocation(loc.coords.latitude, loc.coords.longitude);
        if (currentUser) updateUser({ location: { lat: loc.coords.latitude, lng: loc.coords.longitude } });
      }
    })();
  }, [currentUser?.id]);

  const onlySpots = spots.filter(s => !s.isEvent);
  const onlyEvents = events.filter(e => e.type === 'event');

  const topInset = Platform.OS === 'web' ? insets.top + 80 : insets.top + 20;

  return (
    <View style={styles.container}>
      <LeafletMap
        currentUser={currentUser}
        players={nearbyPlayers}
        spots={onlySpots}
        events={onlyEvents}
        onMarkerTap={(id) => router.push(`/user/${id}`)}
        onViewEvent={(eventId) => router.push({ pathname: '/events', params: { highlightId: eventId } })} // ADDED
      />

      <View style={[styles.leftDashboard, { top: topInset }]}>
        <View style={[styles.statBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.badgeText, { color: colors.foreground }]}>
            {nearbyPlayers.length} active
          </Text>
        </View>
      </View>

      <View style={[styles.rightDashboard, { top: topInset }]}>
        <View style={[styles.statBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map-pin" size={13} color={colors.accent} />
          <Text style={[styles.badgeText, { color: colors.foreground }]}>
            {onlySpots.length} spots
          </Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={13} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.foreground }]}>
            {onlyEvents.length} events
          </Text>
        </View>
      </View>

      {nearbyPlayers.length > 0 && (
        <View style={[styles.bottomStrip, { bottom: insets.bottom + 90, backgroundColor: colors.card + 'E6', borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
            {nearbyPlayers.slice(0, 10).map((player) => (
              <Pressable key={player.id} onPress={() => router.push(`/user/${player.id}`)} style={styles.avatarBtn}>
                <Avatar username={player.username} profilePic={player.profile_pic} size={46} />
                <Text style={[styles.stripName, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {player.username}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  leftDashboard: { position: 'absolute', left: 16, zIndex: 10 },
  rightDashboard: { position: 'absolute', right: 16, flexDirection: 'column', gap: 6, zIndex: 10, alignItems: 'flex-end' },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, minWidth: 95, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  bottomStrip: {
    position: 'absolute', left: 16, right: 16, borderRadius: 20, paddingVertical: 12,
    paddingHorizontal: 8, borderWidth: 1, zIndex: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  stripContent: { alignItems: 'center', gap: 14, paddingHorizontal: 6 },
  avatarBtn: { alignItems: 'center', width: 60, gap: 4 },
  stripName: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center' },
});