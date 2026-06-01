import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GameRow } from '../../components/GameRow';
import { FeedItem } from '../../models/types';

export default function ProfileScreen() {
  const { currentUser, logout, firebaseUser } = useAuth();
  const { feedItems } = useEvents();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  // Map of participationDocId → eventId for current user
  const [participationDocs, setParticipationDocs] = useState<Map<string, string>>(new Map());
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!firebaseUser) { setParticipationDocs(new Map()); return; }
    const q = query(
      collection(db, 'participations'),
      where('userId', '==', firebaseUser.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, string>();
      snap.forEach(d => map.set(d.id, d.data().eventId));
      setParticipationDocs(map);
    }, (err) => console.error('profile participations error:', err));
    unsubRef.current = unsub;
    return () => unsub();
  }, [firebaseUser?.uid]);

  if (!currentUser) return null;

  const { profile_details, games } = currentUser;

  // Build participated events list from feedItems (already loaded in context)
  const participatingEventIds = new Set(participationDocs.values());
  const participatedEvents: (FeedItem & { isPast: boolean })[] = feedItems
    .filter(item => item.type === 'event' && participatingEventIds.has(item.id))
    .map(item => {
      let isPast = false;
      if (item.date) {
        try { isPast = new Date(item.date).getTime() < Date.now(); } catch {}
      }
      return { ...item, isPast };
    })
    .sort((a, b) => {
      // Active events first, then past; within each group newest first
      if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
      return b.createdAt - a.createdAt;
    });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: insets.bottom + 100, paddingHorizontal: 24 }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/edit-profile')} style={styles.avatarWrap}>
          <Avatar username={currentUser.username} profilePic={profile_details?.profile_pic} size={96} />
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={12} color="#fff" />
          </View>
        </Pressable>
        <Text style={[styles.username, { color: colors.foreground }]}>{currentUser.username}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{currentUser.email}</Text>

        <View style={[styles.pointsBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}>
          <Feather name="award" size={14} color={colors.accent} />
          <Text style={[styles.pointsText, { color: colors.accent }]}>{currentUser.boardPoints ?? 0} Board Points</Text>
        </View>

        {profile_details?.bio ? (
          <Text style={[styles.bio, { color: colors.textDim }]}>{profile_details.bio}</Text>
        ) : null}
        {profile_details?.availability ? (
          <View style={[styles.availRow, { borderColor: colors.border }]}>
            <Feather name="clock" size={12} color={colors.primary} />
            <Text style={[styles.avail, { color: colors.primary }]}>{profile_details.availability}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAMES</Text>
        {games && games.length > 0 ? (
          games.map((g, i) => <GameRow key={i} game={g} />)
        ) : (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No games added yet. Edit your profile to add some.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>LOCATION</Text>
        <View style={[styles.locCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.locText, { color: colors.primary }]}>
            {currentUser.location.lat.toFixed(4)}, {currentUser.location.lng.toFixed(4)}
          </Text>
          <View style={[styles.activeDot, { backgroundColor: currentUser.active ? colors.primary : colors.mutedForeground }]} />
        </View>
      </View>

      {/* ── Participated Events ─────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MY EVENTS</Text>
        {participatedEvents.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            You haven't joined any events yet.
          </Text>
        ) : (
          participatedEvents.map((ev) => (
            <Pressable
              key={ev.id}
              onPress={() => router.push({ pathname: '/(tabs)/events', params: { highlightId: ev.id } })}
              style={[
                styles.eventRow,
                {
                  backgroundColor: ev.isPast ? colors.surfaceHigh : colors.card,
                  borderColor: ev.isPast ? colors.border : colors.primary,
                  opacity: ev.isPast ? 0.6 : 1,
                },
              ]}
            >
              <View style={styles.eventRowLeft}>
                <Feather
                  name="calendar"
                  size={14}
                  color={ev.isPast ? colors.mutedForeground : colors.primary}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={[styles.eventTitle, { color: ev.isPast ? colors.mutedForeground : colors.foreground }]}
                    numberOfLines={1}
                  >
                    {ev.title.replace(/^Announcing new Event : /, '')}
                  </Text>
                  {ev.date ? (
                    <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                      {formatDate(ev.date)}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[
                styles.eventBadge,
                { backgroundColor: ev.isPast ? colors.border : colors.primary + '22' },
              ]}>
                <Text style={[
                  styles.eventBadgeText,
                  { color: ev.isPast ? colors.mutedForeground : colors.primary },
                ]}>
                  {ev.isPast ? 'Past' : 'Active'}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="EDIT PROFILE" icon="edit-2" onPress={() => router.push('/edit-profile')} variant="secondary" />
        <PrimaryButton title="SIGN OUT" icon="log-out" onPress={logout} variant="destructive" style={{ marginTop: 10 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  username: { fontFamily: 'Inter_700Bold', fontSize: 24, marginBottom: 4 },
  email: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 10 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 },
  pointsText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  avail: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, fontStyle: 'italic' },
  locCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1 },
  locText: { fontFamily: 'Inter_500Medium', fontSize: 14, fontVariant: ['tabular-nums'] },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  actions: { marginTop: 8 },
  // Event rows
  eventRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  eventRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  eventTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  eventDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  eventBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  eventBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});
