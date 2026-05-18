import { User, Game } from '../models/types';

export interface SuggestionScore {
  userId: string;
  score: number;
  gameOverlap: number;
  skillSimilarity: number;
  locationProximity: number;
  commonFriends: number;
}

const EARTH_RADIUS_KM = 6371;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function normalizeScore(value: number, maxValue: number): number {
  if (maxValue === 0) return 0;
  return Math.min(value / maxValue, 1);
}

export function calculateGameOverlap(user1Games: Game[], user2Games: Game[]): number {
  const user1GameNames = new Set(user1Games.map((g) => g.name.toLowerCase()));
  const user2GameNames = new Set(user2Games.map((g) => g.name.toLowerCase()));

  const intersection = Array.from(user1GameNames).filter((game) => user2GameNames.has(game));
  const union = new Set([...user1GameNames, ...user2GameNames]).size;

  return union === 0 ? 0 : intersection.length / union;
}

export function calculateSkillSimilarity(user1Games: Game[], user2Games: Game[]): number {
  if (user1Games.length === 0 || user2Games.length === 0) return 0;

  const skillLevels: { [key: string]: number } = {
    Beginner: 1,
    Amateur: 2,
    Intermediate: 3,
    Advanced: 4,
    Expert: 5,
  };

  const user1AvgSkill =
    user1Games.reduce((sum, g) => sum + (skillLevels[g.skill] || 0), 0) / user1Games.length;
  const user2AvgSkill =
    user2Games.reduce((sum, g) => sum + (skillLevels[g.skill] || 0), 0) / user2Games.length;

  const maxDiff = 4;
  const diff = Math.abs(user1AvgSkill - user2AvgSkill);
  return 1 - diff / maxDiff;
}

export function calculateLocationProximity(
  user1Loc: { lat: number; lng: number },
  user2Loc: { lat: number; lng: number }
): number {
  const distance = haversineDistance(user1Loc.lat, user1Loc.lng, user2Loc.lat, user2Loc.lng);
  // Users within 50km get scored on proximity
  const maxDistance = 50;
  return Math.max(0, 1 - distance / maxDistance);
}

export function calculateCommonFriends(user1Friends: string[], user2Friends: string[]): number {
  if (user1Friends.length === 0 || user2Friends.length === 0) return 0;
  const set1 = new Set(user1Friends);
  const set2 = new Set(user2Friends);
  const common = Array.from(set1).filter((friend) => set2.has(friend)).length;
  return common / Math.max(user1Friends.length, user2Friends.length);
}

export function calculateSuggestionScore(
  currentUser: User,
  candidateUser: User,
  allUsers: User[]
): SuggestionScore {
  // Don't suggest current user or existing friends
  if (candidateUser.id === currentUser.id || (currentUser.friends || []).includes(candidateUser.id)) {
    return {
      userId: candidateUser.id,
      score: 0,
      gameOverlap: 0,
      skillSimilarity: 0,
      locationProximity: 0,
      commonFriends: 0,
    };
  }

  const gameOverlap = calculateGameOverlap(currentUser.games || [], candidateUser.games || []);
  const skillSimilarity = calculateSkillSimilarity(currentUser.games || [], candidateUser.games || []);
  const locationProximity = calculateLocationProximity(currentUser.location, candidateUser.location);
  const commonFriends = calculateCommonFriends(
    currentUser.friends || [],
    candidateUser.friends || []
  );

  // Weighted scoring (collaborative + content-based filtering)
  const weights = {
    gameOverlap: 0.35,
    skillSimilarity: 0.25,
    locationProximity: 0.2,
    commonFriends: 0.2,
  };

  const score =
    gameOverlap * weights.gameOverlap +
    skillSimilarity * weights.skillSimilarity +
    locationProximity * weights.locationProximity +
    commonFriends * weights.commonFriends;

  return {
    userId: candidateUser.id,
    score,
    gameOverlap,
    skillSimilarity,
    locationProximity,
    commonFriends,
  };
}

export function getSuggestedFriends(
  currentUser: User,
  allUsers: User[],
  limit: number = 10
): User[] {
  const scores = allUsers
    .map((user) => calculateSuggestionScore(currentUser, user, allUsers))
    .filter((score) => score.score > 0.1) // Filter out very low scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scores
    .map((score) => allUsers.find((u) => u.id === score.userId))
    .filter((user) => user !== undefined) as User[];
}
