import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';
import { useColors } from '../../hooks/useColors';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { Toast, useToast } from '../../components/Toast';
import { getSuggestedFriends } from '../../lib/mlRecommendations';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function DiscoverScreen() {
  const { currentUser } = useAuth();
  const { allUsers, sendFriendRequest } = useFriends();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top + 20;
  const { toastState, show, hide } = useToast();

  const suggestions = useMemo(() => {
    if (!currentUser) return [];
    return getSuggestedFriends(currentUser, allUsers, 20);
  }, [currentUser, allUsers]);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      show('Friend request sent!', 'success');
    } catch {
      show('Failed to send request', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Feather name="sparkles" size={22} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>DISCOVER</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{suggestions.length} suggestions</Text>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>Smart Recommendations</Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Powered by collaborative filtering. Suggestions are based on shared games, skill level, location, and mutual friends.
        </Text>
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <View style={[styles.suggestionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable
                style={styles.userInfo}
                onPress={() => router.push(`/user/${item.id}`)}
              >
                <Avatar username={item.username} profilePic={item.profile_details?.profile_pic} size={56} />
                <View style={styles.details}>
                  <Text style={[styles.username, { color: colors.foreground }]}>{item.username}</Text>
                  <Text style={[styles.games, { color: colors.mutedForeground }]}>
                    {item.games?.length || 0} game{item.games?.length !== 1 ? 's' : ''}
                  </Text>
                  {item.profile_details?.bio && (
                    <Text style={[styles.bio, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.profile_details.bio}
                    </Text>
                  )}
                </View>
              </Pressable>
              <PrimaryButton
                title="Add"
                onPress={() => handleSendRequest(item.id)}
                style={styles.addBtn}
              />
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title="NO SUGGESTIONS YET"
            subtitle="Complete your profile and play more games to get better recommendations."
          />
        }
      />

      <Toast message={toastState.message} visible={toastState.visible} type={toastState.type} onHide={hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 1, flex: 1 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  infoCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 4 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  details: { marginLeft: 12, flex: 1 },
  username: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  games: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 2 },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  addBtn: { height: 40, width: 80, marginLeft: 8 },
});
