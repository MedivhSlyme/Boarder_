import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import { BoardPointsRecord, UserBoardPoints, calculateBoardPoints, calculateWinRate } from '../models/gamification';

interface GamificationContextType {
  userBoardPoints: UserBoardPoints | null;
  leaderboard: UserBoardPoints[];
  recordMatch: (opponentId: string, gameType: string, result: 'win' | 'loss' | 'draw', location?: string) => Promise<void>;
  getUserStats: (userId: string) => UserBoardPoints | null;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { currentUser, firebaseUser } = useAuth();
  const [boardPointsRecords, setBoardPointsRecords] = useState<BoardPointsRecord[]>([]);
  const [allUserStats, setAllUserStats] = useState<Map<string, UserBoardPoints>>(new Map());

  // Subscribe to board points records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'boardPointsRecords'), (snap) => {
      const records: BoardPointsRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        records.push({
          id: d.id,
          playerId: data.playerId,
          opponentId: data.opponentId,
          gameType: data.gameType,
          result: data.result,
          pointsEarned: data.pointsEarned,
          location: data.location,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp ?? Date.now(),
        });
      });
      setBoardPointsRecords(records);
    });
    return () => unsub();
  }, []);

  // Calculate stats for all users
  useEffect(() => {
    const stats = new Map<string, UserBoardPoints>();

    boardPointsRecords.forEach((record) => {
      // Update player stats
      const playerKey = record.playerId;
      const playerStat = stats.get(playerKey) || {
        userId: playerKey,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        rank: 0,
        gamesPlayed: 0,
      };

      playerStat.totalPoints += record.pointsEarned;
      if (record.result === 'win') playerStat.wins++;
      else if (record.result === 'loss') playerStat.losses++;
      else playerStat.draws++;
      playerStat.gamesPlayed = playerStat.wins + playerStat.losses + playerStat.draws;
      playerStat.winRate = calculateWinRate(playerStat.wins, playerStat.losses, playerStat.draws);

      stats.set(playerKey, playerStat);
    });

    // Assign ranks
    const sortedStats = Array.from(stats.values()).sort((a, b) => b.totalPoints - a.totalPoints);
    sortedStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    setAllUserStats(stats);
  }, [boardPointsRecords]);

  const userBoardPoints = useMemo(() => {
    if (!currentUser) return null;
    return allUserStats.get(currentUser.id) || {
      userId: currentUser.id,
      totalPoints: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      rank: 0,
      gamesPlayed: 0,
    };
  }, [allUserStats, currentUser?.id]);

  const leaderboard = useMemo(() => {
    return Array.from(allUserStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 100);
  }, [allUserStats]);

  const recordMatch = async (
    opponentId: string,
    gameType: string,
    result: 'win' | 'loss' | 'draw',
    location?: string
  ) => {
    if (!currentUser || !firebaseUser) return;

    const points = calculateBoardPoints(result);

    // Record for current user
    await addDoc(collection(db, 'boardPointsRecords'), {
      playerId: currentUser.id,
      opponentId,
      gameType,
      result,
      pointsEarned: points,
      location: location || '',
      timestamp: serverTimestamp(),
    });

    // Record for opponent (opposite result)
    const opponentResult = result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw';
    const opponentPoints = calculateBoardPoints(opponentResult);

    await addDoc(collection(db, 'boardPointsRecords'), {
      playerId: opponentId,
      opponentId: currentUser.id,
      gameType,
      result: opponentResult,
      pointsEarned: opponentPoints,
      location: location || '',
      timestamp: serverTimestamp(),
    });
  };

  const getUserStats = (userId: string): UserBoardPoints | null => {
    return allUserStats.get(userId) || null;
  };

  return (
    <GamificationContext.Provider
      value={{
        userBoardPoints,
        leaderboard,
        recordMatch,
        getUserStats,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export const useGamification = () => {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
};
