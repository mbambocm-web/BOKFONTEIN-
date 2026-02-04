
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc,
  serverTimestamp,
  increment,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firestore, isFirebaseConfigured } from "./firebase";
import { Member, Experience, ContentReport, AppNotification, BokActivity, VibePost, FanZoneHub, Booking } from '../types';

const MOCK_EXPERIENCES: Experience[] = [
  {
    id: 'exp-vip-1',
    title: 'The Platinum Suite: Brisbane Hub',
    type: 'VIP Hospitality',
    pricePPS: 125000,
    priceSingle: 145000,
    location: 'Suncorp Stadium, AU',
    startDate: '22 Oct 2027',
    endDate: '26 Oct 2027',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop',
    features: ['Private Skybox', 'Champagne Brunch', 'Legends Meet & Greet', 'Luxury Limo Transfer', 'Premium Gift Box'],
    status: 'active'
  },
  {
    id: 'exp-vip-2',
    title: 'Springbok Legends Lounge',
    type: 'VIP Hospitality',
    pricePPS: 85000,
    priceSingle: 95000,
    location: 'Brisbane City, AU',
    startDate: '23 Oct 2027',
    endDate: '25 Oct 2027',
    image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=1200&auto=format&fit=crop',
    features: ['Exclusive Lounge Access', 'Gourmet Braai Buffet', 'Open Bar (Premium Brands)', 'Match Day Commemorative Item'],
    status: 'active'
  },
  {
    id: 'exp-1',
    title: 'Finals Weekend: Brisbane Hub',
    type: 'Two Match',
    pricePPS: 49500,
    priceSingle: 62000,
    location: 'Suncorp Stadium, AU',
    startDate: '20 Oct 2027',
    endDate: '25 Oct 2027',
    image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=800&auto=format&fit=crop',
    features: ['Luxury Tent', 'Airport Transfer', 'Gold Deck Access', 'Braai Feast'],
    status: 'active'
  },
  {
    id: 'exp-2',
    title: 'Quarter Finals Package',
    type: 'One Match',
    pricePPS: 28000,
    priceSingle: 35000,
    location: 'Sydney Cricket Ground, AU',
    startDate: '12 Oct 2027',
    endDate: '15 Oct 2027',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    features: ['Hotel Suite', 'VIP Shuttle', 'Match Ticket'],
    status: 'active'
  }
];

const MOCK_HUBS: FanZoneHub[] = [
  { id: 'h1', name: 'The Braai Master Yard', density: 85, vibe: 'High Gees', deals: ['R150 Platter'], lat: -27.4698, lng: 153.0251, status: 'active', contactPerson: 'Jan Braai' },
  { id: 'h2', name: 'Green & Gold Terrace', density: 40, vibe: 'Chill', deals: ['2-for-1 Castle'], lat: -27.4705, lng: 153.0235, status: 'active', contactPerson: 'Sarel van der Merwe' },
];

const MOCK_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Siya K.',
    email: 'siya@bok.com',
    phone: '082 123 4567',
    status: 'active',
    joinDate: '2024-01-01',
    balance: 50000,
    geesLevel: 10,
    geesXP: 8500,
    rank: 1,
    rankTier: 'Centurion',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200',
    role: 'member',
    blockedUsers: [],
    checkIns: []
  },
  {
    id: 'm2',
    name: 'Faf de K.',
    email: 'faf@bok.com',
    phone: '083 987 6543',
    status: 'active',
    joinDate: '2024-02-15',
    balance: 12000,
    geesLevel: 8,
    geesXP: 4200,
    rank: 45,
    rankTier: 'Springbok',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    role: 'member',
    blockedUsers: [],
    checkIns: []
  }
];

const MOCK_POSTS: VibePost[] = [
  {
    id: 'p1',
    userId: 'm1',
    userName: 'Siya K.',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200',
    content: 'Just arrived at the Brisbane Fan Hub! The gees is already massive. Who is joining the braai tonight? 🇿🇦🏉',
    timestamp: '2h ago',
    likes: ['m2']
  }
];

export class DatabaseService {
  private currentUser: Member | null = null;
  private localExperiences: Experience[] = [];
  private localHubs: FanZoneHub[] = [...MOCK_HUBS];
  private localPosts: VibePost[] = [...MOCK_POSTS];
  private localMembers: Member[] = [...MOCK_MEMBERS];
  private localBookings: Booking[] = [];
  private localNotifications: AppNotification[] = [];

  constructor() {
    this.initLocalStore();
  }

  private initLocalStore() {
    const savedExps = localStorage.getItem('bokfontein_experiences');
    const savedHubs = localStorage.getItem('bokfontein_hubs');
    const savedBookings = localStorage.getItem('bokfontein_bookings');
    
    if (savedExps) {
      try { this.localExperiences = JSON.parse(savedExps); } catch (e) { this.localExperiences = [...MOCK_EXPERIENCES]; }
    } else {
      this.localExperiences = [...MOCK_EXPERIENCES];
      this.persistLocalExps();
    }

    if (savedHubs) {
      try { this.localHubs = JSON.parse(savedHubs); } catch (e) { this.localHubs = [...MOCK_HUBS]; }
    } else {
      this.localHubs = [...MOCK_HUBS];
      this.persistLocalHubs();
    }

    if (savedBookings) {
      try { this.localBookings = JSON.parse(savedBookings); } catch (e) { this.localBookings = []; }
    }
  }

