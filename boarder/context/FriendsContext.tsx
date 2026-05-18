import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User, NearbyPlayer, FriendRequest, BlockedUser, BoardGameSpot } from '../models/types';
import { useAuth } from './AuthContext';

interface FriendsContextType {
  friends: User[];
  allUsers: User[];
  nearbyPlayers: NearbyPlayer[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  blockedUserIds: string[];
  boardGameSpots: BoardGameSpot[];
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  denyFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  getFriendStatus: (userId: string) => 'friend' | 'sent' | 'received' | 'blocked' | 'none';
  updateUserLocation: (lat: number, lng: number) => void;
  addBoardGameSpot: (spot: Omit<BoardGameSpot, 'id' | 'createdBy' | 'createdAt'>) => Promise<void>;
  deleteBoardGameSpot: (spotId: string) => Promise<void>;
  deleteUserAccount: (userId: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | null>(null);

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

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { currentUser, firebaseUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allRequests, setAllRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [boardGameSpots, setBoardGameSpots] = useState<BoardGameSpot[]>([]);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);

  // Subscribe to all users
  useEffect(() => {
    if (!firebaseUser) { setAllUsers([]); return; }
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const users: User[] = [];
      snap.forEach((d) => users.push({ id: d.id, ...(d.data() as Omit<User, 'id'>) }));
      setAllUsers(users);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // Subscribe to friend requests involving current user (two queries merged)
  useEffect(() => {
    if (!firebaseUser) { setAllRequests([]); return; }
    const uid = firebaseUser.uid;

    let sentData: FriendRequest[] = [];
    let receivedData: FriendRequest[] = [];

    const merge = () => {
      const map = new Map<string, FriendRequest>();
      [...sentData, ...receivedData].forEach((r) => map.set(r.id, r));
      setAllRequests(Array.from(map.values()));
    };

    const qSent = query(collection(db, 'friendRequests'), where('fromId', '==', uid));
    const qReceived = query(collection(db, 'friendRequests'), where('toId', '==', uid));

    const unsubSent = onSnapshot(qSent, (snap) => {
      sentData = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          fromId: data.fromId,
          toId: data.toId,
          status: data.status,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt ?? Date.now(),
        };
      });
      merge();
    });

    const unsubReceived = onSnapshot(qReceived, (snap) => {
      receivedData = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          fromId: data.fromId,
          toId: data.toId,
          status: data.status,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt ?? Date.now(),
        };
      });
      merge();
    });

