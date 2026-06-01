import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FeedItem } from '../models/types';
import { useAuth } from './AuthContext';

interface EventsContextType {
  feedItems: FeedItem[];
  unreadCount: number;
  markAllRead: () => void;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const { currentUser, updateUser } = useAuth();
  const [gameEvents, setGameEvents] = useState<FeedItem[]>([]);
  const [notifications, setNotifications] = useState<FeedItem[]>([]);

  // Listen to boardGameSpots where isEvent === true
  useEffect(() => {
    if (!currentUser) { setGameEvents([]); return; }
    const q = query(
      collection(db, 'boardGameSpots'),
      where('isEvent', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      const out: FeedItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        out.push({
          id: d.id,
          type: 'event',
          title: `Announcing new Event : ${data.title ?? data.name ?? 'Event'}`,
          subtitle: data.description ?? '',
          date: data.date ?? '',
          location: data.location,
          spotName: data.spotName ?? '',
          createdAt: data.createdAt ?? 0,
        });
      });
      setGameEvents(out);
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Listen to spotNotifications collection for spot and event updates/removals
  useEffect(() => {
    if (!currentUser) { setNotifications([]); return; }
    const q = query(
      collection(db, 'spotNotifications'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      const out: FeedItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        
        let title = '';
        let matchedType: any = data.type;

        if (data.type === 'spot_added') {
          title = `Announcing new Spot`;
        } else if (data.type === 'spot_removed') {
          title = `Spot removed`;
        } else if (data.type === 'event_removed') {
          matchedType = 'event_cancelled';
          title = `Event cancelled`;
        } else if (data.type === 'event_updated') {
          matchedType = 'event_update';
          title = `Informing about Update : '${data.spotName}'`;
        } else {
          title = `${data.spotName}`;
        }

        out.push({
          id: d.id,
          type: matchedType,
          title: title,
          subtitle: data.address ?? '',
          createdAt: data.createdAt ?? 0,
          spotName: data.type === 'spot_added' || data.type === 'spot_removed' ? data.spotName : undefined
        });
      });
      setNotifications(out);
    });
    return () => unsub();
  }, [currentUser?.id]);

  const feedItems = [...gameEvents, ...notifications].sort((a, b) => b.createdAt - a.createdAt);

  const lastRead = currentUser?.lastReadEventsAt
    ? new Date(currentUser.lastReadEventsAt).getTime()
    : 0;

  const unreadCount = feedItems.filter((e) => e.createdAt > lastRead).length;

  const markAllRead = () => {
    if (!currentUser) return; // guard
    if (unreadCount > 0) {
      updateUser({ lastReadEventsAt: new Date().toISOString() } as any).catch((err) => {
        console.error("Failed to mark events as read:", err);
      });
    }
  };

  return (
    <EventsContext.Provider value={{ feedItems, unreadCount, markAllRead }}>
      {children}
    </EventsContext.Provider>
  );
}

export const useEvents = () => {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
};