  private persistLocalExps() {
    try { localStorage.setItem('bokfontein_experiences', JSON.stringify(this.localExperiences)); } catch (e) {}
  }

  private persistLocalHubs() {
    try { localStorage.setItem('bokfontein_hubs', JSON.stringify(this.localHubs)); } catch (e) {}
  }

  private persistLocalBookings() {
    try { localStorage.setItem('bokfontein_bookings', JSON.stringify(this.localBookings)); } catch (e) {}
  }

  async getExperiences(): Promise<Experience[]> {
    if (!isFirebaseConfigured) return this.localExperiences;
    try {
      const querySnapshot = await getDocs(collection(firestore, "experiences"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Experience);
      return data.length > 0 ? data : this.localExperiences;
    } catch (e) {
      return this.localExperiences;
    }
  }

  async saveExperience(experience: Experience): Promise<void> {
    const existingIndex = this.localExperiences.findIndex(e => e.id === experience.id);
    if (existingIndex > -1) { this.localExperiences[existingIndex] = experience; } 
    else { this.localExperiences.push(experience); }
    this.persistLocalExps();

    if (!isFirebaseConfigured) return;
    try { await setDoc(doc(firestore, "experiences", experience.id), experience); } catch (e) {}
  }

  async deleteExperience(id: string): Promise<void> {
    this.localExperiences = this.localExperiences.filter(e => e.id !== id);
    this.persistLocalExps();
    if (isFirebaseConfigured) {
      try { await deleteDoc(doc(firestore, "experiences", id)); } catch (e) {}
    }
  }

  async getBookings(userId: string): Promise<Booking[]> {
    return this.localBookings.filter(b => b.userId === userId);
  }

  async addBooking(booking: Booking): Promise<void> {
    this.localBookings.push(booking);
    this.persistLocalBookings();
  }

  async getHubs(): Promise<FanZoneHub[]> {
    if (!isFirebaseConfigured) return this.localHubs;
    try {
      const querySnapshot = await getDocs(collection(firestore, "hubs"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FanZoneHub);
      return data.length > 0 ? data : this.localHubs;
    } catch (e) {
      return this.localHubs;
    }
  }

  async saveHub(hub: FanZoneHub): Promise<void> {
    const existingIndex = this.localHubs.findIndex(h => h.id === hub.id);
    if (existingIndex > -1) { this.localHubs[existingIndex] = hub; } 
    else { this.localHubs.push(hub); }
    this.persistLocalHubs();

    if (!isFirebaseConfigured) return;
    try { await setDoc(doc(firestore, "hubs", hub.id), hub); } catch (e) {}
  }

  async deleteHub(id: string): Promise<void> {
    this.localHubs = this.localHubs.filter(h => h.id !== id);
    this.persistLocalHubs();
    if (isFirebaseConfigured) { await deleteDoc(doc(firestore, "hubs", id)); }
  }

  async updateMemberBalance(memberId: string, amount: number) {
    if (this.currentUser && this.currentUser.id === memberId) {
      this.currentUser.balance += amount;
    }
    if (isFirebaseConfigured && !memberId.startsWith('guest')) {
      await updateDoc(doc(firestore, "members", memberId), { balance: increment(amount) });
    }
  }

  setCurrentUser(user: Member | null) { this.currentUser = user; }
  getCurrentUser() { return this.currentUser; }
  
  getVibePosts(): VibePost[] { return this.localPosts; }
  addVibePost(post: VibePost) { this.localPosts = [post, ...this.localPosts]; }
  toggleLikePost(postId: string, userId: string) {
    const post = this.localPosts.find(p => p.id === postId);
    if (post) {
      if (post.likes.includes(userId)) { post.likes = post.likes.filter(id => id !== userId); } 
      else { post.likes.push(userId); }
    }
  }

  getMembers(): Member[] { return this.localMembers; }
  
  processActivity(userId: string, type: string) {
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.geesXP += 50;
      if (this.currentUser.geesXP >= this.currentUser.geesLevel * 500) {
        this.currentUser.geesLevel += 1;
      }
    }
  }

  async getMemberById(id: string): Promise<Member | null> {
    if (!isFirebaseConfigured) return this.localMembers.find(m => m.id === id) || null;
    try {
      const snap = await getDoc(doc(firestore, "members", id));
      return snap.exists() ? (snap.data() as Member) : null;
    } catch (e) { return null; }
  }

  async createMember(m: Member) {
    this.localMembers.push(m);
    if (isFirebaseConfigured) { await setDoc(doc(firestore, "members", m.id), m); }
  }

  addNotification(notification: AppNotification) {
    this.localNotifications = [notification, ...this.localNotifications];
  }

  getNotifications(): AppNotification[] {
    return this.localNotifications;
  }
}

export const db = new DatabaseService();
