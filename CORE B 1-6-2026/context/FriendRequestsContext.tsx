import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FriendRequest } from '../models/types';
import { useAuth } from './AuthContext';

interface FriendRequestsContextType {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  pendingIncomingCount: number;
  sendRequest: (toId: string, toUsername: string) => Promise<void>;
  acceptRequest: (req: FriendRequest) => Promise<void>;
  declineRequest: (req: FriendRequest) => Promise<void>;
  hasPendingFrom: (userId: string) => boolean;
  hasSentTo: (userId: string) => boolean;
}

const FriendRequestsContext = createContext<FriendRequestsContextType | null>(null);

export function FriendRequestsProvider({ children }: { children: ReactNode }) {
  const { currentUser, firebaseUser } = useAuth();
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!currentUser) { setIncoming([]); setOutgoing([]); return; }

    const qIn = query(
      collection(db, 'friendRequests'),
      where('toId', '==', currentUser.id),
      where('status', '==', 'pending'),
    );
    const unsubIn = onSnapshot(qIn, (snap) => {
      const reqs: FriendRequest[] = [];
      snap.forEach((d) => reqs.push({ id: d.id, ...(d.data() as Omit<FriendRequest, 'id'>) }));
      setIncoming(reqs);
    });

    const qOut = query(
      collection(db, 'friendRequests'),
      where('fromId', '==', currentUser.id),
      where('status', '==', 'pending'),
    );
    const unsubOut = onSnapshot(qOut, (snap) => {
      const reqs: FriendRequest[] = [];
      snap.forEach((d) => reqs.push({ id: d.id, ...(d.data() as Omit<FriendRequest, 'id'>) }));
      setOutgoing(reqs);
    });

    return () => { unsubIn(); unsubOut(); };
  }, [currentUser?.id]);

  const sendRequest = async (toId: string, toUsername: string) => {
    if (!currentUser) return;
    const existing = await getDocs(
      query(collection(db, 'friendRequests'),
        where('fromId', '==', currentUser.id),
        where('toId', '==', toId),
        where('status', '==', 'pending'),
      )
    );
    if (!existing.empty) return;
    await addDoc(collection(db, 'friendRequests'), {
      fromId: currentUser.id,
      toId,
      fromUsername: currentUser.username,
      status: 'pending',
      createdAt: Date.now(),
    });
  };

  const acceptRequest = async (req: FriendRequest) => {
    if (!firebaseUser || !currentUser) return;
    await updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' });
    const { arrayUnion, updateDoc: upDoc, doc: d } = await import('firebase/firestore');
    await upDoc(d(db, 'users', currentUser.id), { friends: arrayUnion(req.fromId) });
    await upDoc(d(db, 'users', req.fromId), { friends: arrayUnion(currentUser.id) });
  };

  const declineRequest = async (req: FriendRequest) => {
    await updateDoc(doc(db, 'friendRequests', req.id), { status: 'declined' });
  };

  const hasPendingFrom = (userId: string) =>
    incoming.some((r) => r.fromId === userId);

  const hasSentTo = (userId: string) =>
    outgoing.some((r) => r.toId === userId);

  return (
    <FriendRequestsContext.Provider value={{
      incoming, outgoing,
      pendingIncomingCount: incoming.length,
      sendRequest, acceptRequest, declineRequest,
      hasPendingFrom, hasSentTo,
    }}>
      {children}
    </FriendRequestsContext.Provider>
  );
}

export const useFriendRequests = () => {
  const ctx = useContext(FriendRequestsContext);
  if (!ctx) throw new Error('useFriendRequests must be used within FriendRequestsProvider');
  return ctx;
};
