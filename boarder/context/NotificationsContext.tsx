import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import { EventNotification } from '../models/types';

interface NotificationsContextType {
  eventNotifications: EventNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const [eventNotifications, setEventNotifications] = useState<EventNotification[]>([]);

  useEffect(() => {
    if (!firebaseUser) {
      setEventNotifications([]);
      return;
    }

    const unsub = onSnapshot(collection(db, 'eventNotifications'), (snap) => {
      const notifications: EventNotification[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        notifications.push({
          id: d.id,
          spotId: data.spotId,
          spotName: data.spotName,
          eventDate: data.eventDate?.toMillis ? data.eventDate.toMillis() : data.eventDate ?? Date.now(),
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt ?? Date.now(),
          createdBy: data.createdBy,
          category: data.category,
          location: data.location,
          description: data.description,
        });
      });
      setEventNotifications(notifications.sort((a, b) => b.eventDate - a.eventDate));
    });

    return () => unsub();
  }, [firebaseUser]);

  const unreadCount = eventNotifications.length;

  const markAsRead = (notificationId: string) => {
    setEventNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  return (
    <NotificationsContext.Provider
      value={{
        eventNotifications,
        unreadCount,
        markAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};
