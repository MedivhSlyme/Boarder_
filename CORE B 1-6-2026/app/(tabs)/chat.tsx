import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  Text,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMessages } from '../../context/MessagesContext';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useGroupChats } from '../../context/GroupChatContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Tab = 'direct' | 'groups';

// ── Create-group modal ──────────────────────────────────────────────────────────
function CreateGroupModal({
  visible,
  onClose,
  onSubmit,
  friends,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, memberIds: string[]) => Promise<void>;
  friends: any[];
  colors: any;
}) {
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canCreate = groupName.trim().length > 0 && selected.size >= 2;

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      await onSubmit(groupName.trim(), Array.from(selected));
      setGroupName('');
      setSelected(new Set());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={styles.sheetHandle} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Group Chat</Text>
        <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
          Select at least 2 friends (3 members total)
        </Text>

        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Group name…"
          placeholderTextColor={colors.mutedForeground}
          value={groupName}
          onChangeText={setGroupName}
        />

        <ScrollView style={styles.friendList} showsVerticalScrollIndicator={false}>
          {friends.map((f) => {
            const isSelected = selected.has(f.id);
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => toggle(f.id)}
                style={[
                  styles.friendRow,
                  {
                    backgroundColor: isSelected ? colors.primary + '22' : colors.surfaceHigh,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Avatar username={f.username} profilePic={f.profile_details?.profile_pic} size={36} />
                <Text style={[styles.friendName, { color: colors.foreground }]}>{f.username}</Text>
                <View
                  style={[
                    styles.checkCircle,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                >
                  {isSelected && <Feather name="check" size={12} color={colors.primaryForeground} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleCreate}
          disabled={!canCreate || loading}
          style={[
            styles.createBtn,
            { backgroundColor: canCreate ? colors.primary : colors.surfaceHigh },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.createBtnText, { color: canCreate ? colors.primaryForeground : colors.mutedForeground }]}>
              Create Group ({selected.size + 1} members)
            </Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { messages } = useMessages();
  const { allUsers, friends } = useFriends();
  const { currentUser } = useAuth();
  const { groups, createGroup } = useGroupChats();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;

  const [tab, setTab] = useState<Tab>('direct');
  const [modalVisible, setModalVisible] = useState(false);

  // ── Direct conversations ────────────────────────────────────────────────────
  const conversations = useMemo(() => {
    if (!currentUser) return [];
    const latest = new Map<string, (typeof messages)[0]>();
    messages.forEach((m) => {
      const otherId = m.senderId === currentUser.id ? m.receiverId : m.senderId;
      const existing = latest.get(otherId);
      if (!existing || m.timestamp > existing.timestamp) latest.set(otherId, m);
    });
    return Array.from(latest.entries())
      .map(([otherId, lastMsg]) => ({ otherId, lastMsg, u: allUsers.find((u) => u.id === otherId) }))
      .filter((item) => item.u !== undefined)
      .sort((a, b) => b.lastMsg.timestamp - a.lastMsg.timestamp);
  }, [messages, allUsers, currentUser]);

  // ── Create group handler ────────────────────────────────────────────────────
  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    const groupId = await createGroup(name, memberIds);
    if (groupId) router.push(`/chat/group/${groupId}`);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'direct', label: 'Messages' },
    { key: 'groups', label: `Groups${groups.length > 0 ? ` (${groups.length})` : ''}` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tab,
              { borderBottomColor: tab === t.key ? colors.primary : 'transparent', borderBottomWidth: 2 },
            ]}
          >
            <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Direct messages ── */}
      {tab === 'direct' && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.otherId}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          renderItem={({ item, index }) => {
            const u = item.u!;
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                <Pressable
                  onPress={() => router.push(`/chat/${u.id}`)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Avatar username={u.username} profilePic={u.profile_details?.profile_pic} size={48} />
                  <View style={styles.content}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{u.username}</Text>
                    <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.lastMsg.text}
                    </Text>
                  </View>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {new Date(item.lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="message-square"
              title="NO MESSAGES YET"
              subtitle="Tap a player on the map to start a conversation."
            />
          }
        />
      )}

      {/* ── Group chats ── */}
      {tab === 'groups' && (
        <>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                <Pressable
                  onPress={() => router.push(`/chat/group/${item.id}`)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: item.eventId ? colors.primary + '66' : colors.border,
                      borderWidth: item.eventId ? 1.5 : 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.groupIcon, { backgroundColor: colors.primary + '22' }]}>
                    <Feather
                      name={item.eventId ? 'calendar' : 'users'}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.content}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.preview, { color: colors.mutedForeground }]}>
                      {item.memberIds.length} members
                      {item.eventId ? ' · Event group' : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              </Animated.View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="users"
                title="NO GROUP CHATS"
                subtitle="Create a group to chat with 3 or more friends."
              />
            }
          />

          {/* FAB – create new group */}
          <Pressable
            onPress={() => setModalVisible(true)}
            style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 100 }]}
          >
            <Feather name="plus" size={24} color={colors.primaryForeground} />
          </Pressable>
        </>
      )}

      <CreateGroupModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateGroup}
        friends={friends}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingTop: 8, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  content: { flex: 1, marginLeft: 12 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 3 },
  preview: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  time: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  // Modal
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 4 },
  sheetSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 16 },
  nameInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 14,
  },
  friendList: { maxHeight: 280, marginBottom: 16 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  friendName: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});
