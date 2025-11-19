
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { GameService } from './services/game.service';

// Components
import { LoginComponent } from './components/login.component';
import { ProfileComponent } from './components/profile.component';
import { RoomListComponent } from './components/room-list.component';
import { LobbyComponent } from './components/lobby.component';
import { ActiveGameComponent } from './components/active-game.component';
import { ChatDrawerComponent } from './components/chat-drawer.component';

type ViewState = 'LOGIN' | 'ROOMS' | 'PROFILE' | 'GAME_LOBBY' | 'GAME_ACTIVE';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    ProfileComponent,
    RoomListComponent,
    LobbyComponent,
    ActiveGameComponent,
    ChatDrawerComponent
  ],
  template: `
    <div class="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
      
      @if (authService.currentUser(); as user) {
        <!-- Authenticated Header (Minimalist for Game Immersion) -->
        @if (view() !== 'GAME_ACTIVE') {
            <header class="h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-lg z-40 shrink-0">
              <!-- Logo -->
              <div (click)="goHome()" class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none">
                <div class="text-2xl filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">👑</div>
                <h1 class="font-bold tracking-widest text-yellow-500 text-lg md:text-xl hidden min-[350px]:block">TEAM CROWN</h1>
              </div>

              <!-- Right Actions -->
              <div class="flex items-center gap-3">
                
                <!-- Level Bar (Hidden on small mobile) -->
                <div class="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                   <span class="text-yellow-500 text-xs font-bold">Lvl {{ user.level }}</span>
                   <div class="h-2 w-20 bg-slate-700 rounded-full overflow-hidden">
                      <div class="h-full bg-yellow-500 w-3/4 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                   </div>
                </div>

                <!-- Profile Button (Only in Menu/Lobby) -->
                <button (click)="view.set('PROFILE')" class="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded-lg transition-colors group relative">
                   <img [src]="user.avatar" class="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-yellow-500 group-hover:scale-105 transition-transform bg-slate-800 object-cover">
                   <span class="hidden md:block font-medium text-sm">{{ user.username }}</span>
                </button>
              </div>
            </header>
        }

        <!-- Main Content -->
        <main class="flex-1 overflow-hidden relative w-full">
           @switch (view()) {
             @case ('PROFILE') { <app-profile /> }
             @case ('ROOMS') { <app-room-list /> }
             @case ('GAME_LOBBY') { <app-lobby /> }
             @case ('GAME_ACTIVE') { <app-active-game /> }
             @default { <app-room-list /> }
           }
        </main>

        <!-- Global Chat Drawer -->
        <app-chat-drawer />

      } @else {
        <!-- Login Screen -->
        <app-login />
      }
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);
  gameService = inject(GameService);
  
  view = signal<ViewState>('ROOMS');

  constructor() {
      // Auto-redirect Logic
      effect(() => {
          const gs = this.gameService.gameState();
          
          // Only redirect if logged in
          if (!this.authService.currentUser()) return;

          // Don't force redirect if user explicitly wants to see profile
          if (this.view() === 'PROFILE') return;

          if (gs === 'MENU') {
              this.view.set('ROOMS');
          } else if (gs === 'LOBBY') {
              this.view.set('GAME_LOBBY');
          } else if (['ROUND_1', 'ROUND_2', 'ROUND_3', 'ROUND_FINAL', 'WINNER_REVEAL', 'PREPARE_ROUND', 'TRANSITION'].includes(gs)) {
              this.view.set('GAME_ACTIVE');
          }
      }, { allowSignalWrites: true });
  }

  goHome() {
      const gs = this.gameService.gameState();
      if (gs === 'LOBBY') {
          this.view.set('GAME_LOBBY');
      } else if (this.isGameActive()) {
          this.view.set('GAME_ACTIVE'); 
      } else {
          this.view.set('ROOMS');
      }
  }

  isGameActive() {
      const gs = this.gameService.gameState();
      return ['ROUND_1', 'ROUND_2', 'ROUND_3', 'ROUND_FINAL', 'PREPARE_ROUND', 'TRANSITION', 'WINNER_REVEAL'].includes(gs);
  }

  logout() {
    this.authService.logout();
    this.gameService.resetGame(); 
  }
}
