
export enum AppTab {
  HOME = 'home',
  EXPERIENCES = 'experiences',
  GREEN_MILE = 'green_mile',
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
  type: 'One Match' | 'Two Match' | 'Full Group Stage' | 'VIP Hospitality';
  pricePPS: number;
  priceSingle: number;
  location: string;
  startDate: string;
  endDate: string;
  image: string;
  features: string[];
  status?: 'active' | 'paused';
}

export interface Booking {
  id: string;
  userId: string;
  experienceId: string;
  experienceTitle: string;
  experienceImage: string;
  location: string;
  date: string;
  bookingRef: string;
  status: 'Purchased' | 'Wishlisted';
  amount: number;
}

export interface LegendBio {
  name: string;
  caps: number;
  position: string;
  notableMoment: string;
  avatar: string;
}

export interface FanZoneHub {
  id: string;
  name: string;
  activity: string; // New: Specific activity like "Braai & Rugby", "Fan March", etc.
  density: number; // 0-100
  vibe: 'Chill' | 'Singing' | 'High Gees' | 'Family';
  deals: string[];
  lat: number;
  lng: number;
  image?: string;
  description?: string;
  status?: 'active' | 'paused';
  contactPerson?: string;
  type: 'venue' | 'activity'; // To distinguish marker icons
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
  checkIns: string[];
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

export interface MatchState {
  score: { sa: number, nz: number };
  time: number;
  momentum: number;
  lastEvent: string;
  isLive: boolean;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  description: string;
  icon: string;
  category: string;
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

export interface BokActivity {
  id: string;
  userId: string;
  type: 'post' | 'like' | 'purchase' | 'checkin' | 'topup';
  timestamp: string;
  pointsEarned: number;
}
