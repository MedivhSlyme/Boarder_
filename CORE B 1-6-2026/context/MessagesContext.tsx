import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  or,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Message } from '../models/types';
import { useAuth } from './AuthContext';

interface MessagesContextType {
  messages: Message[];
  sendMessage: (recipientId: string, text: string) => Promise<void>;
  recordMatch: (
    opponentId: string,
    opponentName: string,
    outcome: 'win' | 'loss',
    game: string,
    addPoints: (uid: string, pts: number) => Promise<void>,
  ) => Promise<void>;
  getConversation: (otherId: string) => Message[];
  deleteConversation: (otherId: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

function pairId(a: string, b: string) {
  return [a, b].sort().join('__');
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!currentUser) { setMessages([]); return; }
    const q = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', currentUser.id),
        where('receiverId', '==', currentUser.id),
      ),
      orderBy('timestamp', 'asc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const out: Message[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp ?? Date.now();
        out.push({
          id: d.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text ?? '',
          timestamp: ts,
          type: data.type ?? 'text',
          audioUrl: data.audioUrl ?? undefined,
        });
      });
      setMessages(out);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const sendMessage = async (recipientId: string, text: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'messages'), {
      conversationId: pairId(currentUser.id, recipientId),
      senderId: currentUser.id,
      receiverId: recipientId,
      text,
      type: 'text',
      timestamp: serverTimestamp(),
    });
  };

  const recordMatch = async (
    opponentId: string,
    opponentName: string,
    outcome: 'win' | 'loss',
    game: string,
    addPoints: (uid: string, pts: number) => Promise<void>,
  ) => {
    if (!currentUser) return;
    const isWin = outcome === 'win';
    const winnerId = isWin ? currentUser.id : opponentId;
    const loserId = isWin ? opponentId : currentUser.id;
    const winnerName = isWin ? currentUser.username : opponentName;
    const loserName = isWin ? opponentName : currentUser.username;

    await addDoc(collection(db, 'matches'), {
      winnerId, loserId, winnerName, loserName,
      game: game || 'Board Game',
      timestamp: Date.now(),
    });

    await addPoints(currentUser.id, isWin ? 3 : 1);

    const resultText = isWin
      ? `🏆 Match recorded: ${currentUser.username} beat ${opponentName} at ${game || 'Board Game'}! (+3 pts)`
      : `📋 Match recorded: ${currentUser.username} lost to ${opponentName} at ${game || 'Board Game'}. (+1 pt)`;

    await addDoc(collection(db, 'messages'), {
      conversationId: pairId(currentUser.id, opponentId),
      senderId: currentUser.id,
      receiverId: opponentId,
      text: resultText,
      type: 'text',
      timestamp: serverTimestamp(),
    });
  };

  const getConversation = (otherId: string): Message[] => {
    if (!currentUser) return [];
    const cid = pairId(currentUser.id, otherId);
    return messages.filter((m) => m.conversationId === cid).sort((a, b) => b.timestamp - a.timestamp);
  };

  /**
   * Delete all messages in the conversation with otherId.
   * Uses a Firestore batched write (max 500 ops per batch).
   */
  const deleteConversation = async (otherId: string) => {
    if (!currentUser) return;
    const cid = pairId(currentUser.id, otherId);
    const snap = await getDocs(
      query(collection(db, 'messages'), where('conversationId', '==', cid)),
    );
    if (snap.empty) return;

    // Split into batches of 500
    const chunks: typeof snap.docs[] = [];
    for (let i = 0; i < snap.docs.length; i += 500) {
      chunks.push(snap.docs.slice(i, i + 500));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(doc(db, 'messages', d.id)));
      await batch.commit();
    }
  };

  return (
    <MessagesContext.Provider value={{ messages, sendMessage, recordMatch, getConversation, deleteConversation }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
