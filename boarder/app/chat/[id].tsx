import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useMessages } from '../../context/MessagesContext';
import { useFriends } from '../../context/FriendsContext';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { MessageBubble } from '../../components/MessageBubble';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Toast, useToast } from '../../components/Toast';
import { Feather } from '@expo/vector-icons';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toastState, show, hide } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { currentUser } = useAuth();
  const { allUsers, getFriendStatus, blockedUserIds } = useFriends();
  const { getConversation, sendMessage, deleteConversation } = useMessages();

  const [text, setText] = useState('');

  const messages = getConversation(id);
  const otherUser = allUsers.find((u) => u.id === id);
  const status = getFriendStatus(id);
  const isFriend = status === 'friend';
  const isBlocked = blockedUserIds.includes(id);
  const canChat = isFriend && !isBlocked;

  const handleSend = async () => {
    if (!text.trim() || !canChat) return;
    const msg = text.trim();
    setText('');
    await sendMessage(id, msg);
  };

  const handleDeleteConversation = async () => {
    try {
      await deleteConversation(id);
      show('Conversation hidden from your view', 'success');
      setShowDeleteConfirm(false);
      setTimeout(() => router.back(), 500);
    } catch (error) {
      show('Failed to delete conversation', 'error');
    }
  };

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.header,
            { paddingTop: topInset + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <PrimaryButton icon="chevron-left" onPress={() => router.back()} variant="secondary" style={styles.backBtn} />
          {otherUser && (
            <View style={styles.headerInfo}>
              <Avatar
                username={otherUser.username}
                profilePic={otherUser.profile_details?.profile_pic}
                size={36}
              />
              <Text style={[styles.username, { color: colors.foreground }]}>{otherUser.username}</Text>
            </View>
          )}
          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </Pressable>
        </View>

        {!canChat && (
          <View style={[styles.lockedBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
              {isBlocked
                ? 'You have blocked this user.'
                : 'You can only chat with friends. Send them a friend request first.'}
            </Text>
          </View>
        )}

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
          ListEmptyComponent={
            canChat ? (
              <View style={styles.emptyChat}>
                <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
                  Start the conversation with {otherUser?.username ?? 'this player'}!
                </Text>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.inputRow,
            { paddingBottom: insets.bottom + 12, backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: canChat ? colors.input : colors.input,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
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
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Hide Conversation"
        message="This conversation will be hidden from your view. Messages will not be deleted."
        confirmLabel="Hide"
        onConfirm={handleDeleteConversation}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <Toast message={toastState.message} visible={toastState.visible} type={toastState.type} onHide={hide} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, marginRight: 12 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  username: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginLeft: 12 },
  menuBtn: { padding: 8 },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lockedText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  list: { paddingHorizontal: 16, paddingVertical: 16 },
  emptyChat: { alignItems: 'center', paddingVertical: 40 },
  emptyChatText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginRight: 12,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24 },
});
