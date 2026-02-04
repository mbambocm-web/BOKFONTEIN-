
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "./firebase";
import { Member } from "../types";
import { db } from "./db";

export class AuthService {
  private provider = new GoogleAuthProvider();

  async loginWithGoogle(): Promise<Member | null> {
    try {
      const result = await signInWithPopup(auth, this.provider);
      const user = result.user;
      
      // Check if user exists in our Firestore members collection
      let member = await db.getMemberById(user.uid);
      
      if (!member) {
        // Create new member record for first-time login
        // Fix: Added missing 'checkIns' property to satisfy the Member interface
        member = {
          id: user.uid,
          name: user.displayName || "Anonymous Fan",
          email: user.email || "",
          phone: "",
          status: 'active',
          joinDate: new Date().toISOString(),
          balance: 0,
          geesLevel: 1,
          geesXP: 0,
          rank: 1000,
          rankTier: 'Cub',
          avatar: user.photoURL || "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop",
          role: 'member',
          blockedUsers: [],
          checkIns: []
        };
        await db.createMember(member);
      }
      
      db.setCurrentUser(member);
      return member;
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    db.setCurrentUser(null);
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
