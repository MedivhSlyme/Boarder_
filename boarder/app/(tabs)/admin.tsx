import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform, TextInput,
  Pressable, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Toast, useToast } from '../../components/Toast';
import { BoardGameSpotCategory, SPOT_CATEGORIES } from '../../models/types';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AdminTab = 'users' | 'spots';

export default function AdminScreen() {
  const { currentUser, isAdmin } = useAuth();
  const { allUsers, boardGameSpots, deleteUserAccount, addBoardGameSpot, deleteBoardGameSpot } = useFriends();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteSpotId, setDeleteSpotId] = useState<string | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const { toastState, show, hide } = useToast();

  // Add spot form state
  const [spotName, setSpotName] = useState('');
  const [spotCategory, setSpotCategory] = useState<BoardGameSpotCategory>('Gaming Club');
  const [spotDesc, setSpotDesc] = useState('');
  const [spotLat, setSpotLat] = useState('');
  const [spotLng, setSpotLng] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shield-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.noAccess, { color: colors.mutedForeground }]}>Admin access only</Text>
      </View>
    );
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (userSearch.trim() === '' ||
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUserAccount(deleteUserId);
      show('User deleted successfully', 'success');
    } catch {
      show('Failed to delete user', 'error');
    } finally {
      setDeleteUserId(null);
    }
  };

  const handleDeleteSpot = async () => {
    if (!deleteSpotId) return;
    try {
      await deleteBoardGameSpot(deleteSpotId);
      show('Spot removed', 'success');
    } catch {
      show('Failed to delete spot', 'error');
    } finally {
      setDeleteSpotId(null);
    }
  };

  const handleAddSpot = async () => {
    if (!spotName.trim() || !spotLat.trim() || !spotLng.trim()) {
      show('Name, latitude and longitude are required', 'error');
      return;
    }
    const lat = parseFloat(spotLat);
    const lng = parseFloat(spotLng);
    if (isNaN(lat) || isNaN(lng)) {
      show('Latitude and longitude must be valid numbers', 'error');
      return;
    }
    setSaving(true);
    try {
      await addBoardGameSpot({
        name: spotName.trim(),
        category: spotCategory,
        description: spotDesc.trim(),
        location: { lat, lng },
      });
      setSpotName('');
      setSpotDesc('');
      setSpotLat('');
      setSpotLng('');
      setShowAddSpot(false);
      show('Spot added to map!', 'success');
    } catch {
      show('Failed to add spot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Feather name="shield" size={20} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ADMIN PANEL</Text>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, activeTab === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'users' ? colors.primary : colors.mutedForeground }]}>
            USERS ({allUsers.length - 1})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'spots' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('spots')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'spots' ? colors.primary : colors.mutedForeground }]}>
            SPOTS ({boardGameSpots.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'users' ? (
        <>
          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search users..."
              placeholderTextColor={colors.mutedForeground}
              value={userSearch}
              onChangeText={setUserSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {userSearch.length > 0 && (
              <Pressable onPress={() => setUserSearch('')} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
                <View style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Pressable style={styles.userLeft} onPress={() => router.push(`/user/${item.id}`)}>
                    <Avatar username={item.username} profilePic={item.profile_details?.profile_pic} size={42} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: colors.foreground }]}>{item.username}</Text>
                        {item.isAdmin && (
                          <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.adminBadgeText, { color: colors.primaryForeground }]}>ADMIN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.userMeta}>
                    <View style={[styles.statusDot, { backgroundColor: item.active ? colors.primary : colors.textDim }]} />
                    <Pressable
                      onPress={() => setDeleteUserId(item.id)}
                      style={[styles.deleteBtn, { backgroundColor: colors.destructive + '22' }]}
                      hitSlop={4}
                    >
                      <Feather name="trash-2" size={16} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>No users found</Text>
            }
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}>
          <PrimaryButton
            title={showAddSpot ? 'CANCEL' : '+ ADD SPOT'}
            onPress={() => setShowAddSpot((v) => !v)}
            variant={showAddSpot ? 'secondary' : 'primary'}
            style={{ marginBottom: 16 }}
          />

          {showAddSpot && (
            <View style={[styles.addSpotForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>NAME *</Text>
              <TextInput
                style={[inputStyle, { marginBottom: 12 }]}
                value={spotName}
                onChangeText={setSpotName}
                placeholder="e.g. Chess Corner Café"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>CATEGORY *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {SPOT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setSpotCategory(cat)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: spotCategory === cat ? colors.accent : colors.surfaceHigh,
                        borderColor: spotCategory === cat ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: spotCategory === cat ? '#fff' : colors.foreground,
                        fontFamily: 'Inter_500Medium',
                        fontSize: 12,
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
              <TextInput
                style={[inputStyle, { height: 70, textAlignVertical: 'top', paddingTop: 10, marginBottom: 12 }]}
                value={spotDesc}
                onChangeText={setSpotDesc}
                placeholder="Brief description..."
                placeholderTextColor={colors.mutedForeground}
                multiline
              />

              <View style={styles.coordRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>LATITUDE *</Text>
                  <TextInput
                    style={inputStyle}
                    value={spotLat}
                    onChangeText={setSpotLat}
                    placeholder="e.g. 36.8065"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>LONGITUDE *</Text>
                  <TextInput
                    style={inputStyle}
                    value={spotLng}
                    onChangeText={setSpotLng}
                    placeholder="e.g. 10.1815"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <PrimaryButton
                title={saving ? 'SAVING...' : 'ADD TO MAP'}
                onPress={handleAddSpot}
                disabled={saving || !spotName.trim() || !spotLat.trim() || !spotLng.trim()}
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          {boardGameSpots.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground, textAlign: 'center', marginTop: 24 }]}>
              No spots added yet. Add the first board game location!
            </Text>
          ) : (
            boardGameSpots.map((spot, index) => (
              <Animated.View key={spot.id} entering={FadeInDown.delay(index * 40).springify()}>
                <View style={[styles.spotRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.spotEmoji}>
                    {spot.category === 'Chess Cafe' ? '♟️' :
                     spot.category === 'Library' ? '📚' :
                     spot.category === 'Gaming Club' ? '🎲' :
                     spot.category === 'Board Game Store' ? '🏪' :
                     spot.category === 'Bar / Pub' ? '🍺' :
                     spot.category === 'Community Center' ? '🏛️' : '📍'}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.spotName, { color: colors.foreground }]}>{spot.name}</Text>
                    <Text style={[styles.spotCat, { color: colors.accent }]}>{spot.category}</Text>
                    {spot.description ? (
                      <Text style={[styles.spotDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {spot.description}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => setDeleteSpotId(spot.id)}
                    style={[styles.deleteBtn, { backgroundColor: colors.destructive + '22' }]}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmDialog
        visible={!!deleteUserId}
        title="Delete User Account"
        message="This will permanently delete this user's account, all their messages, friend data, and location info. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteUserId(null)}
      />

      <ConfirmDialog
        visible={!!deleteSpotId}
        title="Remove Spot"
        message="Are you sure you want to remove this board game spot from the map?"
        confirmLabel="Remove"
        onConfirm={handleDeleteSpot}
        onCancel={() => setDeleteSpotId(null)}
      />

      <Toast message={toastState.message} visible={toastState.visible} type={toastState.type} onHide={hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noAccess: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  userLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  userName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  userEmail: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 12, paddingHorizontal: 16 },
  addSpotForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  formLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  coordRow: { flexDirection: 'row', marginTop: 12 },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  spotEmoji: { fontSize: 28 },
  spotName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  spotCat: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  spotDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
});
