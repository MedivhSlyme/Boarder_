import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { MatchRequest } from '../models/types';
import { useAuth } from './AuthContext';
import { useMessages } from './MessagesContext';

interface MatchRequestContextType {
  pendingRequests: MatchRequest[];
  submitMatchRequest: (toId: string, toName: string, outcome: 'win' | 'loss', game: string) => Promise<void>;
  acceptRequest: (req: MatchRequest) => Promise<void>;
  declineRequest: (reqId: string) => Promise<void>;
}

const MatchRequestContext = createContext<MatchRequestContextType | null>(null);

export function MatchRequestProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { recordMatch } = useMessages();
  const [pendingRequests, setPendingRequests] = useState<MatchRequest[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'matchRequests'),
      where('toId', '==', currentUser.id),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      const out: MatchRequest[] = [];
      snap.forEach(d => out.push({ id: d.id, ...d.data() } as MatchRequest));
      setPendingRequests(out.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, [currentUser?.id]);

  const submitMatchRequest = async (toId: string, toName: string, outcome: 'win' | 'loss', game: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'matchRequests'), {
      fromId: currentUser.id,
      fromName: currentUser.username,
      toId,
      toName,
      game,
      outcome,
      status: 'pending',
      createdAt: Date.now(),
    });
  };

  const acceptRequest = async (req: MatchRequest) => {
    if (!currentUser) return;
    
    // 1. Mark the request as accepted
    await updateDoc(doc(db, 'matchRequests', req.id), { status: 'accepted' });

    // 2. Calculate the correct point distributions
    let senderPointsAllocation = 0;   // Points for User A (Sender)
    let receiverPointsAllocation = 0; // Points for User B (Receiver)

    if (req.outcome === 'win') {
      // User A claims they won
      senderPointsAllocation = 2.5;
      receiverPointsAllocation = 1.0;
    } else {
      // User A claims they lost
      senderPointsAllocation = 1.0;
      receiverPointsAllocation = 2.5;
    }

    // 3. Atomically update both users directly in Firestore
    const senderDocRef = doc(db, 'users', req.fromId);
    const receiverDocRef = doc(db, 'users', req.toId);

    await updateDoc(senderDocRef, {
      boardPoints: increment(senderPointsAllocation)
    });

    await updateDoc(receiverDocRef, {
      boardPoints: increment(receiverPointsAllocation)
    });

    // 4. Log the visual chat history notification bubble
    // We pass an empty callback () => {} so recordMatch doesn't double-allocate points
    const receiverOutcome = req.outcome === 'win' ? 'loss' : 'win';
    await recordMatch(req.fromId, req.fromName, receiverOutcome, req.game, async (_uid, _pts) => {});
  };

  const declineRequest = async (reqId: string) => {
    // Updates status only; awards 0 points as intended
    await updateDoc(doc(db, 'matchRequests', reqId), { status: 'declined' });
  };

  return (
    <MatchRequestContext.Provider value={{ pendingRequests, submitMatchRequest, acceptRequest, declineRequest }}>
      {children}
    </MatchRequestContext.Provider>
  );
}

export const useMatchRequests = () => {
  const ctx = useContext(MatchRequestContext);
  if (!ctx) throw new Error('useMatchRequests must be used within Provider');
  return ctx;
};