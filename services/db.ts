
/**
 * BokBase - Persistence Layer
 * Handles all CRUD operations and simulates a cloud-sync backend.
 */

import { Member, Experience, ContentReport, AppNotification, Transaction, BokActivity, VibePost } from '../types';

const DB_KEY = 'bok_fontein_v1_db';

interface BokDatabase {
  members: Member[];
  experiences: Experience[];
  reports: ContentReport[];
  notifications: AppNotification[];
  vibePosts: VibePost[];
  currentUser: Member | null;
  lastSync: string;
}

// XP per activity (Spirit Points)
const XP_MAP: Record<BokActivity, number> = {
  post: 50,
  purchase: 1200, // Big boost for booking tours
  topup: 300,
  chat: 15,
  checkin: 200
};

// Base BokBucks (Currency) per activity before multipliers
const BUCKS_BASE_MAP: Record<BokActivity, number> = {
  post: 10,
  purchase: 250,
  topup: 50,
  chat: 5,
  checkin: 30
};

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Thabo Mokoena',
    email: 'thabo@mzansi.com',
    phone: '+27 82 123 4567',
    status: 'active',
    joinDate: '2024-01-15',
    balance: 15420.50,
    geesLevel: 8,
    geesXP: 4200,
    rank: 42,
    rankTier: 'Gazelle',
    avatar: 'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?q=80&w=200&auto=format&fit=crop',
    role: 'admin',
    blockedUsers: []
  },
  {
    id: 'm2',
    name: 'Guest Fan',
    email: 'fan@mzansi.com',
    phone: '+27 71 000 0000',
    status: 'active',
    joinDate: '2024-10-10',
    balance: 50.00,
    geesLevel: 1,
    geesXP: 0,
    rank: 1000,
    rankTier: 'Cub',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop',
    role: 'member',
    blockedUsers: []
  }
];

const INITIAL_VIBE_POSTS: VibePost[] = [
  {
    id: 'p1',
    userId: 'm1',
    userName: 'Thabo Mokoena',
    userAvatar: 'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?q=80&w=200&auto=format&fit=crop',
    content: "Just landed in Brisbane! Where's the first braai happening? 🇿🇦🇦🇺",
    timestamp: '2 hours ago',
    likes: ['m2']
  },
  {
    id: 'p2',
    userId: 'm2',
    userName: 'Guest Fan',
    userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop',
    content: "The gees at Suncorp is already electric. BOKKE! 🏉",
    timestamp: '5 hours ago',
    likes: ['m1']
  }
];

const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: '1',
    title: 'Heritage Test: Boks vs All Blacks',
    type: 'One Match',
    pricePPS: 2499,
    priceSingle: 3850,
    location: 'Johannesburg, RSA',
    startDate: '15 Dec 2025',
    endDate: '16 Dec 2025',
    image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=1200&auto=format&fit=crop',
    features: ['Luxury Suite', 'Heritage Braai', 'Gold Match Pass']
  },
  {
    id: '2',
    title: 'Brisbane Fan Hub: Full Stage',
    type: 'Full Group Stage',
    pricePPS: 15999,
    priceSingle: 22450,
    location: 'Brisbane, AU',
    startDate: '20 Aug 2027',
    endDate: '28 Aug 2027',
    image: 'https://images.unsplash.com/photo-1506701908217-0a05d9f52151?q=80&w=1200&auto=format&fit=crop',
    features: ['Elite Fan Villa', 'SA Heritage Gala', 'Gold Pass Access', 'Fan Braai']
  }
];

export class DatabaseService {
  private data: BokDatabase;

  constructor() {
    this.data = this.load();
  }

  private load(): BokDatabase {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Database corruption detected, resetting to defaults.");
      }
    }
    return {
      members: INITIAL_MEMBERS,
      experiences: INITIAL_EXPERIENCES,
      reports: [],
      notifications: [],
      vibePosts: INITIAL_VIBE_POSTS,
      currentUser: null,
      lastSync: new Date().toISOString()
    };
  }

  save() {
    this.data.lastSync = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  getMembers() { return this.data.members; }
  getExperiences() { return this.data.experiences; }
  getReports() { return this.data.reports; }
  getNotifications() { return this.data.notifications; }
  getVibePosts() { return this.data.vibePosts; }
  getCurrentUser() { return this.data.currentUser; }
  getLastSync() { return this.data.lastSync; }

  setMembers(members: Member[]) { this.data.members = members; this.save(); }
  setExperiences(exps: Experience[]) { this.data.experiences = exps; this.save(); }
  setReports(reports: ContentReport[]) { this.data.reports = reports; this.save(); }
  setNotifications(notifs: AppNotification[]) { this.data.notifications = notifs; this.save(); }
  setVibePosts(posts: VibePost[]) { this.data.vibePosts = posts; this.save(); }
  setCurrentUser(user: Member | null) { this.data.currentUser = user; this.save(); }

  updateMemberBalance(memberId: string, amount: number) {
    this.data.members = this.data.members.map(m => {
      if (m.id === memberId) {
        const newBalance = m.balance + amount;
        if (this.data.currentUser?.id === memberId) {
          this.data.currentUser.balance = newBalance;
        }
        return { ...m, balance: newBalance };
      }
      return m;
    });
    this.save();
  }

  toggleLikePost(postId: string, userId: string) {
    this.data.vibePosts = this.data.vibePosts.map(p => {
      if (p.id === postId) {
        const liked = p.likes.includes(userId);
        return {
          ...p,
          likes: liked ? p.likes.filter(id => id !== userId) : [...p.likes, userId]
        };
      }
      return p;
    });
    this.save();
  }

  addVibePost(post: VibePost) {
    this.data.vibePosts = [post, ...this.data.vibePosts];
    this.save();
  }

  processActivity(memberId: string, activity: BokActivity) {
    const xp = XP_MAP[activity];
    const baseBucks = BUCKS_BASE_MAP[activity];

    this.data.members = this.data.members.map(m => {
      if (m.id === memberId) {
        // Calculate Multiplier based on current level
        let multiplier = 1.0;
        if (m.geesLevel > 15) multiplier = 3.0;
        else if (m.geesLevel > 10) multiplier = 2.0;
        else if (m.geesLevel > 5) multiplier = 1.5;

        const earnedBucks = baseBucks * multiplier;
        const newXP = m.geesXP + xp;
        const newLevel = Math.floor(newXP / 500) + 1;
        const newBalance = m.balance + earnedBucks;
        
        let newTier: Member['rankTier'] = 'Cub';
        if (newLevel > 15) newTier = 'Centurion';
        else if (newLevel > 10) newTier = 'Springbok';
        else if (newLevel > 5) newTier = 'Gazelle';

        const updated = { 
          ...m, 
          geesXP: newXP, 
          geesLevel: newLevel, 
          rankTier: newTier,
          balance: newBalance 
        };

        if (this.data.currentUser?.id === memberId) {
          this.data.currentUser = updated;
        }
        return updated;
      }
      return m;
    });
    this.save();
  }

  addNotification(notif: AppNotification) {
    this.data.notifications = [notif, ...this.data.notifications];
    this.save();
  }
}

export const db = new DatabaseService();
