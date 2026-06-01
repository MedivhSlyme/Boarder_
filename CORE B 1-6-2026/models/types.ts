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
  friends: string[];
  boardPoints: number;
  isAdmin?: boolean;
  lastReadEventsAt?: string;
  createdAt?: string;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  fromUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  type?: 'text' | 'audio';
  audioUrl?: string;
}

export interface NearbyPlayer {
  id: string;
  username: string;
  profile_pic: string;
  games: Game[];
  location: { lat: number; lng: number };
  distanceKm: number;
}

export interface Spot {
  id: string;
  name: string;
  description: string;
  type: string;
  address: string;
  location: { lat: number; lng: number };
  isEvent?: boolean;
  addedBy: string;
  createdAt: number;
}

export interface GameEvent {
  id: string;
  spotId?: string;
  spotName?: string;
  title: string;
  description: string;
  date: string;
  location?: { lat: number; lng: number };
  createdBy: string;
  createdAt: number;
}

export type FeedItemType = 'event' | 'spot_added' | 'spot_removed' | 'event_cancelled' | 'event_update';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  subtitle?: string;
  date?: string;
  location?: { lat: number; lng: number };
  spotName?: string;
  createdAt: number;
}

export interface SuggestedPlayer {
  user: User;
  score: number;
  distanceKm: number;
  sharedGames: string[];
}

export const DEFAULT_PROFILE_DETAILS: ProfileDetails = {
  bio: '',
  availability: '',
  profile_pic: '',
};

export interface GroupChat {
  id: string;
  name: string;
  memberIds: string[];
  createdBy: string;
  createdAt: number;
  eventId?: string;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface MatchRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  game: string;
  outcome: 'win' | 'loss';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export const AVATAR_MAP: Record<string, any> = {
  admin_avatar: require('../assets/avatars/admin_avatar.png'),
  avatar1: require('../assets/avatars/avatar1.png'),
  avatar2: require('../assets/avatars/avatar2.png'),
  avatar3: require('../assets/avatars/avatar3.png'),
  avatar4: require('../assets/avatars/avatar4.png'),
  avatar5: require('../assets/avatars/avatar5.png'),
  avatar6: require('../assets/avatars/avatar6.png'),
  avatar7: require('../assets/avatars/avatar7.png'),
  avatar8: require('../assets/avatars/avatar8.png'),
  avatar9: require('../assets/avatars/avatar9.png'),
  avatar10: require('../assets/avatars/avatar10.png'),
  avatar11: require('../assets/avatars/avatar11.png'),
  avatar12: require('../assets/avatars/avatar12.png'),
};
