
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full relative overflow-hidden bg-slate-950">
      <!-- Background Ambience -->
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 h-full flex flex-col p-6 md:p-10 max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
          <div>
            <h2 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2 tracking-tight">
              Canlı Odalar
            </h2>
            <p class="text-slate-400 font-light">Sana uygun bir evren seç ve maceraya katıl.</p>
          </div>
          
          <button (click)="showCreateModal = true" class="group relative px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105">
            <div class="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span class="flex items-center gap-2 text-lg">
              <span>⚡</span> ODA OLUŞTUR
            </span>
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center mb-8 shadow-xl">
          <div class="relative flex-1 w-full">
             <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
             <input type="text" [(ngModel)]="searchTerm" placeholder="Oda adı veya ID ara..." 
                    class="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" />
          </div>
          
          <div class="flex gap-4 w-full md:w-auto">
            <select [(ngModel)]="filterDiff" class="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none cursor-pointer hover:border-slate-500">
              <option value="">Tüm Zorluklar</option>
              <option value="Kolay">Kolay</option>
              <option value="Orta">Orta</option>
              <option value="Zor">Zor</option>
            </select>
          </div>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-20">
          
          <!-- Room Card -->
          @for(room of filteredRooms(); track room.id) {
            <div class="group relative bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-900/10 overflow-hidden">
               <!-- Hover Glow -->
               <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
               <div class="relative z-10">
                 <div class="flex justify-between items-start mb-4">
                   <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-700">
                        {{ getFlag(room.lang) }}
                      </div>
                      <div>
                        <h3 class="font-bold text-white text-lg leading-tight">{{ room.name }}</h3>
                        <div class="flex items-center gap-2 mt-1">
                           <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{{ room.difficulty }}</span>
                           <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/30">{{ room.lang }}</span>
                        </div>
                      </div>
                   </div>
                   
                   <div class="flex flex-col items-end">
                     <span class="flex items-center gap-1 text-green-400 font-bold text-xs bg-green-900/20 px-2 py-1 rounded-full animate-pulse">
                       ● CANLI
                     </span>
                   </div>
                 </div>

                 <div class="space-y-3 mb-6">
                   <div class="flex justify-between text-sm text-slate-400">
                     <span>👑 Patron</span>
                     <span class="text-white">{{ room.patron }}</span>
                   </div>
                   <div class="flex justify-between text-sm text-slate-400">
                     <span>👥 Oyuncular</span>
                     <span class="text-white">{{ room.players }}/{{ room.max }}</span>
                   </div>
                   
                   <!-- Progress Bar -->
                   <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                     <div class="h-full bg-gradient-to-r from-yellow-500 to-purple-600" [style.width.%]="(room.players / room.max) * 100"></div>
                   </div>
                 </div>

                 <button (click)="joinRoom(room.id)" class="w-full py-3 bg-slate-800 hover:bg-white hover:text-black text-white font-bold rounded-xl transition-colors border border-slate-700">
                   ODAYA KATIL
                 </button>
               </div>
            </div>
          }

          @if(filteredRooms().length === 0) {
            <div class="col-span-full py-20 text-center text-slate-500">
              <div class="text-4xl mb-4">🌑</div>
              <p>Aradığın kriterlerde oda bulunamadı.</p>
            </div>
          }
        </div>
      </div>

      <!-- CREATE MODAL -->
      @if (showCreateModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="showCreateModal = false"></div>
          
          <div class="relative z-10 bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-fade-up">
             <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
               <span class="text-yellow-500">⚡</span> Yeni Oda Oluştur
             </h2>

             <div class="space-y-4">
               <div>
                 <label class="block text-xs uppercase text-slate-400 font-bold mb-1">Oda Adı</label>
                 <input [(ngModel)]="newRoom.name" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none">
               </div>

               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <label class="block text-xs uppercase text-slate-400 font-bold mb-1">Hedef Dil</label>
                   <select [(ngModel)]="newRoom.lang" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none">
                      @for(lang of gameService.availableLanguages; track lang) {
                        <option [value]="lang">{{ lang }}</option>
                      }
                   </select>
                 </div>
                 <div>
                   <label class="block text-xs uppercase text-slate-400 font-bold mb-1">Zorluk</label>
                   <select [(ngModel)]="newRoom.difficulty" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none">
                      <option value="Kolay">Kolay</option>
                      <option value="Orta">Orta</option>
                      <option value="Zor">Zor</option>
                   </select>
                 </div>
               </div>
               
               <div>
                 <label class="block text-xs uppercase text-slate-400 font-bold mb-1">Maksimum Oyuncu</label>
                 <input type="range" min="4" max="20" [(ngModel)]="newRoom.max" class="w-full accent-yellow-500">
                 <div class="text-right text-white font-mono">{{ newRoom.max }} Kişi</div>
               </div>

               <div class="pt-4 flex gap-3">
                 <button (click)="showCreateModal = false" class="flex-1 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">İptal</button>
                 <button (click)="createRoom()" class="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:brightness-110 transition-all">
                   OLUŞTUR
                 </button>
               </div>
             </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-up { animation: fadeUp 0.3s ease-out; }
    @keyframes fadeUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class RoomListComponent {
  gameService = inject(GameService);
  
  showCreateModal = false;
  searchTerm = '';
  filterDiff = '';
  
  newRoom = {
    name: 'Yeni Macera',
    lang: 'İngilizce',
    difficulty: 'Orta',
    max: 12
  };

  // Mock Rooms
  rooms = [
    { id: '1', name: 'English Masters', lang: 'İngilizce', difficulty: 'Zor', patron: 'JohnDoe', players: 12, max: 15 },
    { id: '2', name: 'Hablemos Español', lang: 'İspanyolca', difficulty: 'Orta', patron: 'Maria', players: 5, max: 10 },
    { id: '3', name: 'Deutsch Anfänger', lang: 'Almanca', difficulty: 'Kolay', patron: 'Hans', players: 8, max: 12 },
    { id: '4', name: 'French Coffee', lang: 'Fransızca', difficulty: 'Orta', patron: 'Pierre', players: 2, max: 8 },
  ];

  filteredRooms() {
    return this.rooms.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDiff = this.filterDiff ? r.difficulty === this.filterDiff : true;
      return matchesSearch && matchesDiff;
    });
  }

  getFlag(lang: string) {
    const map: any = { 'İngilizce': '🇬🇧', 'İspanyolca': '🇪🇸', 'Almanca': '🇩🇪', 'Fransızca': '🇫🇷', 'Türkçe': '🇹🇷' };
    return map[lang] || '🌍';
  }

  createRoom() {
    this.gameService.createNewRoom({
      roomName: this.newRoom.name,
      targetLanguage: this.newRoom.lang,
      difficulty: this.newRoom.difficulty as any,
      maxPlayers: this.newRoom.max
    });
    this.showCreateModal = false;
  }

  joinRoom(id: string) {
    this.gameService.enterLobby();
  }
}
