
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, Player, GameCard } from '../services/game.service';
import { AudioService } from '../services/audio.service';
import { AuthService, UserProfile } from '../services/auth.service';
import { SocialService } from '../services/social.service';

// Import sub-components
import { GameRoundComponent } from './game-round.component';
import { FinalRoundComponent } from './final-round.component';

@Component({
  selector: 'app-active-game',
  standalone: true,
  imports: [CommonModule, GameRoundComponent, FinalRoundComponent],
  template: `
    <div class="h-full w-full bg-black text-white flex flex-col relative overflow-hidden font-sans select-none">
      
      <!-- === DYNAMIC STAGE BACKGROUND === -->
      <div class="absolute inset-0 pointer-events-none z-0">
         <!-- Top Spotlight (Conical) -->
         <div class="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[80%] bg-[conic-gradient(from_180deg,transparent_0deg,rgba(255,255,255,0.03)_20deg,transparent_40deg)]"></div>
         <!-- Ambient Glow -->
         <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_80%)]"></div>
         <!-- Floor Grid Reflection -->
         <div class="absolute bottom-0 left-0 right-0 h-1/3 bg-[linear-gradient(to_bottom,transparent_0%,rgba(56,189,248,0.05)_100%)] [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
      </div>

      <!-- === FIREWORKS OVERLAY (WINNER REVEAL) === -->
      @if (gameService.gameState() === 'WINNER_REVEAL') {
         <div class="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
             <div class="firework"></div>
             <div class="firework" style="animation-delay: -1s; left: 20%;"></div>
             <div class="firework" style="animation-delay: -2.5s; left: 80%;"></div>
             <div class="firework" style="animation-delay: -1.5s; left: 40%;"></div>
         </div>
      }

      <!-- === ROUND PREPARATION SCREEN (GREEN ROOM) === -->
      @if (gameService.gameState() === 'PREPARE_ROUND') {
         <div class="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div class="w-24 h-1 bg-yellow-500 mb-8 shadow-[0_0_20px_rgba(234,179,8,0.8)]"></div>
             <h2 class="text-yellow-500 text-lg uppercase tracking-[0.5em] font-bold mb-4 animate-pulse">Sıradaki Tur Yükleniyor</h2>
             <h1 class="text-5xl md:text-7xl font-black text-white mb-6">{{ gameService.nextRoundTitle() }}</h1>
             <p class="max-w-2xl text-xl text-slate-300 leading-relaxed mb-12 font-light border-l-4 border-yellow-500 pl-6 text-left bg-slate-900/50 p-6 rounded-r-xl shadow-2xl">
                {{ gameService.nextRoundDesc() }}
             </p>
             
             @if(isPatron()) {
                <button (click)="gameService.proceedToNextRound()" class="group relative px-12 py-5 bg-green-600 overflow-hidden rounded-full shadow-[0_0_50px_rgba(22,163,74,0.5)] transition-all hover:scale-105">
                    <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span class="font-black text-2xl text-white relative z-10">TURU BAŞLAT 🚀</span>
                </button>
             } @else {
                <div class="flex items-center gap-3 text-slate-500 bg-black/30 px-6 py-3 rounded-full">
                   <div class="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                   <span class="tracking-widest font-bold text-xs">YÖNETİCİ BEKLENİYOR</span>
                </div>
             }
         </div>
      }

      <!-- === TRANSITION SCREEN === -->
      @if (gameService.gameState() === 'TRANSITION') {
          <div class="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in text-center">
              <h1 class="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-red-600 mb-4 animate-scale-up">
                  {{ gameService.transitionTitle() }}
              </h1>
              <h2 class="text-2xl md:text-4xl text-white font-bold tracking-[0.5em] uppercase animate-pulse">
                  {{ gameService.transitionSubtitle() }}
              </h2>
          </div>
      }

      <!-- === GAME HEADER (CLEAN & CHIC) === -->
      <div class="absolute top-0 left-0 w-full h-24 z-40 flex items-start justify-between px-6 py-4 pointer-events-none">
         
         <!-- Left: Game Info -->
         <div class="pointer-events-auto flex flex-col">
            <div class="flex items-center gap-2 mb-1">
                <div class="text-2xl drop-shadow-lg">👑</div>
                <h1 class="text-xl font-black tracking-widest text-yellow-500 uppercase drop-shadow-md hidden md:block">Team Crown</h1>
            </div>
            <div class="bg-black/40 backdrop-blur-md border-l-2 border-yellow-500 pl-3 pr-4 py-1 rounded-r-lg">
                <div class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">{{ getPhaseTitle() }}</div>
                <div class="text-[10px] text-blue-300">{{ gameService.roundInstruction() }}</div>
            </div>
         </div>

         <!-- Center: Patron (Floating) -->
         @if (gameService.currentPatron(); as patron) {
            <div class="pointer-events-auto absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-b from-slate-900 to-slate-900/0 pt-4 pb-8 px-6 rounded-b-3xl flex flex-col items-center z-30">
                <div class="text-[9px] text-yellow-600 uppercase font-bold tracking-[0.2em] mb-1">Prodüktör</div>
                <div class="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                    <img [src]="patron.avatar" class="w-8 h-8 rounded-full border border-yellow-600/50">
                    <span class="font-bold text-white text-sm tracking-wide">{{ patron.name }}</span>
                </div>
            </div>
         }

         <!-- Right: Controls & Timer -->
         <div class="pointer-events-auto flex items-start gap-4">
             <!-- Timer -->
             @if(!gameService.activeCard() && gameService.timerValue() > 0) {
                 <div class="bg-black/50 backdrop-blur rounded-lg px-4 py-2 border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                    <span class="text-4xl font-mono font-black text-red-500 animate-pulse">
                        {{ gameService.timerValue() }}
                    </span>
                 </div>
             }
             
             <!-- Menu Button -->
             <div class="relative group">
                 <button (click)="menuOpen = !menuOpen" class="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-600 hover:border-yellow-500 flex items-center justify-center transition-all shadow-lg hover:rotate-90 backdrop-blur">
                     <span class="text-xl text-slate-300 group-hover:text-white">⚙️</span>
                 </button>
                 
                 @if(menuOpen) {
                    <div class="absolute top-14 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
                        <div class="p-3 border-b border-slate-800 bg-slate-950/50">
                            <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Menü</span>
                        </div>
                        
                        <!-- Profile Actions -->
                        <button (click)="openMyProfile()" class="w-full px-4 py-3 text-left hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2">
                           <span>👤</span> Profilim
                        </button>

                        @if(isPatron()) {
                            <div class="h-px bg-slate-800 my-1"></div>
                            <button (click)="gameService.muteAll(true)" class="w-full px-4 py-3 text-left hover:bg-slate-800 text-red-400 font-bold text-sm">🔇 Herkesi Sustur</button>
                            <button (click)="gameService.muteAll(false)" class="w-full px-4 py-3 text-left hover:bg-slate-800 text-green-400 font-bold text-sm">🎤 Herkesi Aç</button>
                            <button (click)="gameService.startNextRoundPreparation()" class="w-full px-4 py-3 text-left hover:bg-slate-800 text-blue-400 font-bold text-sm">⏭ Turu Bitir</button>
                        }
                        
                        <div class="h-px bg-slate-800 my-1"></div>
                        <button (click)="gameService.leaveGame()" class="w-full px-4 py-3 text-left hover:bg-red-900/20 text-white font-bold text-sm flex items-center gap-2">
                            <span>🚪</span> Çıkış
                        </button>
                    </div>
                    <div class="fixed inset-0 z-40" (click)="menuOpen = false"></div>
                 }
             </div>
         </div>
      </div>

      <!-- === MAIN STAGE AREA (Cards/Content) === -->
      <div class="flex-1 relative z-10 flex flex-col justify-center pb-32"> 
         @switch (gameService.gameState()) {
            @case ('ROUND_1') { <app-game-round class="h-full block" /> }
            @case ('ROUND_2') { <app-game-round class="h-full block" /> }
            @case ('ROUND_3') { <app-final-round class="h-full block" /> }
            @case ('WINNER_REVEAL') { <app-final-round class="h-full block" /> }
            @default { <app-game-round class="h-full block" /> }
         }

         <!-- === ACTIVE CARD OVERLAY === -->
         @if (gameService.activeCard(); as active) {
            <div class="absolute inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center animate-zoom-in p-4 md:p-12">
               <!-- Confetti for Luck -->
               @if(active.type === 'LUCK') {
                   <div class="absolute inset-0 pointer-events-none"><div class="firework"></div></div>
               }

               <div class="w-full max-w-6xl h-full max-h-[80vh] bg-slate-900 rounded-[3rem] border-4 shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden"
                    [ngClass]="{'border-green-500': active.type==='TASK', 'border-red-600': active.type==='PUNISHMENT', 'border-yellow-400': active.type==='LUCK'}">
                  
                  @if(active.content.includes('YÜKLENİYOR')) {
                      <div class="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/40 backdrop-blur-sm">
                          <div class="text-4xl font-black text-white animate-bounce tracking-widest mb-4">AI ÜRETİYOR...</div>
                      </div>
                  }

                  <!-- Timer Bar -->
                  @if(gameService.isTimerRunning()) {
                      <div class="absolute top-0 left-0 h-3 bg-slate-800 w-full z-20">
                          <div class="h-full transition-all duration-1000 ease-linear shadow-[0_0_15px_currentColor]"
                               [style.width.%]="(gameService.timerValue() / gameService.timerMax()) * 100"
                               [ngClass]="gameService.timerValue() < 10 ? 'bg-red-600' : 'bg-green-500'">
                          </div>
                      </div>
                  }

                  <div class="flex-1 flex flex-col lg:flex-row relative">
                      <!-- Left: Card Content -->
                      <div class="flex-[3] p-8 flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-white/5">
                          <div class="mb-8 px-8 py-2 rounded-full border text-lg font-black uppercase tracking-[0.3em] bg-black/40 backdrop-blur shadow-xl"
                               [ngClass]="active.type === 'PUNISHMENT' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-400'">
                             {{ active.type === 'TASK' ? 'GÖREV' : (active.type === 'PUNISHMENT' ? 'CEZA' : 'ŞANS KARTI') }}
                          </div>
                          <div class="text-2xl md:text-4xl font-bold leading-snug text-white whitespace-pre-wrap drop-shadow-2xl max-w-3xl">
                             {{ active.content }}
                          </div>
                      </div>

                      <!-- Right: Active Player Spotlight -->
                      <div class="flex-[2] bg-black/40 p-8 flex flex-col items-center justify-center relative">
                          @if(gameService.activePlayer(); as p) {
                              <div class="relative">
                                <div class="absolute inset-0 bg-white/20 blur-2xl rounded-full animate-pulse"></div>
                                <img [src]="p.avatar" class="relative w-40 h-40 rounded-full border-[6px] border-white shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-4 object-cover">
                              </div>
                              <div class="text-3xl font-black text-white mb-1 drop-shadow-lg">{{ p.name }}</div>
                              <div class="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-6">
                                  {{ p.gender === 'Kadın' ? 'KRALİÇE' : (p.gender === 'Erkek' ? 'KRAL' : 'OYUNCU') }}
                              </div>
                              
                              @if(p.hasJoker && active.type !== 'LUCK') {
                                  <button (click)="gameService.useJoker(p.id)" class="py-3 px-8 bg-purple-600 rounded-full font-bold hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all transform hover:scale-105">
                                    🃏 JOKER KULLAN
                                  </button>
                              }
                          }
                      </div>
                  </div>

                  @if (isPatron()) {
                      <div class="h-24 bg-slate-950 border-t border-white/10 flex items-center justify-center gap-6 px-8 z-30">
                          <button (click)="gameService.judgeActivePlayer(true)" class="flex-1 py-4 bg-green-600 rounded-xl font-black text-2xl hover:scale-105 transition-transform shadow-lg hover:shadow-green-900/50">BAŞARILI ✅</button>
                          <button (click)="gameService.judgeActivePlayer(false)" class="flex-1 py-4 bg-red-600 rounded-xl font-black text-2xl hover:scale-105 transition-transform shadow-lg hover:shadow-red-900/50">BAŞARISIZ ❌</button>
                      </div>
                  }
               </div>
            </div>
         }
      </div>

      <!-- === BOTTOM PLAYER PANEL (THE "RICH" LOOK) === -->
      <div class="fixed bottom-0 left-0 w-full h-32 z-30 bg-gradient-to-t from-black via-slate-900/95 to-transparent flex items-end pb-2 px-4 md:px-8 select-none pointer-events-auto">
         
         <!-- Left Side: Waiting Players (Colorful, Active) -->
         <div class="flex-1 flex items-center gap-4 overflow-x-auto custom-scrollbar h-24 pr-8 border-r border-white/10">
            <div class="text-[10px] font-bold uppercase text-green-400 tracking-widest writing-vertical rotate-180 hidden md:block opacity-70">KULİS</div>
            
            @for(player of gameService.waitingPlayers(); track player.id) {
                <div (click)="handlePlayerClick(player)" 
                     class="group relative flex flex-col items-center cursor-pointer transition-all hover:-translate-y-2 min-w-[70px]">
                    <!-- Avatar Container -->
                    <div class="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-pink-600 shadow-[0_0_15px_rgba(234,179,8,0.3)] group-hover:shadow-[0_0_25px_rgba(234,179,8,0.6)] transition-shadow">
                        <img [src]="player.avatar" class="w-full h-full rounded-full object-cover border-2 border-black">
                    </div>
                    
                    <!-- Name Tag -->
                    <div class="mt-1 bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-bold text-white truncate max-w-[80px] border border-slate-600 group-hover:border-yellow-500 transition-colors">
                        {{ player.name }}
                    </div>

                    <!-- Badges -->
                    @if(player.hasJoker) { 
                        <span class="absolute -top-1 -right-1 bg-purple-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm border border-white/20">🃏</span> 
                    }
                </div>
            }
            
            @if(gameService.waitingPlayers().length === 0 && gameService.gameState() !== 'ROUND_3') {
                <div class="text-slate-500 text-xs italic pl-2">Herkes turunu tamamladı.</div>
            }
         </div>

         <!-- Right Side: Bench / Eliminated (Desaturated, Background) -->
         <div class="flex items-center gap-3 overflow-x-auto custom-scrollbar h-20 pl-8 opacity-80">
             <div class="text-[10px] font-bold uppercase text-slate-600 tracking-widest writing-vertical rotate-180 hidden md:block">TRIBÜN</div>
             
             @for(player of gameService.benchPlayers(); track player.id) {
                 <div (click)="handlePlayerClick(player)" 
                      class="flex flex-col items-center cursor-pointer transition-all hover:opacity-100 hover:scale-105 min-w-[50px]"
                      [ngClass]="player.status === 'ELIMINATED' ? 'grayscale opacity-50 hover:grayscale-0' : 'opacity-70'">
                     
                     <div class="relative">
                         <img [src]="player.avatar" class="w-10 h-10 rounded-full border border-slate-600 bg-slate-800 object-cover">
                         @if(player.status === 'ELIMINATED') {
                             <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                 <div class="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red]"></div>
                             </div>
                         }
                     </div>
                     <span class="text-[9px] text-slate-400 mt-0.5 max-w-[60px] truncate">{{ player.name }}</span>
                     <span class="text-[9px] font-mono text-yellow-600 font-bold">{{ player.score }}</span>
                 </div>
             }
         </div>
      </div>

      <!-- === PROFILE MODAL === -->
      @if (selectedProfile) {
          <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="selectedProfile = null"></div>
              <div class="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-zoom-in">
                  <div class="text-center">
                      <div class="relative inline-block">
                          <img [src]="selectedProfile.avatar" class="w-24 h-24 rounded-full border-4 border-yellow-500 mx-auto mb-4 shadow-lg object-cover bg-slate-800">
                          @if(selectedProfile.isBot) {
                              <span class="absolute bottom-4 right-0 px-1.5 py-0.5 bg-purple-600 text-[8px] font-bold rounded uppercase text-white">BOT</span>
                          }
                      </div>
                      <h2 class="text-2xl font-black text-white mb-1">{{ selectedProfile.username }}</h2>
                      <div class="text-yellow-500 font-bold text-sm uppercase tracking-widest mb-6">
                          {{ selectedProfile.gender === 'Kadın' ? 'KRALİÇE' : (selectedProfile.gender === 'Erkek' ? 'KRAL' : 'AVCI') }}
                      </div>
                      
                      <div class="grid grid-cols-2 gap-4 mb-6">
                          <div class="bg-slate-800 p-3 rounded-xl">
                              <div class="text-xs text-slate-400 uppercase font-bold">Seviye</div>
                              <div class="text-xl font-bold text-white">{{ selectedProfile.level }}</div>
                          </div>
                          <div class="bg-slate-800 p-3 rounded-xl">
                              <div class="text-xs text-slate-400 uppercase font-bold">Taçlar</div>
                              <div class="text-xl font-bold text-yellow-400">👑 {{ selectedProfile.crowns.king + selectedProfile.crowns.queen }}</div>
                          </div>
                      </div>
                      
                      @if(selectedProfile.id !== authService.currentUser()?.id) {
                          <div class="flex gap-3">
                              <button (click)="socialService.toggleFriend(selectedProfile.id)" class="flex-1 py-3 rounded-xl font-bold border transition-colors text-xs"
                                      [ngClass]="socialService.getById(selectedProfile.id)?.isFriend ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'">
                                  {{ socialService.getById(selectedProfile.id)?.isFriend ? 'ARKADAŞSINIZ' : 'ARKADAŞ EKLE' }}
                              </button>
                              <button (click)="socialService.openChat(selectedProfile.id); selectedProfile = null" class="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white text-xs hover:bg-blue-500">
                                  MESAJ
                              </button>
                          </div>
                      }

                      <button (click)="selectedProfile = null" class="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                  </div>
              </div>
          </div>
      }

    </div>
  `,
  styles: [`
    .animate-shimmer { background-size: 200% auto; animation: shimmer 3s linear infinite; }
    @keyframes shimmer { to { background-position: 200% center; } }
    .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .writing-vertical { writing-mode: vertical-rl; }
    
    .firework, .firework::before, .firework::after {
      position: absolute;
      top: 50%; left: 50%;
      width: 5px; height: 5px;
      border-radius: 50%;
      box-shadow: 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff, 0 0 #fff;
      animation: firework 1s ease-out infinite;
      content: '';
      pointer-events: none;
    }
    @keyframes firework {
      0% { transform: translate(var(--x), var(--initialY)); width: 5px; opacity: 1; }
      50% { width: 5px; opacity: 1; }
      100% { width: 10px; opacity: 0; box-shadow: 0 -80px 20px #ff0, 60px -60px 20px #f0f, 80px 0 20px #0ff, 60px 60px 20px #0f0, 0 80px 20px #00f, -60px 60px 20px #fff, -80px 0 20px #ff0, -60px -60px 20px #f0f; }
    }
  `]
})
export class ActiveGameComponent {
  gameService = inject(GameService);
  authService = inject(AuthService);
  socialService = inject(SocialService);
  
  menuOpen = false;
  selectedProfile: any = null;

  isPatron() { 
      const me = this.authService.currentUser();
      return this.gameService.currentPatron()?.id === me?.id; 
  }

  getPhaseTitle() {
      const s = this.gameService.gameState();
      if(s === 'ROUND_1') return '1. TUR: ISINMA';
      if(s === 'ROUND_2') return '2. TUR: ODAK';
      if(s === 'ROUND_3') return '3. TUR: FİNAL';
      if(s === 'WINNER_REVEAL') return 'ŞAMPİYON';
      return '';
  }

  openMyProfile() {
      this.selectedProfile = this.authService.currentUser();
      this.menuOpen = false;
  }

  handlePlayerClick(p: Player) {
     // If clicking waiting players and Patron, put on stage
     if(this.isPatron() && !p.hasPlayedInRound && p.status === 'ACTIVE' && !this.gameService.activeCard()) {
         this.gameService.setPlayerOnStage(p.id);
         return;
     }
     
     // Otherwise show profile
     const fullProfile = this.socialService.getById(p.id) || {
         ...p, 
         level: 1, crowns: {king:0, queen:0}, username: p.name
     };
     this.selectedProfile = fullProfile;
  }
}
