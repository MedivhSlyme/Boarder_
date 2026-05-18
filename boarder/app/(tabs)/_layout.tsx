import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme, Text } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useFriends } from "@/context/FriendsContext";

function NativeTabLayout() {
  const { isAdmin } = useAuth();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Friends</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      {isAdmin && (
        <NativeTabs.Trigger name="admin">
          <Icon sf={{ default: "shield", selected: "shield.fill" }} />
          <Label>Admin</Label>
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { isAdmin } = useAuth();
  const { receivedRequests } = useFriends();
  const pendingCount = receivedRequests.length;

  return (
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
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={24} />
            ) : (
              <Feather name="map" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2" tintColor={color} size={24} />
            ) : (
              <Feather name="users" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message" tintColor={color} size={24} />
            ) : (
              <Feather name="message-square" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Feather name="shield" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
