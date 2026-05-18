import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LeafletMap } from '../../components/LeafletMap';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { BoardGameSpot } from '../../models/types';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { currentUser, updateUser } = useAuth();
  const { nearbyPlayers, updateUserLocation, boardGameSpots } = useFriends();
  const [selectedSpot, setSelectedSpot] = useState<BoardGameSpot | null>(null);

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
        if (status !== 'granted') { updateUserLocation(36.8065, 10.1815); return; }
        const loc = await Location.getCurrentPositionAsync({});
        updateUserLocation(loc.coords.latitude, loc.coords.longitude);
        if (currentUser) updateUser({ location: { lat: loc.coords.latitude, lng: loc.coords.longitude } });
      }
    })();
  }, []);

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LeafletMap
        currentUser={currentUser}
        players={nearbyPlayers}
        spots={boardGameSpots}
        onMarkerTap={(id) => router.push(`/user/${id}`)}
        onSpotTap={(spot) => setSelectedSpot(spot)}
      />

      <View style={[styles.badge, { top: topInset + 16, backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.badgeText, { color: colors.foreground }]}>
          {nearbyPlayers.length} active nearby
        </Text>
      </View>

      {boardGameSpots.length > 0 && (
        <View style={[styles.spotsBadge, { top: topInset + 16, backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.spotEmoji}>🎲</Text>
          <Text style={[styles.badgeText, { color: colors.foreground }]}>
            {boardGameSpots.length} spot{boardGameSpots.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {nearbyPlayers.length > 0 && (
        <View style={[styles.bottomStrip, { bottom: insets.bottom + 90 }]}>
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

      {/* Board Game Spot Detail Modal */}
      <Modal visible={!!selectedSpot} transparent animationType="slide" onRequestClose={() => setSelectedSpot(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedSpot(null)}>
          <Pressable
            style={[styles.spotCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.spotHeader}>
              <Text style={styles.spotEmojiBig}>
                {selectedSpot?.category === 'Chess Cafe' ? '♟️' :
                 selectedSpot?.category === 'Library' ? '📚' :
                 selectedSpot?.category === 'Gaming Club' ? '🎲' :
                 selectedSpot?.category === 'Board Game Store' ? '🏪' :
                 selectedSpot?.category === 'Bar / Pub' ? '🍺' :
                 selectedSpot?.category === 'Community Center' ? '🏛️' : '📍'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.spotName, { color: colors.foreground }]}>{selectedSpot?.name}</Text>
                <Text style={[styles.spotCategory, { color: colors.accent }]}>{selectedSpot?.category}</Text>
              </View>
              <Pressable onPress={() => setSelectedSpot(null)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {selectedSpot?.description ? (
              <Text style={[styles.spotDesc, { color: colors.mutedForeground }]}>{selectedSpot.description}</Text>
            ) : null}
            <Text style={[styles.spotCoords, { color: colors.textDim }]}>
              {selectedSpot?.location.lat.toFixed(4)}, {selectedSpot?.location.lng.toFixed(4)}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  badge: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  spotsBadge: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  spotEmoji: { fontSize: 14 },
  bottomStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stripContent: { paddingHorizontal: 16, gap: 12 },
  avatarBtn: { alignItems: 'center', gap: 4 },
  stripName: { fontFamily: 'Inter_400Regular', fontSize: 10, width: 46, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    paddingBottom: 24,
  },
  spotCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  spotHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  spotEmojiBig: { fontSize: 32 },
  spotName: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 2 },
  spotCategory: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  spotDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  spotCoords: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
