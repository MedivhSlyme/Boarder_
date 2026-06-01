import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User, NearbyPlayer, SuggestedPlayer } from '../models/types';
import { useAuth } from './AuthContext';
import { getSuggestions } from '../lib/suggestions';

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 *
      Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180);
  return 2 * R * Math.asin(Math.sqrt(x));
}

interface FriendsContextType {
  friends: User[];
  allUsers: User[];
  suggestions: SuggestedPlayer[];
  addFriend: (userId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  nearbyPlayers: NearbyPlayer[];
  updateUserLocation: (lat: number, lng: number) => void;
  myLocation: { lat: number; lng: number } | null;
}

const FriendsContext = createContext<FriendsContextType | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { currentUser, firebaseUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!firebaseUser) { setAllUsers([]); return; }
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const users: User[] = [];
      snap.forEach((d) => users.push({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
      setAllUsers(users);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  const friends = useMemo<User[]>(() => {
    if (!currentUser) return [];
    const ids = new Set(currentUser.friends ?? []);
    return allUsers.filter((u) => ids.has(u.id));
  }, [allUsers, currentUser?.friends]);

  const nearbyPlayers = useMemo<NearbyPlayer[]>(() => {
    if (!currentUser) return [];
    const center = origin ?? currentUser.location;
    return allUsers
      .filter((u) => u.id !== currentUser.id && u.active && u.location)
      .map<NearbyPlayer>((u) => ({
        id: u.id,
        username: u.username,
        profile_pic: u.profile_details?.profile_pic ?? '',
        games: u.games ?? [],
        location: u.location,
        distanceKm: haversineKm(center, u.location),
        active: u.active,
        last_seen_on: u.last_seen_on,
        boardPoints: u.boardPoints ?? 0,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allUsers, currentUser?.id, currentUser?.location, origin]);

  const suggestions = useMemo<SuggestedPlayer[]>(() => {
    if (!currentUser) return [];
    const loc = origin ?? currentUser.location;
    return getSuggestions(currentUser, allUsers, loc);
  }, [allUsers, currentUser, origin]);

  const updateUserLocation = (lat: number, lng: number) => {
    setOrigin({ lat, lng });
    if (firebaseUser) {
      updateDoc(doc(db, 'users', firebaseUser.uid), {
        location: { lat, lng },
        active: true,
        last_seen_on: new Date().toISOString(),
      }).catch(() => {});
    }
  };

  // Fixed to add friends mutually on both user documents
  const addFriend = async (userId: string) => {
    if (!firebaseUser || !currentUser) return;
    if (currentUser.friends?.includes(userId)) return;
    
    const myId = firebaseUser.uid;
    await Promise.all([
      updateDoc(doc(db, 'users', myId), { friends: arrayUnion(userId) }),
      updateDoc(doc(db, 'users', userId), { friends: arrayUnion(myId) })
    ]);
  };

  // Fixed to remove friends mutually from both user documents
  const removeFriend = async (userId: string) => {
    if (!firebaseUser) return;
    
    const myId = firebaseUser.uid;
    await Promise.all([
      updateDoc(doc(db, 'users', myId), { friends: arrayRemove(userId) }),
      updateDoc(doc(db, 'users', userId), { friends: arrayRemove(myId) })
    ]);
  };

  return (
    <FriendsContext.Provider value={{ friends, allUsers, suggestions, addFriend, removeFriend, nearbyPlayers, updateUserLocation, myLocation: origin }}>
      {children}
    </FriendsContext.Provider>
  );
}

export const useFriends = () => {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within FriendsProvider');
  return ctx;
};