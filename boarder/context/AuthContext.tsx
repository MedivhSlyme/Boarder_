import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/firebaseConfig';
import { User, DEFAULT_PROFILE_DETAILS } from '../models/types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  uploadProfilePic: (uri: string) => Promise<string>;
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
    isAdmin: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = currentUser?.isAdmin === true;

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
        setCurrentUser({ id: fbUser.uid, ...(snap.data() as Omit<User, 'id'>) });
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

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    updateDoc(doc(db, 'users', cred.user.uid), {
      active: true,
      last_seen_on: new Date().toISOString(),
    }).catch(() => {});
  };

  const register = async (username: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const data = buildNewUser(cred.user.uid, email.trim(), username.trim());
    await setDoc(doc(db, 'users', cred.user.uid), data);
  };

  const logout = async () => {
    if (firebaseUser) {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        active: false,
        last_seen_on: new Date().toISOString(),
      }).catch(() => {});
    }
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

  return (
    <AuthContext.Provider
      value={{ currentUser, firebaseUser, isLoading, isAdmin, login, register, logout, updateUser, uploadProfilePic }}
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
