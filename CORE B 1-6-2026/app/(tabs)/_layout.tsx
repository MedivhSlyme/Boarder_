import { BlurView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text, useColorScheme, Image, Pressable } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventsContext";
import { useFriendRequests } from "@/context/FriendRequestsContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function NotifBadge({ count }: { count: number }) {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <View style={[badge.dot, { backgroundColor: colors.accent }]}>
      <Text style={badge.count}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  dot: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  count: { color: '#000', fontSize: 9, fontWeight: '700' },
});

export default function TabLayout() {
  const colors = useColors();
  const { currentUser } = useAuth();
  const { unreadCount: eventsUnread } = useEvents();
  const { pendingIncomingCount } = useFriendRequests();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="map" tintColor={color} size={24} /> : <Feather name="map" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color }) => (
            <View>
              {isIOS ? <SymbolView name="person.2" tintColor={color} size={24} /> : <Feather name="users" size={22} color={color} />}
              <NotifBadge count={pendingIncomingCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="message" tintColor={color} size={24} /> : <Feather name="message-square" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => (
            <View>
              {isIOS ? <SymbolView name="calendar" tintColor={color} size={24} /> : <Feather name="calendar" size={22} color={color} />}
              <NotifBadge count={eventsUnread} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranks",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="trophy" tintColor={color} size={24} /> : <Feather name="award" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: currentUser?.isAdmin ? undefined : null,
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="shield.lefthalf.filled" tintColor={color} size={24} /> : <Feather name="shield" size={22} color={color} />,
        }}
      />
    </Tabs>
    <Pressable
      onPress={() => router.push('/(tabs)/settings')}
      style={{
        position: 'absolute',
        top: insets.top + (isWeb ? 67 : 8),
        right: 16,
        zIndex: 999,
        padding: 6,
        borderRadius: 20,
      }}
    >
      <Image
        source={require('../../assets/images/icon4.png')}
        style={{ width: 28, height: 28, tintColor: colors.foreground }}
        resizeMode="contain"
      />
    </Pressable>
    </View>
  );
}
  
