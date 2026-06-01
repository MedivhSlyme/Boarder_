import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  limit,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { GroupChat } from '../models/types';
import { useAuth } from './AuthContext';

interface GroupChatContextType {
  groups: GroupChat[];
  createGroup: (name: string, memberIds: string[], eventId?: string) => Promise<string>;
  getOrCreateEventGroup: (eventId: string, eventTitle: string, attendeeIds: string[]) => Promise<string>;
  leaveGroup: (groupId: string) => Promise<void>;
}

const GroupChatContext = createContext<GroupChatContextType | null>(null);

export function GroupChatProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<GroupChat[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'groupChats'),
      where('memberIds', 'array-contains', currentUser.id),
    );
    const unsub = onSnapshot(q, (snap) => {
      const out: GroupChat[] = [];
      snap.forEach((d) => out.push({ id: d.id, ...d.data() } as GroupChat));
      setGroups(out.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, [currentUser?.id]);

  const createGroup = async (name: string, memberIds: string[], eventId?: string): Promise<string> => {
    if (!currentUser) return '';
    const allMembers = Array.from(new Set([...memberIds, currentUser.id]));
    const docRef = await addDoc(collection(db, 'groupChats'), {
      name,
      memberIds: allMembers,
      createdBy: currentUser.id,
      createdAt: Date.now(),
      eventId: eventId ?? null,
    });
    return docRef.id;
  };

  const getOrCreateEventGroup = async (
    eventId: string,
    eventTitle: string,
    attendeeIds: string[],
  ): Promise<string> => {
    if (!currentUser) return '';
    const existing = await getDocs(
      query(collection(db, 'groupChats'), where('eventId', '==', eventId), limit(1)),
    );
    if (!existing.empty) return existing.docs[0].id;
    const allMembers = Array.from(new Set([...attendeeIds, currentUser.id]));
    const docRef = await addDoc(collection(db, 'groupChats'), {
      name: eventTitle,
      memberIds: allMembers,
      createdBy: currentUser.id,
      createdAt: Date.now(),
      eventId,
    });
    return docRef.id;
  };

  /**
   * Remove current user from a group's memberIds.
   * The group remains in Firestore for other members; the onSnapshot
   * listener (which filters by array-contains) will stop returning it
   * automatically, removing it from the local groups list.
   */
  const leaveGroup = async (groupId: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'groupChats', groupId), {
      memberIds: arrayRemove(currentUser.id),
    });
  };

  return (
    <GroupChatContext.Provider value={{ groups, createGroup, getOrCreateEventGroup, leaveGroup }}>
      {children}
    </GroupChatContext.Provider>
  );
}

export const useGroupChats = () => {
  const ctx = useContext(GroupChatContext);
  if (!ctx) throw new Error('useGroupChats must be used within GroupChatProvider');
  return ctx;
};
