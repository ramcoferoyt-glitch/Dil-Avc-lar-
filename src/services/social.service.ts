
import { Injectable, signal, computed } from '@angular/core';
import { UserProfile } from './auth.service';

export interface ChatMessage {
  senderId: string;
  text: string;
  timestamp: number;
  isMe: boolean;
}

export interface SocialUser extends UserProfile {
  isBot: boolean;
  isFriend: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  // The "Database" of all users in the universe
  allUsers = signal<SocialUser[]>([]);
  
  // Chat State
  activeChatUserId = signal<string | null>(null);
  chatHistory = signal<Map<string, ChatMessage[]>>(new Map());
  isChatOpen = signal<boolean>(false);

  private mockFemales = ['Aylin', 'Zeynep', 'Elif', 'Selin', 'Defne', 'Mira', 'Esra'];
  private mockMales = ['Can', 'Mert', 'Emre', 'Burak', 'Kerem'];
  private hobbiesList = ['Fotoğrafçılık', 'Kodlama', 'Manga', 'Jazz', 'Seyahat', 'Yemek', 'Dans', 'Tarih', 'Futbol', 'Yoga'];
  private badgesList = ['Hızlı Düşünür', 'Kelime Cambazı', 'Kral Katili', 'Gece Kuşu', 'Polyglot', 'Yardımsever'];

  constructor() {
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
        const stored = localStorage.getItem('dilavcilar_db_users');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                this.allUsers.set(parsed as SocialUser[]);
            } else {
                this.generateInitialBots();
            }
        } else {
            this.generateInitialBots();
        }
    } catch(e) {
        this.generateInitialBots();
    }
  }

  private generateInitialBots() {
    const bots: SocialUser[] = [];
    
    // Generate Females
    this.mockFemales.forEach(name => bots.push(this.createBot(name, 'female')));
    // Generate Males
    this.mockMales.forEach(name => bots.push(this.createBot(name, 'male')));

    this.allUsers.set(bots);
    this.saveDatabase();
  }

  private createBot(name: string, gender: 'male'|'female'): SocialUser {
    const seed = name + Math.random();
    const randomLvl = Math.floor(Math.random() * 20) + 1;
    
    // Pick random hobbies
    const myHobbies = [];
    for(let i=0; i<3; i++) myHobbies.push(this.hobbiesList[Math.floor(Math.random() * this.hobbiesList.length)]);

    // Pick random badges
    const myBadges = [];
    if(Math.random() > 0.3) myBadges.push(this.badgesList[Math.floor(Math.random() * this.badgesList.length)]);
    if(Math.random() > 0.7) myBadges.push('Efsanevi Avcı 🏆');

    return {
      id: 'bot-' + name.toLowerCase(),
      username: name,
      email: `${name.toLowerCase()}@dilavcilar.bot`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=${gender}`,
      bio: `Merhaba! Ben ${name}. Dil öğrenmeyi ve ${myHobbies[0].toLowerCase()} ile ilgilenmeyi seviyorum. Yarışmaya hazırım!`,
      gender: gender === 'male' ? 'Erkek' : 'Kadın',
      birthDate: '2000-01-01',
      targetLanguages: Math.random() > 0.5 ? ['İngilizce', 'İspanyolca'] : ['İngilizce'],
      hobbies: Array.from(new Set(myHobbies)), // Fixed: use Array.from instead of spread for safety
      level: randomLvl,
      crowns: { king: Math.floor(Math.random()*5), queen: Math.floor(Math.random()*5) },
      achievements: myBadges,
      isOnline: true,
      isBot: true,
      isFriend: false
    };
  }

  private saveDatabase() {
    localStorage.setItem('dilavcilar_db_users', JSON.stringify(this.allUsers()));
  }

  // --- Actions ---

  toggleFriend(userId: string) {
    this.allUsers.update(users => users.map(u => {
      if (u.id === userId) return { ...u, isFriend: !u.isFriend };
      return u;
    }));
    this.saveDatabase();
  }

  openChat(userId: string) {
    this.activeChatUserId.set(userId);
    this.isChatOpen.set(true);
    
    // If no history, add a greeting
    const hist = this.chatHistory();
    if (!hist.has(userId)) {
      const user = this.allUsers().find(u => u.id === userId);
      if(user) {
        this.addMessage(userId, {
           senderId: userId,
           text: `Selam! Ben ${user.username}. Birlikte pratik yapabiliriz! 👋`,
           timestamp: Date.now(),
           isMe: false
        });
      }
    }
  }

  closeChat() {
    this.isChatOpen.set(false);
  }

  sendMessage(text: string) {
    const activeId = this.activeChatUserId();
    if (!activeId || !text.trim()) return;

    // Add my message
    this.addMessage(activeId, {
      senderId: 'me',
      text: text,
      timestamp: Date.now(),
      isMe: true
    });

    // Simulate Bot Response
    setTimeout(() => {
       this.botReply(activeId, text);
    }, 1500);
  }

  private addMessage(chatId: string, msg: ChatMessage) {
    this.chatHistory.update(map => {
      const newMap = new Map<string, ChatMessage[]>(map);
      const current = newMap.get(chatId) || [];
      newMap.set(chatId, [...current, msg]);
      return newMap;
    });
  }

  private botReply(botId: string, userMsg: string) {
    const responses = [
       "Harika fikir! Kesinlikle katılıyorum.",
       "Bu konuda ne düşünüyorsun peki?",
       "Hahaha, çok iyi yakaladın! 😂",
       "Şu an 2. Tur için çalışıyorum, sen nasılsın?",
       "Sıradaki oyunda aynı takımda olalım mı?",
       "İngilizcemi geliştirmem lazım, kelime avında zorlanıyorum.",
       "Vay canına! Profilin çok havalı görünüyor."
    ];
    const randomResp = responses[Math.floor(Math.random() * responses.length)];
    
    this.addMessage(botId, {
      senderId: botId,
      text: randomResp,
      timestamp: Date.now(),
      isMe: false
    });
  }

  getRandomBots(count: number): SocialUser[] {
    // Safe check for iterable
    const raw = this.allUsers();
    if (!Array.isArray(raw)) return [];
    
    // Force type casting and use slice() instead of spread syntax to prevent iterator errors
    const users = raw as SocialUser[];
    const shuffled = users.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  getById(id: string) {
      return this.allUsers().find(u => u.id === id);
  }
}
