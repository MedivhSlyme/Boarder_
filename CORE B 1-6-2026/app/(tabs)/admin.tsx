import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Platform, FlatList,
  TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, updateDoc, query, orderBy, where,
} from 'firebase/firestore';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useFriends } from '../../context/FriendsContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Spot, GameEvent, User } from '../../models/types';

type AdminTab = 'users' | 'spots' | 'events';
type UserSort = 'name' | 'date';

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { allUsers } = useFriends();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const [adminTab, setAdminTab] = useState<AdminTab>('users');

  // ── Users state ──────────────────────────────────────────
  const [userSort, setUserSort] = useState<UserSort>('name');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  const sortedUsers = [...allUsers].sort((a, b) => {
    if (userSort === 'name') return a.username.localeCompare(b.username);
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  // ── Spots state (isEvent === false only) ─────────────────
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [spotName, setSpotName] = useState('');
  const [spotDesc, setSpotDesc] = useState('');
  const [spotType, setSpotType] = useState('');
  const [spotAddress, setSpotAddress] = useState('');
  const [spotLat, setSpotLat] = useState('');
  const [spotLng, setSpotLng] = useState('');
  const [spotSaving, setSpotSaving] = useState(false);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [showSpotForm, setShowSpotForm] = useState(false);
  const [editSpot, setEditSpot] = useState<Spot | null>(null);
  const [confirmDeleteSpot, setConfirmDeleteSpot] = useState<Spot | null>(null);

  // ── Events state (isEvent === true only) ──────────────────
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  
  // Datepicker Additions
  const [evDateObject, setEvDateObject] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [evSpotName, setEvSpotName] = useState('');
  const [evLat, setEvLat] = useState('');
  const [evLng, setEvLng] = useState('');
  const [evSaving, setEvSaving] = useState(false);
  const [evError, setEvError] = useState<string | null>(null);
  const [showEvForm, setShowEvForm] = useState(false);
  const [editEvent, setEditEvent] = useState<GameEvent | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<GameEvent | null>(null);

  // Formatting utility: Date object -> "YYYY-MM-DD"
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parsing utility: "YYYY-MM-DD" -> Date object
  const parseStringToDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  // Spots: only non-event entries (isEvent == false)
  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'boardGameSpots'),
        where('isEvent', '==', false),
        orderBy('createdAt', 'desc'),
      ),
      (snap) => {
        const out: Spot[] = [];
        snap.forEach((d) => out.push({ id: d.id, ...(d.data() as Omit<Spot, 'id'>) }));
        setSpots(out);
        setSpotsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Events: only event entries (isEvent == true)
  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'boardGameSpots'),
        where('isEvent', '==', true),
        orderBy('createdAt', 'desc'),
      ),
      (snap) => {
        const out: GameEvent[] = [];
        snap.forEach((d) => out.push({ id: d.id, ...(d.data() as Omit<GameEvent, 'id'>) }));
        setEvents(out);
        setEventsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];

  // ── Guard ─────────────────────────────────────────────────
  if (!currentUser?.isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shield-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.noAccess, { color: colors.mutedForeground }]}>Admin access required</Text>
      </View>
    );
  }

  // ── Spot helpers ──────────────────────────────────────────
  const resetSpotForm = () => {
    setSpotName(''); setSpotDesc(''); setSpotType('');
    setSpotAddress(''); setSpotLat(''); setSpotLng('');
    setEditSpot(null); setShowSpotForm(false);
  };

  const openEditSpot = (s: Spot) => {
    setSpotName(s.name); setSpotDesc(s.description); setSpotType(s.type);
    setSpotAddress(s.address); setSpotLat(String(s.location.lat)); setSpotLng(String(s.location.lng));
    setEditSpot(s); setShowSpotForm(true);
  };

  const saveSpot = async () => {
    if (!spotName.trim() || !spotLat.trim() || !spotLng.trim()) { setSpotError('Name, lat and lng are required.'); return; }
    const lat = parseFloat(spotLat), lng = parseFloat(spotLng);
    if (isNaN(lat) || isNaN(lng)) { setSpotError('Lat / lng must be numbers.'); return; }
    setSpotSaving(true); setSpotError(null);
    try {
      const data = {
        name: spotName.trim(), description: spotDesc.trim(),
        type: spotType.trim(), address: spotAddress.trim(),
        location: { lat, lng }, addedBy: currentUser.id,
      };
      if (editSpot) {
        await updateDoc(doc(db, 'boardGameSpots', editSpot.id), data);
      } else {
        const spotData = { ...data, isEvent: false, createdAt: Date.now() };
        await addDoc(collection(db, 'boardGameSpots'), spotData);
        await addDoc(collection(db, 'spotNotifications'), {
          type: 'spot_added',
          spotName: spotName.trim(),
          address: spotAddress.trim(),
          createdAt: Date.now(),
        }).catch(() => {});
      }
      resetSpotForm();
    } catch (e: any) { setSpotError(e?.message ?? 'Failed'); }
    finally { setSpotSaving(false); }
  };

  const deleteSpot = async (s: Spot) => {
    await deleteDoc(doc(db, 'boardGameSpots', s.id)).catch(() => {});
    await addDoc(collection(db, 'spotNotifications'), {
      type: 'spot_removed',
      spotName: s.name,
      address: s.address ?? '',
      createdAt: Date.now(),
    }).catch(() => {});
    setConfirmDeleteSpot(null);
  };

  // ── Event helpers ─────────────────────────────────────────
  const resetEvForm = () => {
    setEvTitle(''); setEvDesc(''); 
    setEvDateObject(new Date());
    setShowDatePicker(false);
    setEvSpotName(''); setEvLat(''); setEvLng('');
    setEditEvent(null); setShowEvForm(false);
  };

  const openEditEvent = (e: GameEvent) => {
    setEvTitle(e.title); setEvDesc(e.description ?? '');
    setEvSpotName(e.spotName ?? '');
    setEvLat(e.location ? String(e.location.lat) : '');
    setEvLng(e.location ? String(e.location.lng) : '');
    
    if (e.date) {
      setEvDateObject(parseStringToDate(e.date));
    } else {
      setEvDateObject(new Date());
    }
    
    setEditEvent(e); setShowEvForm(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEvDateObject(selectedDate);
    }
  };

  const saveEvent = async () => {
    const formattedDateString = formatDateToString(evDateObject);

    if (!evTitle.trim() || !formattedDateString) { setEvError('Title and date are required.'); return; }
    setEvSaving(true); setEvError(null);
    try {
      const latNum = parseFloat(evLat), lngNum = parseFloat(evLng);
      const data: any = {
        title: evTitle.trim(), description: evDesc.trim(),
        date: formattedDateString, 
        spotName: evSpotName.trim(),
        createdBy: currentUser.id,
        isEvent: true,
      };
      if (!isNaN(latNum) && !isNaN(lngNum)) data.location = { lat: latNum, lng: lngNum };
      
      if (editEvent) {
        await updateDoc(doc(db, 'boardGameSpots', editEvent.id), data);
        await addDoc(collection(db, 'spotNotifications'), {
          type: 'event_updated',
          spotName: evTitle.trim(),
          address: evSpotName.trim(),
          createdAt: Date.now(),
        }).catch(() => {});
      } else {
        data.createdAt = Date.now();
        await addDoc(collection(db, 'boardGameSpots'), data);
      }
      resetEvForm();
    } catch (e: any) { setEvError(e?.message ?? 'Failed'); }
    finally { setEvSaving(false); }
  };

  const deleteEvent = async (e: GameEvent) => {
    await deleteDoc(doc(db, 'boardGameSpots', e.id)).catch(() => {});
    await addDoc(collection(db, 'spotNotifications'), {
      type: 'event_removed',
      spotName: e.title,
      address: e.spotName ?? '',
      createdAt: Date.now(),
    }).catch(() => {});
    setConfirmDeleteEvent(null);
  };

  const ADMIN_TABS: { key: AdminTab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'spots', label: 'Spots' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>ADMIN PANEL</Text>
      </View>

      {/* Sub-tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {ADMIN_TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setAdminTab(t.key)}
            style={[styles.tab, { borderBottomColor: adminTab === t.key ? colors.primary : 'transparent', borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: adminTab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ══ USERS TAB ══ */}
      {adminTab === 'users' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.sortRow, { paddingHorizontal: 16, paddingVertical: 10 }]}>
            <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>Sort by:</Text>
            {(['name', 'date'] as UserSort[]).map((s) => (
              <Pressable key={s} onPress={() => setUserSort(s)}
                style={[styles.sortChip, { backgroundColor: userSort === s ? colors.primary : colors.secondary, borderColor: userSort === s ? colors.primary : colors.border }]}>
                <Text style={{ color: userSort === s ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
                  {s === 'name' ? 'Name' : 'Newest'}
                </Text>
              </Pressable>
            ))}
            <Text style={[styles.sortLabel, { color: colors.mutedForeground, marginLeft: 'auto' }]}>{allUsers.length} users</Text>
          </View>
          <FlatList
            data={sortedUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
            renderItem={({ item: u }) => (
              <Pressable 
                onPress={() => router.push(`/user/${u.id}`)}
                style={({ pressed }) => [
                  styles.userCard, 
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1 
                  }
                ]}
              >
                <Avatar username={u.username} profilePic={u.profile_details?.profile_pic} size={42} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.userNameRow}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{u.username}</Text>
                    {u.isAdmin && (
                      <View style={[styles.adminBadge, { backgroundColor: colors.accent + '33', borderColor: colors.accent }]}>
                        <Text style={[styles.adminBadgeText, { color: colors.accent }]}>admin</Text>
                      </View>
                    )}
                    <View style={[styles.statusDot, { backgroundColor: u.active ? colors.primary : colors.muted }]} />
                  </View>
                  <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
                  <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
                    {u.boardPoints ?? 0} pts · {u.games?.length ?? 0} games
                    {u.createdAt ? ` · Joined ${new Date(u.createdAt).toLocaleDateString()}` : ''}
                  </Text>
                </View>
                <View style={styles.userActions}>
                  {u.id !== currentUser.id && (
                    <Pressable 
                      hitSlop={8} 
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/chat/${u.id}`);
                      }}
                      style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
                    >
                      <Feather name="message-square" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  )}
                  {u.id !== currentUser.id && (
                    <Pressable 
                      hitSlop={8} 
                      onPress={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteUser(u);
                      }}
                      style={[styles.iconBtn, { backgroundColor: colors.destructive + '22' }]}
                    >
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* ══ SPOTS TAB ══ */}
      {adminTab === 'spots' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.addBar, { paddingHorizontal: 16, paddingVertical: 10 }]}>
            <Pressable onPress={() => { resetSpotForm(); setShowSpotForm((v) => !v); }} hitSlop={8}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <Feather name={showSpotForm ? 'minus' : 'plus'} size={16} color={colors.primaryForeground} />
              <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>{editSpot ? 'Edit Spot' : 'Add Spot'}</Text>
            </Pressable>
          </View>

          {showSpotForm && (
            <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 10 }]}>
              <TextInput style={inputStyle} placeholder="Name *" placeholderTextColor={colors.mutedForeground} value={spotName} onChangeText={setSpotName} />
              <TextInput style={[inputStyle, { marginTop: 8 }]} placeholder="Description" placeholderTextColor={colors.mutedForeground} value={spotDesc} onChangeText={setSpotDesc} />
              <TextInput style={[inputStyle, { marginTop: 8 }]} placeholder="Type (café, club…)" placeholderTextColor={colors.mutedForeground} value={spotType} onChangeText={setSpotType} />
              <TextInput style={[inputStyle, { marginTop: 8 }]} placeholder="Address" placeholderTextColor={colors.mutedForeground} value={spotAddress} onChangeText={setSpotAddress} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput style={[inputStyle, { flex: 1 }]} placeholder="Lat *" placeholderTextColor={colors.mutedForeground} value={spotLat} onChangeText={setSpotLat} keyboardType="decimal-pad" />
                <TextInput style={[inputStyle, { flex: 1 }]} placeholder="Lng *" placeholderTextColor={colors.mutedForeground} value={spotLng} onChangeText={setSpotLng} keyboardType="decimal-pad" />
              </View>
              {spotError ? <Text style={[styles.error, { color: colors.destructive }]}>{spotError}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <PrimaryButton title={spotSaving ? '...' : editSpot ? 'UPDATE' : 'ADD'} onPress={saveSpot} disabled={spotSaving} style={{ flex: 1 }} />
                <PrimaryButton title="CANCEL" onPress={resetSpotForm} variant="secondary" style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {spotsLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
            <FlatList data={spots} keyExtractor={(s) => s.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
              renderItem={({ item: s }) => (
                <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{s.name}</Text>
                    {s.type ? <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{s.type}</Text> : null}
                    {s.address ? <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{s.address}</Text> : null}
                    <Text style={[styles.itemMeta, { color: colors.primary }]}>{s.location.lat.toFixed(4)}, {s.location.lng.toFixed(4)}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable onPress={() => openEditSpot(s)} hitSlop={8}
                      style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
                      <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteSpot(s)} hitSlop={8}
                      style={[styles.iconBtn, { backgroundColor: colors.destructive + '22' }]}>
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No spots yet.</Text>}
            />
          )}
        </View>
      )}

      {/* ══ EVENTS TAB ══ */}
      {adminTab === 'events' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.addBar, { paddingHorizontal: 16, paddingVertical: 10 }]}>
            <Pressable onPress={() => { resetEvForm(); setShowEvForm((v) => !v); }} hitSlop={8}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <Feather name={showEvForm ? 'minus' : 'plus'} size={16} color={colors.primaryForeground} />
              <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>{editEvent ? 'Edit Event' : 'Add Event'}</Text>
            </Pressable>
          </View>

          {showEvForm && (
            <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 10 }]}>
              <TextInput style={inputStyle} placeholder="Title *" placeholderTextColor={colors.mutedForeground} value={evTitle} onChangeText={setEvTitle} />
              <TextInput style={[inputStyle, { marginTop: 8 }]} placeholder="Description" placeholderTextColor={colors.mutedForeground} value={evDesc} onChangeText={setEvDesc} />
              
              {/* Datepicker Picker Row */}
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formatDateToString(evDateObject)}
                  onChange={(e) => {
                    if (e.target.value) setEvDateObject(parseStringToDate(e.target.value));
                  }}
                  style={{
                    height: 55, // Increased size by 10% from 50
                    borderRadius: 10,
                    borderWidth: 1,
                    paddingHorizontal: 14,
                    fontSize: 16.5, // Increased text size by 10% from 15
                    marginTop: 8,
                    backgroundColor: '#FFFFFF', // Clean White background
                    color: '#000000', // Crisp dark contrast color for readability
                    borderColor: colors.border,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  } as any}
                />
              ) : (
                <>
                  <Pressable 
                    onPress={() => setShowDatePicker(true)}
                    style={[
                      inputStyle, 
                      { 
                        height: 55, // Increased component size by 10% from 50
                        marginTop: 8, 
                        justifyContent: 'center',
                        backgroundColor: '#FFFFFF' // Clean White background
                      }
                    ]}
                  >
                    <Text style={{ color: '#000000', fontSize: 16.5 }}>
                      📅  {formatDateToString(evDateObject)}
                    </Text>
                  </Pressable>

                  {showDatePicker && (
                    <DateTimePicker
                      value={evDateObject}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </>
              )}

              <TextInput style={[inputStyle, { marginTop: 8 }]} placeholder="Spot / venue name" placeholderTextColor={colors.mutedForeground} value={evSpotName} onChangeText={setEvSpotName} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput style={[inputStyle, { flex: 1 }]} placeholder="Lat (opt)" placeholderTextColor={colors.mutedForeground} value={evLat} onChangeText={setEvLat} keyboardType="decimal-pad" />
                <TextInput style={[inputStyle, { flex: 1 }]} placeholder="Lng (opt)" placeholderTextColor={colors.mutedForeground} value={evLng} onChangeText={setEvLng} keyboardType="decimal-pad" />
              </View>
              {evError ? <Text style={[styles.error, { color: colors.destructive }]}>{evError}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <PrimaryButton title={evSaving ? '...' : editEvent ? 'UPDATE' : 'PUBLISH'} onPress={saveEvent} disabled={evSaving} style={{ flex: 1 }} />
                <PrimaryButton title="CANCEL" onPress={resetEvForm} variant="secondary" style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {eventsLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
            <FlatList data={events} keyExtractor={(e) => e.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
              renderItem={({ item: e }) => (
                <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{e.title}</Text>
                    <Text style={[styles.itemMeta, { color: colors.primary }]}>{e.date}</Text>
                    {e.spotName ? <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{e.spotName}</Text> : null}
                    {e.description ? <Text style={[styles.itemMeta, { color: colors.mutedForeground }]} numberOfLines={2}>{e.description}</Text> : null}
                    {e.location ? <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>📍 {e.location.lat.toFixed(4)}, {e.location.lng.toFixed(4)}</Text> : null}
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable onPress={() => openEditEvent(e)} hitSlop={8}
                      style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
                      <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteEvent(e)} hitSlop={8}
                      style={[styles.iconBtn, { backgroundColor: colors.destructive + '22' }]}>
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No events yet.</Text>}
            />
          )}
        </View>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        visible={!!confirmDeleteSpot}
        title="Delete Spot"
        message={`Delete "${confirmDeleteSpot?.name}"? This cannot be undone.`}
        confirmLabel="DELETE" cancelLabel="CANCEL" destructive
        onConfirm={() => confirmDeleteSpot && deleteSpot(confirmDeleteSpot)}
        onCancel={() => setConfirmDeleteSpot(null)}
      />
      <ConfirmDialog
        visible={!!confirmDeleteEvent}
        title="Delete Event"
        message={`Delete "${confirmDeleteEvent?.title}"? This cannot be undone.`}
        confirmLabel="DELETE" cancelLabel="CANCEL" destructive
        onConfirm={() => confirmDeleteEvent && deleteEvent(confirmDeleteEvent)}
        onCancel={() => setConfirmDeleteEvent(null)}
      />
      <ConfirmDialog
        visible={!!confirmDeleteUser}
        title="Delete User"
        message={`Delete account for "${confirmDeleteUser?.username}"? This will remove their Firestore record.`}
        confirmLabel="DELETE" cancelLabel="CANCEL" destructive
        onConfirm={async () => {
          if (confirmDeleteUser) {
            await deleteDoc(doc(db, 'users', confirmDeleteUser.id)).catch(() => {});
          }
          setConfirmDeleteUser(null);
        }}
        onCancel={() => setConfirmDeleteUser(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noAccess: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  addBar: { flexDirection: 'row' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  form: { borderRadius: 14, borderWidth: 1, padding: 14 },
  input: { height: 50, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 6 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  userName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  adminBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  adminBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  userEmail: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  userMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  userActions: { flexDirection: 'row', gap: 6 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  itemMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 1 },
  itemActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', marginTop: 40 },
});