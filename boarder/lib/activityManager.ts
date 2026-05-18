import { db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export class ActivityManager {
  private static timeoutId: NodeJS.Timeout | null = null;
  private static lastActivityTime: number = Date.now();

  static resetActivityTimer(userId: string) {
    this.lastActivityTime = Date.now();
    
    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout for inactivity
    this.timeoutId = setTimeout(() => {
      this.markUserInactive(userId);
    }, INACTIVITY_TIMEOUT);
  }

  private static async markUserInactive(userId: string) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active: false,
        last_seen_on: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to mark user inactive:', error);
    }
  }

  static clearActivityTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  static getTimeSinceLastSeen(lastSeenIso: string): string {
    const lastSeen = new Date(lastSeenIso).getTime();
    const now = Date.now();
    const diffMs = now - lastSeen;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}
