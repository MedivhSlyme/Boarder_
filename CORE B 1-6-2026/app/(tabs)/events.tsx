import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useEvents } from '../../context/EventsContext';
import { useGroupChats } from '../../context/GroupChatContext';
import { EmptyState } from '../../components/EmptyState';
import { FeedItem } from '../../models/types';
import Animated, { FadeInDown, useAnimatedStyle, withTiming, withSequence, withDelay } from 'react-native-reanimated';

// ── FeedCard ───────────────────────────────────────────────
function FeedCard({
  item, colors, isHighlighted, isUpcoming, isParticipating, onParticipate, onViewAttending, onDiscuss,
}: {
  item: FeedItem;
  colors: any;
  isHighlighted: boolean;
  isUpcoming: boolean;
  isParticipating: boolean;
  onParticipate: (eventId: string) => void;
  onViewAttending: (eventId: string) => void;
  onDiscuss: (eventId: string, eventTitle: string) => void;
}) {
  const isEvent = item.type === 'event';
  const isSpotAdded = item.type === 'spot_added';
  const isEventRemoved = item.type === 'event_cancelled';
  const isEventUpdated = item.type === 'event_update';

  const iconName = isEvent ? 'calendar'
    : isEventUpdated ? 'edit-3'
    : isEventRemoved ? 'calendar'
    : isSpotAdded ? 'map-pin'
    : 'x-circle';

  const accentColor = isEvent ? colors.primary
    : isEventUpdated ? colors.primary
    : isEventRemoved ? colors.destructive
    : isSpotAdded ? colors.accent
    : colors.destructive;

  const labelText = isEvent ? 'Announcing new Event'
    : isSpotAdded ? 'Announcing new Spot'
    : isEventUpdated ? 'Informing about Update'
    : isEventRemoved ? 'Event cancelled'
    : 'Spot removed';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  const highlightStyle = useAnimatedStyle(() => ({
    borderColor: isHighlighted
      ? withSequence(withTiming(colors.primary, { duration: 500 }), withDelay(2000, withTiming(colors.border, { duration: 1000 })))
      : colors.border,
    borderWidth: isHighlighted ? 2 : 1,
  }));

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card }, highlightStyle]}>
      {isUpcoming && isParticipating && !isHighlighted && (
        <View style={styles.upcomingBadge}>
          <Feather name="calendar" size={13} color="#e05c5c" />
        </View>
      )}
      <View style={[styles.typeBadge, { backgroundColor: accentColor + '22', borderColor: accentColor }]}>
        <Feather name={iconName as any} size={13} color={accentColor} />
        <Text style={[styles.typeText, { color: accentColor }]}>{labelText}</Text>
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>

      {item.date ? (
        <View style={styles.rowItem}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
        </View>
      ) : null}

      {item.spotName ? (
        <View style={styles.rowItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.spotName}</Text>
        </View>
      ) : null}

      {item.subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.subtitle}
        </Text>
      ) : null}

      {item.location ? (
        <View style={styles.rowItem}>
          <Feather name="navigation" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
          </Text>
        </View>
      ) : null}

      {isEvent && (
        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          {/* Participate */}
          <Pressable
            onPress={() => onParticipate(item.id)}
            style={[styles.btn, { backgroundColor: isParticipating ? colors.secondary : colors.primary }]}
          >
            <Feather
              name={isParticipating ? 'check' : 'plus'}
              size={14}
              color={isParticipating ? colors.foreground : colors.primaryForeground}
            />
            <Text style={[styles.btnText, { color: isParticipating ? colors.foreground : colors.primaryForeground }]}>
              {isParticipating ? 'Participating' : 'Participate'}
            </Text>
          </Pressable>

          {/* Attending list */}
          <Pressable
            onPress={() => onViewAttending(item.id)}
            style={[styles.btnOutline, { borderColor: colors.border }]}
          >
            <Feather name="users" size={14} color={colors.foreground} />
            <Text style={[styles.btnText, { color: colors.foreground }]}>Attending</Text>
          </Pressable>

          {/* Discuss — visible only when participating */}
          {isParticipating && (
            <Pressable
              onPress={() => onDiscuss(item.id, item.title)}
              style={[styles.btnOutline, { borderColor: colors.accent }]}
            >
              <Feather name="message-circle" size={14} color={colors.accent} />
              <Text style={[styles.btnText, { color: colors.accent }]}>Discuss</Text>
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────
export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { feedItems, markAllRead } = useEvents();
  const { currentUser, firebaseUser } = useAuth();
  const { getOrCreateEventGroup } = useGroupChats();
  const router = useRouter();
  const { highlightId } = useLocalSearchParams<{ highlightId?: string }>();

  const flatListRef = useRef<FlatList>(null);
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const [participationDocs, setParticipationDocs] = useState<Map<string, string>>(new Map());
  const participatingEventIds = new Set(participationDocs.values());

  const [upcomingSoonIds, setUpcomingSoonIds] = useState<Set<string>>(new Set());
  const upcomingCheckedRef = useRef(false);

  const [attendingModal, setAttendingModal] = useState<{ visible: boolean; eventId: string | null }>({ visible: false, eventId: null });
  const [attendingUsers, setAttendingUsers] = useState<{ id: string; username: string }[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const attendingUnsubRef = useRef<(() => void) | null>(null);

  // Loading state for Discuss action
  const [discussLoading, setDiscussLoading] = useState<string | null>(null);

  useEffect(() => { markAllRead(); }, []);

  useEffect(() => {
    if (!firebaseUser) { setParticipationDocs(new Map()); return; }
    const q = query(collection(db, 'participations'), where('userId', '==', firebaseUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, string>();
      snap.forEach(d => map.set(d.id, d.data().eventId));
      setParticipationDocs(map);
    }, (err) => { console.error('participations listener error:', err); });
    return () => unsub();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (upcomingCheckedRef.current) return;
    if (participatingEventIds.size === 0 || feedItems.length === 0) return;
    upcomingCheckedRef.current = true;
    const now = Date.now();
    const threeDaysAndHalf = 3.75 * 24 * 60 * 60 * 1000;
    const soon = new Set<string>();
    feedItems.forEach(item => {
      if (item.type !== 'event' || !participatingEventIds.has(item.id) || !item.date) return;
      try {
        const diff = new Date(item.date).getTime() - now;
        if (diff >= 0 && diff <= threeDaysAndHalf) soon.add(item.id);
      } catch {}
    });
    setUpcomingSoonIds(soon);
  }, [participatingEventIds.size, feedItems.length]);

  useEffect(() => {
    if (!highlightId || feedItems.length === 0) return;
    const index = feedItems.findIndex(i => i.id === highlightId);
    if (index === -1) return;
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
    }, 600);
  }, [highlightId, feedItems]);

  const handleParticipate = async (eventId: string) => {
    if (!currentUser || !firebaseUser) return;
    const isParticipating = participatingEventIds.has(eventId);
    if (isParticipating) {
      const docId = [...participationDocs.entries()].find(([, evId]) => evId === eventId)?.[0];
      if (!docId) return;
      try { await deleteDoc(doc(db, 'participations', docId)); }
      catch (e) { console.error('Error removing participation:', e); }
    } else {
      try {
        await addDoc(collection(db, 'participations'), {
          eventId, userId: firebaseUser.uid, username: currentUser.username, joinedAt: Date.now(),
        });
      } catch (e) { console.error('Error adding participation:', e); }
    }
  };

  const handleViewAttending = (eventId: string) => {
    if (!currentUser) return;
    attendingUnsubRef.current?.();
    setAttendingModal({ visible: true, eventId });
    setLoadingAttendees(true);
    setAttendingUsers([]);
    const q = query(collection(db, 'participations'), where('eventId', '==', eventId));
    const unsub = onSnapshot(q, (snap) => {
      const users: { id: string; username: string }[] = [];
      snap.forEach(d => { const data = d.data(); users.push({ id: data.userId, username: data.username || 'Anonymous Player' }); });
      setAttendingUsers(users);
      setLoadingAttendees(false);
    }, (err) => { console.error('attendees listener error:', err); setLoadingAttendees(false); });
    attendingUnsubRef.current = unsub;
  };

  const closeAttendingModal = () => {
    attendingUnsubRef.current?.();
    attendingUnsubRef.current = null;
    setAttendingModal({ visible: false, eventId: null });
    setAttendingUsers([]);
  };

  /**
   * Discuss: fetch all participants for this event, find/create the event group chat,
   * then navigate to it.
   */
  const handleDiscuss = async (eventId: string, eventTitle: string) => {
    if (!currentUser || discussLoading) return;
    setDiscussLoading(eventId);
    try {
      const snap = await getDocs(query(collection(db, 'participations'), where('eventId', '==', eventId)));
      const attendeeIds = snap.docs.map(d => d.data().userId as string);
      const groupId = await getOrCreateEventGroup(eventId, eventTitle, attendeeIds);
      if (groupId) {
        router.push(`/chat/group/${groupId}`);
      }
    } catch (e) {
      console.error('Error opening event group chat:', e);
    } finally {
      setDiscussLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={[styles.header, { paddingHorizontal: 20, paddingBottom: 14, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>EVENTS</Text>
        <Text style={[styles.subtitle2, { color: colors.mutedForeground }]}>Events, new spots & community updates</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={feedItems}
        keyExtractor={(item) => item.id}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 500);
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 12, flexGrow: 1 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <FeedCard
              item={item}
              colors={colors}
              isHighlighted={highlightId === item.id}
              isUpcoming={upcomingSoonIds.has(item.id)}
              isParticipating={participatingEventIds.has(item.id)}
              onParticipate={handleParticipate}
              onViewAttending={handleViewAttending}
              onDiscuss={handleDiscuss}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar" title="NOTHING YET" subtitle="Events and spot updates will appear here." />
        }
      />

      {/* Attendees modal */}
      <Modal visible={attendingModal.visible} transparent animationType="fade" onRequestClose={closeAttendingModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.notepadPopup}>
            <View style={styles.notepadHeader}>
              <Text style={styles.notepadTitle}>Attendees</Text>
            </View>
            <View style={styles.notepadBody}>
              {loadingAttendees ? (
                <ActivityIndicator color="#000" style={{ marginVertical: 20 }} />
              ) : attendingUsers.length > 0 ? (
                attendingUsers.map((u, i) => (
                  <Text key={u.id + i} style={styles.notepadItem}>- {u.username}</Text>
                ))
              ) : (
                <Text style={styles.notepadEmpty}>No one has joined yet.</Text>
              )}
            </View>
            <Pressable onPress={closeAttendingModal} style={styles.notepadFooter}>
              <Text style={styles.notepadClose}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Discuss loading overlay */}
      {discussLoading && (
        <View style={styles.discussOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.discussOverlayText, { color: colors.foreground }]}>Opening group chat…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, marginBottom: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: 1 },
  subtitle2: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  card: { borderRadius: 16, padding: 16, marginBottom: 10 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  typeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 6 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 2, marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, flexWrap: 'wrap' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, minWidth: 90 },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 90 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  notepadPopup: {
    width: '80%', maxWidth: 320, backgroundColor: '#FFFFFF',
    borderLeftWidth: 4, borderLeftColor: '#000000', padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  notepadHeader: { borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 10, marginBottom: 14 },
  notepadTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#000000' },
  notepadBody: { minHeight: 60, maxHeight: 250 },
  notepadItem: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#000000', marginBottom: 8 },
  notepadEmpty: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#666666', fontStyle: 'italic' },
  notepadFooter: { marginTop: 20, alignItems: 'flex-end' },
  notepadClose: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#000000', textDecorationLine: 'underline' },
  upcomingBadge: {
    position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  discussOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  discussOverlayText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
