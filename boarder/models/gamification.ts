export interface BoardPointsRecord {
  id: string;
  playerId: string;
  opponentId: string;
  gameType: string;
  result: 'win' | 'loss' | 'draw';
  pointsEarned: number;
  location?: string;
  timestamp: number;
}

export interface UserBoardPoints {
  userId: string;
  totalPoints: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rank: number;
  gamesPlayed: number;
}

export const calculateBoardPoints = (result: 'win' | 'loss' | 'draw'): number => {
  switch (result) {
    case 'win':
      return 100;
    case 'draw':
      return 25;
    case 'loss':
      return 0;
  }
};

export const calculateWinRate = (wins: number, losses: number, draws: number): number => {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return (wins / total) * 100;
};
