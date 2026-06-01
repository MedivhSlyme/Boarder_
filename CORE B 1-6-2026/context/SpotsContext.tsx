import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
  import { collection, onSnapshot, query, where } from 'firebase/firestore';
  import { db } from '../firebase/firebaseConfig';
  import { Spot } from '../models/types';
  import { useAuth } from './AuthContext';

  interface SpotsContextType {
    spots: Spot[];
  }

  const SpotsContext = createContext<SpotsContextType | null>(null);

  export function SpotsProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const [spots, setSpots] = useState<Spot[]>([]);

    useEffect(() => {
      if (!currentUser) { setSpots([]); return; }
      // Use boardGameSpots collection. Non-event spots have isEvent: false or undefined.
      const unsub = onSnapshot(collection(db, 'boardGameSpots'), (snap) => {
        const out: Spot[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          // Include only non-event entries
          if (!data.isEvent) {
            out.push({ id: d.id, ...(data as Omit<Spot, 'id'>) });
          }
        });
        setSpots(out);
      });
      return () => unsub();
    }, [currentUser?.id]);

    return (
      <SpotsContext.Provider value={{ spots }}>
        {children}
      </SpotsContext.Provider>
    );
  }

  export const useSpots = () => {
    const ctx = useContext(SpotsContext);
    if (!ctx) throw new Error('useSpots must be used within SpotsProvider');
    return ctx;
  };
  