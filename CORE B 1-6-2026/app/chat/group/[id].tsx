import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Platform, Pressable, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { useGroupChats } from '../../../context/GroupChatContext';
import { useColors } from '../../../hooks/useColors';
import { MessageBubble } from '../../../components/MessageBubble';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { GroupMessage } from '../../../models/types';
import { Feather } from '@expo/vector-icons';

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { groups, leaveGroup } = useGroupChats();

  const [text, setText] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const group = groups.find((g) => g.id === id);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, `groupChats/${id}/messages`), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const out: GroupMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        out.push({ id: d.id, ...data, timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now() } as GroupMessage);
      });
      setMessages(out);
    });
    return () => unsub();
  }, [id]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser || !id) return;
    await addDoc(collection(db, `groupChats/${id}/messages`), {
      senderId: currentUser.id,
      senderName: currentUser.username,
      text: text.trim(),
      timestamp: serverTimestamp(),
    });
    setText('');
  };

  const handleLeaveGroup = async () => {
    setMenuVisible(false);
    const confirmed = await new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm('Leave this group? It will be removed from your chat list.'));
      } else {
        Alert.alert(
          'Leave Group',
          'This group will be removed from your chat list. Other members will remain.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Leave', style: 'destructive', onPress: () => resolve(true) },
          ],
        );
      }
    });
    if (!confirmed || !id) return;
    try {
      await leaveGroup(id);
      router.back();
    } catch (e) {
      console.error('Error leaving group:', e);
    }
  };

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={0}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <PrimaryButton icon="chevron-left" onPress={() => router.back()} variant="secondary" style={styles.backBtn} />
        <View style={styles.headerInfo}>
          <View style={[styles.groupAvatar, { backgroundColor: colors.primary + '33' }]}>
            <Feather name="users" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.groupName, { color: colors.foreground }]}>{group?.name || 'Group Chat'}</Text>
            {group && (
              <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
                {group.memberIds.length} members
              </Text>
            )}
          </View>
        </View>
        {/* ⋮ menu */}
        <Pressable onPress={() => setMenuVisible(true)} hitSlop={8} style={styles.menuBtn}>
          <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MessageBubble
            message={item as any}
            isOwn={item.senderId === currentUser?.id}
            showSenderName={item.senderId !== currentUser?.id}
          />
        )}
      />

      {/* ── Input bar ── */}
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 12 : insets.bottom + 10 }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
          value={text}
          onChangeText={setText}
          placeholder="Message group..."
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <PrimaryButton icon="send" onPress={handleSend} disabled={!text.trim()} style={styles.sendBtn} />
      </View>

      {/* ── Context menu modal ── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)} />
        <View style={[styles.menuSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={handleLeaveGroup} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.menuItemText, { color: colors.destructive }]}>Leave Group</Text>
          </Pressable>
          <Pressable onPress={() => setMenuVisible(false)} style={styles.menuItem}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
            <Text style={[styles.menuItemText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, marginRight: 12 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  groupAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  memberCount: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  menuBtn: { padding: 8 },
  list: { paddingHorizontal: 16, paddingVertical: 16 },
  inputRow: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1, alignItems: 'center', gap: 6 },
  input: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, paddingHorizontal: 20, fontFamily: 'Inter_500Medium', fontSize: 15 },
  sendBtn: { width: 48, height: 48, borderRadius: 24 },
  menuOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  menuSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, paddingBottom: 32,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderBottomWidth: 1 },
  menuItemText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
