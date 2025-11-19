
import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  gender: string;
  birthDate: string;
  targetLanguages: string[];
  hobbies: string[]; 
  level: number;
  crowns: { king: number; queen: number };
  achievements: string[];
  isOnline: boolean;
  isBot?: boolean; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<UserProfile | null>(null);
  
  constructor() {
    // Demo için varsayılan yönetici
    // Gerçek uygulamada burası boş başlar
  }

  register(data: any) {
    const newUser: UserProfile = {
      id: 'u-' + Date.now(),
      username: data.username,
      email: data.email,
      // DiceBear API ile avatar üretimi
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      bio: 'Yeni bir Dil Avcısı maceraya hazır.',
      gender: 'Belirtilmemiş',
      birthDate: '',
      targetLanguages: ['İngilizce'],
      hobbies: ['Kitap Okumak', 'Seyahat'],
      level: 1,
      crowns: { king: 0, queen: 0 },
      achievements: ['Çaylak Avcı'],
      isOnline: true
    };
    this.currentUser.set(newUser);
  }

  login(user: UserProfile) {
    this.currentUser.set(user);
  }

  addAchievement(username: string, badge: string) {
      if (this.currentUser()?.username === username) {
          this.currentUser.update(u => {
            if (!u) return null;
            if (u.achievements.includes(badge)) return u;
            return { ...u, achievements: [...u.achievements, badge], level: u.level + 1 };
          });
      }
  }

  logout() { this.currentUser.set(null); }
  
  updateProfile(d: Partial<UserProfile>) { 
    this.currentUser.update(u => u ? {...u, ...d} : null); 
  }
}
