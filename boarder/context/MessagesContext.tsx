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
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Message } from '../models/types';
import { useAuth } from './AuthContext';

interface MessagesContextType {
  messages: Message[];
  sendMessage: (recipientId: string, text: string) => Promise<void>;
  getConversation: (otherId: string) => Message[];
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
          text: data.text,
          timestamp: ts,
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
      timestamp: serverTimestamp(),
    });
  };

  const getConversation = (otherId: string): Message[] => {
    if (!currentUser) return [];
    const cid = pairId(currentUser.id, otherId);
    return messages.filter((m) => m.conversationId === cid).sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <MessagesContext.Provider value={{ messages, sendMessage, getConversation }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
