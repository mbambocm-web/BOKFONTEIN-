import { Member } from '../types';
import { db } from './db';

export class AuthService {
  async loginWithSocial(provider: 'google' | 'apple'): Promise<Member | null> {
    // PRODUCTION: Integration with Firebase Auth or Auth0
    // Example: const result = await signInWithPopup(auth, provider);
    console.log(`Connecting to ${provider} OAuth...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const members = db.getMembers();
        resolve(members[0]); // Returning admin as mock
      }, 1000);
    });
  }

  async logout(): Promise<void> {
    // PRODUCTION: auth.signOut()
    db.setCurrentUser(null);
  }
}

export const authService = new AuthService();