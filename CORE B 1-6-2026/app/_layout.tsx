import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SplashOverlay } from "@/components/SplashOverlay";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FriendsProvider } from "@/context/FriendsContext";
import { FriendRequestsProvider } from "@/context/FriendRequestsContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { EventsProvider } from "@/context/EventsContext";
import { SpotsProvider } from "@/context/SpotsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ThemeName } from "@/constants/colors";
import { GroupChatProvider } from "@/context/GroupChatContext";
import { MatchRequestProvider } from "@/context/MatchRequestContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ThemeSync() {
  const { currentUser } = useAuth();
  const { setTheme, themeName } = useTheme();
  useEffect(() => {
    const saved = (currentUser as any)?.theme as ThemeName | undefined;
    if (saved && saved !== themeName) setTheme(saved);
  }, [currentUser?.id]);
  return null;
}

function ProtectedStack() {
  const { currentUser, isLoading, isSplashing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!currentUser && !inAuth) router.replace("/(auth)/login");
    else if (currentUser && inAuth) router.replace("/(tabs)");
  }, [currentUser, isLoading, segments]);

  return (
    <>
      <ThemeSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="chat/[id]" />
        {/* ADDED: Registered the group chat dynamic route */}
        <Stack.Screen name="chat/group/[id]" /> 
        <Stack.Screen name="edit-profile" />
      </Stack>
      <SplashOverlay visible={isSplashing} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <ThemeProvider>
              <ErrorBoundary>
                <AuthProvider>
                  <FriendsProvider>
                    <FriendRequestsProvider>
                      <MessagesProvider>
                        <EventsProvider>
                          <SpotsProvider>
                            {/* 
                              ADDED: Wrapped the ProtectedStack in both new providers. 
                              Nesting them here ensures they safely have access to Auth, 
                              Friends, and Message context upstream.
                            */}
                            <GroupChatProvider>
                              <MatchRequestProvider>
                                <ProtectedStack />
                              </MatchRequestProvider>
                            </GroupChatProvider>
                          </SpotsProvider>
                        </EventsProvider>
                      </MessagesProvider>
                    </FriendRequestsProvider>
                  </FriendsProvider>
                </AuthProvider>
              </ErrorBoundary>
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}