    return () => { unsubSent(); unsubReceived(); };
  }, [firebaseUser?.uid]);

  // Subscribe to blocked users
  useEffect(() => {
    if (!firebaseUser) { setBlockedUsers([]); return; }
    const uid = firebaseUser.uid;
    const q = query(collection(db, 'blockedUsers'), where('blockerId', '==', uid));
    const unsub = onSnapshot(q, (snap) => {
      const list: BlockedUser[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          blockerId: data.blockerId,
          blockedId: data.blockedId,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt ?? Date.now(),
        };
      });
      setBlockedUsers(list);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // Subscribe to board game spots
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'boardGameSpots'), (snap) => {
      const spots: BoardGameSpot[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name,
          category: data.category,
          description: data.description,
          location: data.location,
          imageUrl: data.imageUrl ?? '',
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt ?? Date.now(),
        };
      });
      setBoardGameSpots(spots);
    });
    return () => unsub();
  }, []);

  const blockedUserIds = useMemo(
    () => blockedUsers.map((b) => b.blockedId),
    [blockedUsers]
  );

  const sentRequests = useMemo(
    () => allRequests.filter((r) => r.fromId === currentUser?.id && r.status === 'pending'),
    [allRequests, currentUser?.id]
  );

  const receivedRequests = useMemo(
    () => allRequests.filter((r) => r.toId === currentUser?.id && r.status === 'pending'),
    [allRequests, currentUser?.id]
  );

  const friends = useMemo<User[]>(() => {
    if (!currentUser) return [];
    const acceptedIds = new Set(
      allRequests
        .filter(
          (r) =>
            r.status === 'accepted' &&
            (r.fromId === currentUser.id || r.toId === currentUser.id)
        )
        .map((r) => (r.fromId === currentUser.id ? r.toId : r.fromId))
    );
    return allUsers.filter((u) => acceptedIds.has(u.id));
  }, [allRequests, allUsers, currentUser?.id]);

  const nearbyPlayers = useMemo<NearbyPlayer[]>(() => {
    if (!currentUser) return [];
    const center = origin ?? currentUser.location;
    return allUsers
      .filter(
        (u) =>
          u.id !== currentUser.id &&
          u.active &&
          u.location &&
          !blockedUserIds.includes(u.id)
      )
      .map<NearbyPlayer>((u) => ({
        id: u.id,
        username: u.username,
        profile_pic: u.profile_details?.profile_pic ?? '',
        games: u.games ?? [],
        location: u.location,
        distanceKm: haversineKm(center, u.location),
        active: u.active,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allUsers, currentUser?.id, currentUser?.location, origin, blockedUserIds]);

  const getFriendStatus = (userId: string): 'friend' | 'sent' | 'received' | 'blocked' | 'none' => {
    if (!currentUser) return 'none';
    if (blockedUserIds.includes(userId)) return 'blocked';
    const req = allRequests.find(
      (r) =>
        (r.fromId === currentUser.id && r.toId === userId) ||
        (r.toId === currentUser.id && r.fromId === userId)
    );
    if (!req) return 'none';
    if (req.status === 'accepted') return 'friend';
    if (req.status === 'pending' && req.fromId === currentUser.id) return 'sent';
    if (req.status === 'pending' && req.toId === currentUser.id) return 'received';
    return 'none';
  };

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

  const sendFriendRequest = async (userId: string) => {
    if (!currentUser || !firebaseUser) return;
    if (blockedUserIds.includes(userId)) return;
    // Prevent duplicates
    const existing = allRequests.find(
      (r) =>
        (r.fromId === currentUser.id && r.toId === userId) ||
        (r.fromId === userId && r.toId === currentUser.id)
    );
    if (existing) return;
    await addDoc(collection(db, 'friendRequests'), {
      fromId: currentUser.id,
      toId: userId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    // Create notification for recipient
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'friend_request',
      fromId: currentUser.id,
      fromUsername: currentUser.username,
      read: false,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  };

  const acceptFriendRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
  };

  const denyFriendRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'denied' });
  };

  const removeFriend = async (userId: string) => {
    if (!currentUser) return;
    const req = allRequests.find(
      (r) =>
        r.status === 'accepted' &&
        ((r.fromId === currentUser.id && r.toId === userId) ||
          (r.fromId === userId && r.toId === currentUser.id))
    );
    if (req) {
      await deleteDoc(doc(db, 'friendRequests', req.id));
    }
  };

  const blockUser = async (userId: string) => {
    if (!currentUser || !firebaseUser) return;
    // Remove existing friendship or requests
    await removeFriend(userId);
    // Check if already blocked
    const alreadyBlocked = blockedUsers.some((b) => b.blockedId === userId);
    if (!alreadyBlocked) {
      await addDoc(collection(db, 'blockedUsers'), {
        blockerId: currentUser.id,
        blockedId: userId,
        createdAt: serverTimestamp(),
      });
    }
    // Remove any pending requests
    const pendingReqs = allRequests.filter(
      (r) =>
        r.status === 'pending' &&
        ((r.fromId === currentUser.id && r.toId === userId) ||
          (r.fromId === userId && r.toId === currentUser.id))
    );
    for (const req of pendingReqs) {
      await deleteDoc(doc(db, 'friendRequests', req.id)).catch(() => {});
    }
  };

  const unblockUser = async (userId: string) => {
    if (!currentUser) return;
    const block = blockedUsers.find((b) => b.blockedId === userId);
    if (block) {
      await deleteDoc(doc(db, 'blockedUsers', block.id));
    }
  };

  const addBoardGameSpot = async (spot: Omit<BoardGameSpot, 'id' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'boardGameSpots'), {
      ...spot,
      createdBy: currentUser.id,
      createdAt: serverTimestamp(),
    });
  };

  const deleteBoardGameSpot = async (spotId: string) => {
    await deleteDoc(doc(db, 'boardGameSpots', spotId));
  };

  const deleteUserAccount = async (userId: string) => {
    if (!currentUser?.isAdmin) return;

    // Delete all friend requests involving this user
    const qFrom = query(collection(db, 'friendRequests'), where('fromId', '==', userId));
    const qTo = query(collection(db, 'friendRequests'), where('toId', '==', userId));
    const [fromSnap, toSnap] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
    const deletions: Promise<any>[] = [];
    fromSnap.forEach((d) => deletions.push(deleteDoc(d.ref)));
    toSnap.forEach((d) => deletions.push(deleteDoc(d.ref)));

    // Delete blocked users involving this user
    const qBlock1 = query(collection(db, 'blockedUsers'), where('blockerId', '==', userId));
    const qBlock2 = query(collection(db, 'blockedUsers'), where('blockedId', '==', userId));
    const [b1, b2] = await Promise.all([getDocs(qBlock1), getDocs(qBlock2)]);
    b1.forEach((d) => deletions.push(deleteDoc(d.ref)));
    b2.forEach((d) => deletions.push(deleteDoc(d.ref)));

    // Delete messages involving this user
    const qMsgSent = query(collection(db, 'messages'), where('senderId', '==', userId));
    const qMsgRecv = query(collection(db, 'messages'), where('receiverId', '==', userId));
    const [ms, mr] = await Promise.all([getDocs(qMsgSent), getDocs(qMsgRecv)]);
    ms.forEach((d) => deletions.push(deleteDoc(d.ref)));
    mr.forEach((d) => deletions.push(deleteDoc(d.ref)));

    // Delete notifications for/from this user
    const qNotif = query(collection(db, 'notifications'), where('userId', '==', userId));
    const qNotifFrom = query(collection(db, 'notifications'), where('fromId', '==', userId));
    const [n1, n2] = await Promise.all([getDocs(qNotif), getDocs(qNotifFrom)]);
    n1.forEach((d) => deletions.push(deleteDoc(d.ref)));
    n2.forEach((d) => deletions.push(deleteDoc(d.ref)));

    await Promise.all(deletions);

    // Delete user Firestore document
    await deleteDoc(doc(db, 'users', userId));
  };

  return (
    <FriendsContext.Provider
      value={{
        friends,
        allUsers,
        nearbyPlayers,
        sentRequests,
        receivedRequests,
        blockedUserIds,
        boardGameSpots,
        sendFriendRequest,
        acceptFriendRequest,
        denyFriendRequest,
        removeFriend,
        blockUser,
        unblockUser,
        getFriendStatus,
        updateUserLocation,
        addBoardGameSpot,
        deleteBoardGameSpot,
        deleteUserAccount,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export const useFriends = () => {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within FriendsProvider');
  return ctx;
};
