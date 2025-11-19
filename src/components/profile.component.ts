
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../services/auth.service';
import { SocialService, SocialUser } from '../services/social.service';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-slate-950 relative overflow-hidden custom-scrollbar">
      <!-- Background Effects -->
      <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
      
      <!-- Current View Profile -->
      @if (displayUser(); as user) {
        <div class="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full z-10 pb-24">
          
          <!-- Header / Banner -->
          <div class="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start mb-8">
            
            <!-- Avatar Card -->
            <div class="w-full md:w-auto flex flex-col items-center">
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-br from-yellow-400 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img [src]="isEditing ? editData.avatar : user.avatar" 
                     alt="Profil Resmi"
                     class="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-slate-900 bg-slate-800 object-cover shadow-2xl z-10">
                
                @if(isEditing) {
                  <button (click)="randomizeAvatar()" type="button" class="absolute bottom-2 right-2 z-20 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full border border-slate-600 shadow-lg" title="Yeni Avatar Zarla">
                    🎲
                  </button>
                }
              </div>
              
              @if(!isEditing) {
                <div class="mt-4 text-center flex flex-col gap-2 w-full">
                  <div class="bg-slate-800/80 backdrop-blur px-4 py-1 rounded-full border border-slate-700 inline-flex items-center justify-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-widest">Çevrimiçi</span>
                  </div>

                  <!-- Social Actions (If not me) -->
                  @if (user.id !== authService.currentUser()?.id) {
                     <div class="flex gap-2 mt-2 w-full justify-center">
                        <button (click)="toggleFriend(user.id)" class="flex-1 px-3 py-2 rounded text-xs font-bold border transition-colors flex items-center justify-center gap-1 max-w-[120px]"
                           [ngClass]="isFriend(user.id) ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'">
                           {{ isFriend(user.id) ? '✓ ARKADAŞ' : '+ EKLE' }}
                        </button>
                        <button (click)="socialService.openChat(user.id)" class="flex-1 px-3 py-2 rounded text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-1 max-w-[120px]">
                           💬 MESAJ
                        </button>
                     </div>
                  }
                </div>
              }
            </div>

            <!-- Basic Info & Stats -->
            <div class="flex-1 w-full text-center md:text-left">
               <div class="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                 <div>
                   <div class="flex items-center justify-center md:justify-start gap-3">
                      <h1 class="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">{{ user.username }}</h1>
                      @if(user.id !== authService.currentUser()?.id && user.isBot) {
                         <span class="px-2 py-0.5 rounded bg-purple-900/50 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase">BOT</span>
                      }
                   </div>
                   <p class="text-slate-400 text-sm md:text-lg font-light max-w-2xl mx-auto md:mx-0">{{ user.bio || 'Henüz bir biyografi eklenmedi.' }}</p>
                 </div>
                 
                 @if(!isEditing && user.id === authService.currentUser()?.id) {
                   <button (click)="startEditing()" class="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg border border-slate-600 font-bold transition-all hover:scale-105 flex items-center gap-2 text-sm">
                     <span>✏️</span> Düzenle
                   </button>
                 }
                 
                 @if(user.id !== authService.currentUser()?.id) {
                    <button (click)="viewMyProfile()" class="text-slate-500 hover:text-white text-xs underline">Profilime Dön</button>
                 }
               </div>

               <!-- Stats Grid -->
               <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <div class="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-center md:text-left">
                    <div class="text-slate-500 text-[10px] font-bold uppercase mb-1">Seviye</div>
                    <div class="text-xl md:text-2xl font-mono font-bold text-yellow-500">LVL {{ user.level }}</div>
                  </div>
                  <div class="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-center md:text-left">
                    <div class="text-slate-500 text-[10px] font-bold uppercase mb-1">Kral Tacı</div>
                    <div class="text-xl md:text-2xl font-mono font-bold text-yellow-500 flex items-center justify-center md:justify-start gap-2">
                       👑 {{ user.crowns.king }}
                    </div>
                  </div>
                  <div class="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-center md:text-left">
                    <div class="text-slate-500 text-[10px] font-bold uppercase mb-1">Kraliçe Tacı</div>
                    <div class="text-xl md:text-2xl font-mono font-bold text-pink-500 flex items-center justify-center md:justify-start gap-2">
                       👑 {{ user.crowns.queen }}
                    </div>
                  </div>
                  <div class="bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-center md:text-left">
                    <div class="text-slate-500 text-[10px] font-bold uppercase mb-1">Başarımlar</div>
                    <div class="text-xl md:text-2xl font-mono font-bold text-blue-400">{{ user.achievements.length }}</div>
                  </div>
               </div>
            </div>
          </div>

          <div class="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-8"></div>

          <!-- Content Area -->
          @if(isEditing) {
            <!-- EDIT FORM (Only for self) -->
            <form (submit)="saveChanges()" class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <!-- ... (Existing Form Fields) ... -->
              <div class="space-y-6">
                 <h3 class="text-xl font-bold text-white border-l-4 border-yellow-500 pl-3">Kişisel Bilgiler</h3>
                 
                 <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Biyografi</label>
                    <textarea [(ngModel)]="editData.bio" name="bio" rows="4" class="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors" placeholder="Kendinden bahset..."></textarea>
                 </div>

                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Cinsiyet</label>
                       <select [(ngModel)]="editData.gender" name="gender" class="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none">
                          <option value="Belirtilmemiş">Belirtilmemiş</option>
                          <option value="Erkek">Erkek</option>
                          <option value="Kadın">Kadın</option>
                          <option value="Diğer">Diğer</option>
                       </select>
                    </div>
                 </div>
              </div>
              <!-- ... -->
               <div class="col-span-full flex gap-4 pt-4 border-t border-slate-800">
                 <button type="button" (click)="cancelEdit()" class="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors">İptal</button>
                 <button type="submit" class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold shadow-lg hover:scale-[1.01] transition-transform">DEĞİŞİKLİKLERİ KAYDET</button>
              </div>
            </form>
          } @else {
            <!-- VIEW MODE -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in">
              
              <!-- Left Col -->
              <div class="space-y-6 lg:col-span-1">
                 <!-- Identity Card -->
                 <div class="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                    <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Kimlik Bilgileri</h3>
                    <div class="space-y-3">
                       <div class="flex justify-between border-b border-slate-800 pb-2">
                          <span class="text-slate-500">Cinsiyet</span>
                          <span class="text-white">{{ user.gender }}</span>
                       </div>
                       <div class="flex justify-between border-b border-slate-800 pb-2">
                          <span class="text-slate-500">Kayıt Tarihi</span>
                          <span class="text-white">2024</span>
                       </div>
                    </div>
                 </div>

                 <!-- Languages -->
                 <div class="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                    <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Konuşulan Diller</h3>
                    <div class="flex flex-wrap gap-2">
                       @for (lang of user.targetLanguages; track lang) {
                          <span class="px-3 py-1 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm">
                             {{ lang }}
                          </span>
                       }
                    </div>
                 </div>
              </div>

              <!-- Center/Right Col -->
              <div class="space-y-6 lg:col-span-2">
                 
                 <!-- Hobbies -->
                 <div class="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                    <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">İlgi Alanları & Hobiler</h3>
                    <div class="flex flex-wrap gap-2">
                       @for (hobby of user.hobbies; track hobby) {
                          <span class="px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-sm">
                             #{{ hobby }}
                          </span>
                       }
                    </div>
                 </div>

                 <!-- Badges -->
                 <div class="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                    <h3 class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Rozet Koleksiyonu</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                       @for (badge of user.achievements; track badge) {
                          <div class="aspect-square rounded-xl bg-slate-800 flex flex-col items-center justify-center gap-2 p-2 border border-slate-700 hover:border-yellow-500 transition-colors group cursor-help" title="{{ badge }}">
                             <div class="text-3xl drop-shadow-lg group-hover:scale-110 transition-transform">🏆</div>
                             <span class="text-xs text-center text-slate-300 font-medium leading-tight">{{ badge }}</span>
                          </div>
                       }
                    </div>
                 </div>
              </div>
            </div>

            <!-- LOGOUT BUTTON (Visible at bottom of profile for easy access) -->
             @if(user.id === authService.currentUser()?.id) {
                <div class="mt-8 p-6 border-t border-slate-800">
                   <button (click)="logout()" class="w-full py-4 bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/40 hover:text-red-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
                      </svg>
                      ÇIKIŞ YAP
                   </button>
                </div>
             }

            <!-- DISCOVER PEOPLE (Only visible on my own profile) -->
            @if(user.id === authService.currentUser()?.id) {
                <div class="mt-8 mb-8">
                   <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <span>🌍</span> Yeni İnsanlar Keşfet
                   </h3>
                   <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      @for(bot of socialService.allUsers(); track bot.id) {
                         @if(bot.id !== user.id) {
                             <div (click)="viewProfile(bot)" class="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-yellow-500 transition-colors cursor-pointer flex items-center gap-3 group">
                                <img [src]="bot.avatar" class="w-12 h-12 rounded-full border border-slate-600 group-hover:border-yellow-500 transition-colors">
                                <div class="flex-1 overflow-hidden">
                                   <div class="font-bold text-white truncate">{{ bot.username }}</div>
                                   <div class="text-xs text-slate-400 truncate">{{ bot.targetLanguages.join(', ') }}</div>
                                </div>
                                @if(bot.isFriend) {
                                   <span class="text-green-500 text-xs font-bold">Arkadaş</span>
                                }
                             </div>
                         }
                      }
                   </div>
                </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class ProfileComponent {
  authService = inject(AuthService);
  socialService = inject(SocialService);
  gameService = inject(GameService);
  
  isEditing = false;
  editData: UserProfile = {} as any;
  
  viewedProfile = signal<UserProfile | null>(null);

  displayUser = computed(() => this.viewedProfile() || this.authService.currentUser());

  viewProfile(user: UserProfile) {
      this.viewedProfile.set(user);
      this.isEditing = false;
  }

  viewMyProfile() {
      this.viewedProfile.set(null);
      this.isEditing = false;
  }

  toggleFriend(id: string) {
      this.socialService.toggleFriend(id);
  }

  isFriend(id: string) {
      const u = this.socialService.getById(id);
      return u ? u.isFriend : false;
  }

  startEditing() {
    const u = this.authService.currentUser();
    if(u) {
      this.editData = JSON.parse(JSON.stringify(u));
      this.editData.targetLanguages = this.editData.targetLanguages || [];
      this.editData.hobbies = this.editData.hobbies || [];
      this.isEditing = true;
    }
  }

  logout() {
      this.authService.logout();
      this.gameService.resetGame();
  }

  cancelEdit() { this.isEditing = false; }
  saveChanges() { this.authService.updateProfile(this.editData); this.isEditing = false; }
  randomizeAvatar() {
      const seed = Math.random().toString(36).substring(7);
      this.editData.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }
}
