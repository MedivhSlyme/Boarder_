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
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Message } from '../models/types';
import { useAuth } from './AuthContext';

interface MessagesContextType {
  messages: Message[];
  sendMessage: (recipientId: string, text: string) => Promise<void>;
  getConversation: (otherId: string) => Message[];
  deleteConversation: (otherId: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

function pairId(a: string, b: string) {
  return [a, b].sort().join('__');
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { currentUser, firebaseUser } = useAuth();
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
        // Filter out conversations hidden by current user
        const hiddenConversations = data.hiddenBy || [];
        if (!hiddenConversations.includes(currentUser.id)) {
          out.push({
            id: d.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text,
            timestamp: ts,
            isVoiceMessage: data.isVoiceMessage || false,
            voiceUrl: data.voiceUrl,
            voiceDuration: data.voiceDuration,
          });
        }
      });
      setMessages(out);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const sendMessage = async (recipientId: string, text: string) => {
    if (!currentUser || !firebaseUser) return;
    await addDoc(collection(db, 'messages'), {
      conversationId: pairId(currentUser.id, recipientId),
      senderId: currentUser.id,
      receiverId: recipientId,
      text,
      timestamp: serverTimestamp(),
      hiddenBy: [],
      isVoiceMessage: false,
    });
  };

  const getConversation = (otherId: string): Message[] => {
    if (!currentUser) return [];
    const cid = pairId(currentUser.id, otherId);
    return messages.filter((m) => m.conversationId === cid).sort((a, b) => b.timestamp - a.timestamp);
  };

  const deleteConversation = async (otherId: string) => {
    if (!currentUser || !firebaseUser) return;
    const conversationId = pairId(currentUser.id, otherId);

    // Create a hidden conversation record instead of deleting
    // This marks the conversation as hidden for the current user only
    const hiddenConversationsRef = doc(db, 'users', currentUser.id);
    await updateDoc(hiddenConversationsRef, {
      hiddenConversations: arrayUnion(conversationId),
    }).catch(async () => {
      // If field doesn't exist, it will be created by arrayUnion
      // But we catch in case of other errors
    });
  };

  return (
    <MessagesContext.Provider value={{ messages, sendMessage, getConversation, deleteConversation }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
