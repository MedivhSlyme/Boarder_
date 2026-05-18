export type Skill = 'Beginner' | 'Amateur' | 'Intermediate' | 'Advanced' | 'Expert';

export const SKILLS: Skill[] = ['Beginner', 'Amateur', 'Intermediate', 'Advanced', 'Expert'];

export interface Game {
  name: string;
  skill: Skill;
  favorite: boolean;
}

export interface ProfileDetails {
  bio: string;
  availability: string;
  profile_pic: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  games: Game[];
  location: { lat: number; lng: number };
  active: boolean;
  last_seen_on: string;
  profile_details: ProfileDetails;
  friends?: string[];
  isAdmin?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface NearbyPlayer {
  id: string;
  username: string;
  profile_pic: string;
  games: Game[];
  location: { lat: number; lng: number };
  distanceKm: number;
  active: boolean;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'denied' | 'blocked';

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: FriendRequestStatus;
  createdAt: number;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: number;
}

export type BoardGameSpotCategory =
  | 'Chess Cafe'
  | 'Library'
  | 'Gaming Club'
  | 'Board Game Store'
  | 'Bar / Pub'
  | 'Community Center'
  | 'Other';

export const SPOT_CATEGORIES: BoardGameSpotCategory[] = [
  'Chess Cafe',
  'Library',
  'Gaming Club',
  'Board Game Store',
  'Bar / Pub',
  'Community Center',
  'Other',
];

export interface BoardGameSpot {
  id: string;
  name: string;
  category: BoardGameSpotCategory;
  description: string;
  location: { lat: number; lng: number };
  imageUrl?: string;
  createdBy: string;
  createdAt: number;
}

export const DEFAULT_PROFILE_DETAILS: ProfileDetails = {
  bio: '',
  availability: '',
  profile_pic: '',
};
