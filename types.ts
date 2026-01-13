export enum AppTab {
  HOME = 'home',
  EXPERIENCES = 'experiences',
  COMMUNITY = 'community',
  PROFILE = 'profile',
  WALLET = 'wallet',
  ADMIN = 'admin'
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}

export interface Experience {
  id: string;
  title: string;
  type: 'One Match' | 'Two Match' | 'Full Group Stage';
  pricePPS: number;
  priceSingle: number;
  location: string;
  startDate: string;
  endDate: string;
  image: string;
  features: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'match' | 'system' | 'wallet';
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  joinDate: string;
  balance: number;
  geesLevel: number;
  geesXP: number;
  rank: number;
  rankTier: 'Cub' | 'Gazelle' | 'Springbok' | 'Centurion';
  avatar: string;
  role: 'member' | 'admin';
  blockedUsers: string[];
}

export interface VibePost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: string[];
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  description: string;
  icon: string;
  category: 'Braai' | 'Merch' | 'Experience';
}

export interface ContentReport {
  id: string;
  postId: string;
  postContent: string;
  reportedUserId: string;
  reporterUserId: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export type BokActivity = 'post' | 'purchase' | 'topup' | 'chat' | 'checkin';

export interface MatchState {
  score: { sa: number, nz: number };
  time: number;
  momentum: number;
  lastEvent: string;
  isLive: boolean;
}