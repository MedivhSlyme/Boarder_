import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Platform, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { useMessages } from '../../context/MessagesContext';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { MessageBubble } from '../../components/MessageBubble';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Avatar } from '../../components/Avatar';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { currentUser, addBoardPoints } = useAuth();
  const { allUsers, friends } = useFriends();
  const { getConversation, sendMessage, deleteConversation } = useMessages();

  const [text, setText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const messages = getConversation(id);
  const otherUser = allUsers.find((u) => u.id === id);

  const canChat = friends.some((f) => f.id === id) || currentUser?.isAdmin === true || otherUser?.isAdmin === true;

  const handleSend = () => {
    if (!text.trim() || !currentUser || !id || !canChat) return;
    sendMessage(id, text.trim());
    setText('');
  };

  const handleDeleteConversation = async () => {
    setMenuVisible(false);
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    } else {
      await new Promise<void>((resolve, reject) => {
        Alert.alert(
          'Delete Conversation',
          'All messages with this user will be permanently deleted. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => reject() },
            { text: 'Delete', style: 'destructive', onPress: () => resolve() },
          ],
        );
      }).catch(() => null);
    }
    setDeleting(true);
    try {
      await deleteConversation(id);
      router.back();
    } catch (e) {
      console.error('Error deleting conversation:', e);
    } finally {
      setDeleting(false);
    }
  };

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <PrimaryButton icon="chevron-left" onPress={() => router.back()} variant="secondary" style={styles.backBtn} />
        {otherUser && (
          <View style={styles.headerInfo}>
            <Avatar username={otherUser.username} profilePic={otherUser.profile_details?.profile_pic} size={36} />
            <Text style={[styles.username, { color: colors.foreground }]}>{otherUser.username}</Text>
          </View>
        )}
        {/* ⋮ menu */}
        <Pressable onPress={() => setMenuVisible(true)} hitSlop={8} style={styles.menuBtn}>
          <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === currentUser?.id} />
        )}
      />

      {/* ── Input bar ── */}
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? 12 : insets.bottom + 10 }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: canChat ? colors.input : colors.muted, color: colors.foreground, borderColor: colors.border }]}
          value={text}
          onChangeText={setText}
          placeholder={canChat ? 'Type a message...' : 'Friends only'}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={canChat}
        />
        <PrimaryButton icon="send" onPress={handleSend} disabled={!text.trim() || !canChat} style={styles.sendBtn} />
      </View>

      {/* ── Context menu modal ── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)} />
        <View style={[styles.menuSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={handleDeleteConversation}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
            <Text style={[styles.menuItemText, { color: colors.destructive }]}>Delete Conversation</Text>
          </Pressable>
          <Pressable onPress={() => setMenuVisible(false)} style={styles.menuItem}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
            <Text style={[styles.menuItemText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ── Delete loading overlay ── */}
      {deleting && (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, marginRight: 12 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  username: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginLeft: 12 },
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
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
