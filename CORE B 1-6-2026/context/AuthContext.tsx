import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/firebaseConfig';
import { User, DEFAULT_PROFILE_DETAILS } from '../models/types';
import { isInactiveFor5Min } from '../lib/timeAgo';

const SPLASH_DURATION = 1350;

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isSplashing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  uploadProfilePic: (uri: string) => Promise<string>;
  addBoardPoints: (uid: string, points: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function buildNewUser(uid: string, email: string, username: string): Omit<User, 'id'> {
  return {
    username,
    email,
    games: [],
    location: { lat: 36.8065, lng: 10.1815 },
    active: true,
    last_seen_on: new Date().toISOString(),
    profile_details: { ...DEFAULT_PROFILE_DETAILS },
    friends: [],
    boardPoints: 0,
    isAdmin: false,
    lastReadEventsAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplashing, setIsSplashing] = useState(false);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webDisconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    firebaseUserRef.current = firebaseUser;
  }, [firebaseUser]);

  const touchActivity = () => {
    const fbUser = firebaseUserRef.current;
    if (!fbUser) return;
    updateDoc(doc(db, 'users', fbUser.uid), {
      last_seen_on: new Date().toISOString(),
      active: true,
    }).catch(() => {});
  };

  const setUserInactive = async () => {
    const fbUser = firebaseUserRef.current;
    if (!fbUser) return;
    await updateDoc(doc(db, 'users', fbUser.uid), {
      active: false,
      last_seen_on: new Date().toISOString(),
    }).catch(() => {});
    await signOut(auth).catch(() => {});
  };

  // Heartbeat system
  useEffect(() => {
    const startHeartbeat = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(touchActivity, 5 * 60 * 1000);
    };

    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    startHeartbeat();

    return () => {
      stopHeartbeat();
    };
  }, []);

  // Delayed disconnect handling for web platforms
  useEffect(() => {
    if (!firebaseUser) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const uid = firebaseUser.uid;

      if (nextAppState === 'active') {
        // User returned! Cancel any pending disconnection timers
        if (webDisconnectTimeoutRef.current) {
          clearTimeout(webDisconnectTimeoutRef.current);
          webDisconnectTimeoutRef.current = null;
        }

        touchActivity();

        updateDoc(doc(db, 'users', uid), {
          active: true,
          last_seen_on: new Date().toISOString(),
        }).catch(() => {});
      } else {
        // App went to background / tab lost focus
        if (Platform.OS === 'web') {
          // Cancel any existing running timer first to prevent duplication
          if (webDisconnectTimeoutRef.current) {
            clearTimeout(webDisconnectTimeoutRef.current);
          }

          // Start a 1-minute countdown before updating the DB state
          webDisconnectTimeoutRef.current = setTimeout(() => {
            updateDoc(doc(db, 'users', uid), {
              active: false,
              last_seen_on: new Date().toISOString(),
            }).catch(() => {});
            webDisconnectTimeoutRef.current = null;
          }, 60000);
        } else {
          // Native mobile apps disconnect instantly when minimized
          updateDoc(doc(db, 'users', uid), {
            active: false,
            last_seen_on: new Date().toISOString(),
          }).catch(() => {});
        }
      }
    });

    return () => {
      subscription.remove();

      if (webDisconnectTimeoutRef.current) {
        clearTimeout(webDisconnectTimeoutRef.current);
      }
    };
  }, [firebaseUser]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      const docRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Omit<User, 'id'>;
        if (isInactiveFor5Min(data.last_seen_on)) {
          await updateDoc(docRef, { active: false }).catch(() => {});
          await signOut(auth).catch(() => {});
          return;
        }
        setCurrentUser({ id: fbUser.uid, ...data });
      } else {
        const data = buildNewUser(fbUser.uid, fbUser.email ?? '', fbUser.email?.split('@')[0] ?? 'player');
        await setDoc(docRef, data);
        setCurrentUser({ id: fbUser.uid, ...data });
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      if (snap.exists()) {
        setCurrentUser({ id: firebaseUser.uid, ...(snap.data() as Omit<User, 'id'>) });
      }
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  const showSplash = (): Promise<void> => {
    return new Promise((resolve) => {
      setIsSplashing(true);
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
      splashTimerRef.current = setTimeout(() => {
        setIsSplashing(false);
        resolve();
      }, SPLASH_DURATION);
    });
  };

  const login = async (email: string, password: string) => {
    showSplash();
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    // Fetch fresh user data to check isAdmin status
    const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
    const userData = userSnap.exists() ? userSnap.data() : null;
    const updates: Record<string, any> = {
      active: true,
      last_seen_on: new Date().toISOString(),
    };
    // Admin accounts always use the dedicated admin avatar
    if (userData?.isAdmin === true) {
      updates['profile_details.profile_pic'] = 'admin_avatar';
    }
    updateDoc(doc(db, 'users', cred.user.uid), updates).catch(() => {});
  };

  const register = async (username: string, email: string, password: string) => {
    showSplash();
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const data = buildNewUser(cred.user.uid, email.trim(), username.trim());
    await setDoc(doc(db, 'users', cred.user.uid), data);
  };

  const logout = async () => {
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          active: false,
          last_seen_on: new Date().toISOString(),
        });
      } catch (e) {
        console.log("Skipped user update on logout", e);
      }
    }
    showSplash();
    await signOut(auth);
  };

  const updateUser = async (updates: Partial<Omit<User, 'id'>>) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), updates as any);
  };

  const uploadProfilePic = async (uri: string): Promise<string> => {
    if (!firebaseUser) throw new Error('Not authenticated');
    const storageRef = ref(storage, `avatars/${firebaseUser.uid}`);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      'profile_details.profile_pic': url,
    });
    return url;
  };

  const addBoardPoints = async (uid: string, points: number) => {
    await updateDoc(doc(db, 'users', uid), { boardPoints: increment(points) });
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, firebaseUser, isLoading, isSplashing, login, register, logout, updateUser, uploadProfilePic, addBoardPoints }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
