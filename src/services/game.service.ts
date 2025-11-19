
import { Injectable, signal, computed, inject } from '@angular/core';
import { GeminiService } from './gemini.service';
import { AudioService } from './audio.service';
import { AuthService } from './auth.service';
import { SocialUser } from './social.service';

export type GameState = 'MENU' | 'LOBBY' | 'TRANSITION' | 'PREPARE_ROUND' | 'ROUND_1' | 'ROUND_2' | 'ROUND_3' | 'WINNER_REVEAL';
export type Round3Stage = 'WAITING' | 'WRONG_WORD' | 'QUERY' | 'RIDDLE';
export type PlayerStatus = 'ACTIVE' | 'ELIMINATED' | 'SPECTATOR';
export type CardType = 'TASK' | 'PUNISHMENT' | 'LUCK' | 'EMPTY';
export type GameMode = 'INDIVIDUAL' | 'TEAM';

export interface GameSettings {
  roomId: string;
  roomName: string;
  targetLanguage: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor' | 'Expert';
  maxPlayers: number;
  isPrivate: boolean;
  isPublished: boolean;
  mode: GameMode;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  status: PlayerStatus;
  team?: 'KING' | 'QUEEN';
  isPatron: boolean; 
  avatarColor: string;
  isMutedByPatron: boolean; 
  lastDelta?: number;
  lastDeltaTime?: number;
  badges: string[];
  isBot: boolean;
  avatar: string;
  gender: 'Erkek' | 'Kadın' | 'Belirtilmemiş';
  hasJoker: boolean;
  hasPlayedInRound: boolean; 
}

export interface GameCard {
  id: number | string;
  type: CardType;
  content: string;
  isRevealed: boolean;
  label: string;
  ariaLabel: string; 
  colorClass?: string; 
  orbType?: 'GOLD' | 'COLOR'; 
  completed?: boolean;
  colorName?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private geminiService = inject(GeminiService);
  private audioService = inject(AudioService);
  private authService = inject(AuthService);

  // Settings
  settings = signal<GameSettings>({
    roomId: 'RM-' + Math.floor(Math.random() * 10000),
    roomName: 'DİL AVCILARI',
    targetLanguage: 'İngilizce',
    difficulty: 'Orta',
    maxPlayers: 12,
    isPrivate: false,
    isPublished: false,
    mode: 'INDIVIDUAL'
  });

  availableLanguages = ['İngilizce', 'İspanyolca', 'Almanca', 'Fransızca', 'İtalyanca', 'Rusça', 'Türkçe'];

  // State
  gameState = signal<GameState>('MENU'); 
  round3Stage = signal<Round3Stage>('WAITING');
  transitionTitle = signal<string>('');
  transitionSubtitle = signal<string>('');
  
  // Preparation Screen Data
  nextRoundTitle = signal<string>('');
  nextRoundDesc = signal<string>('');

  players = signal<Player[]>([]);
  currentRoundCards = signal<GameCard[]>([]);
  roundInstruction = signal<string>('Oyun başlamayı bekliyor.');
  gameLog = signal<string[]>([]);
  
  timerValue = signal<number>(0);
  timerMax = signal<number>(1); 
  isTimerRunning = signal<boolean>(false);
  
  activeCard = signal<GameCard | null>(null);
  activePlayerId = signal<string | null>(null);
  winnerPlayer = signal<Player | null>(null);
  
  // Round 3 Content State
  finalRoundContent = signal<string>('');
  
  // Computed
  activePlayer = computed(() => this.players().find(p => p.id === this.activePlayerId()));
  currentPatron = computed(() => this.players().find(p => p.isPatron));
  
  // Sorters
  contestants = computed(() => this.players().filter(p => !p.isPatron));
  waitingPlayers = computed(() => this.players().filter(p => !p.isPatron && p.status === 'ACTIVE' && !p.hasPlayedInRound));
  benchPlayers = computed(() => this.players().filter(p => !p.isPatron && (p.hasPlayedInRound || p.status === 'ELIMINATED')));
  sortedPlayers = computed(() => this.players().slice().sort((a, b) => b.score - a.score));
  top3Players = computed(() => this.contestants().filter(p => p.status === 'ACTIVE').sort((a,b) => b.score - a.score).slice(0,3));
  
  kingTeamScore = computed(() => this.players().filter(p => p.team === 'KING').reduce((acc, p) => acc + p.score, 0));
  queenTeamScore = computed(() => this.players().filter(p => p.team === 'QUEEN').reduce((acc, p) => acc + p.score, 0));

  private timerInterval: any;
  
  // Holds the randomized list of types for the current round.
  // Mapped by index to the cards.
  private currentRoundDeckMap: Map<number | string, CardType> = new Map();

  // --- Initialization ---

  enterLobby() {
    this.gameState.set('LOBBY');
    this.roundInstruction.set('Kral/Kraliçe Seçimi Bekleniyor.');
    
    const me = this.authService.currentUser();
    if (me && !this.players().some(p => p.id === me.id)) {
       this.addPlayer(me.username, true, me.avatar, me.id, me.gender as any);
    } else if (this.players().length === 0) {
       this.addPlayer('Yönetici', true, undefined, me?.id, 'Belirtilmemiş');
    }
  }

  createNewRoom(settings: Partial<GameSettings>) {
    this.settings.update(s => ({
      ...s,
      ...settings,
      roomId: 'RM-' + Math.floor(1000 + Math.random() * 9000),
    }));
    this.players.set([]); 
    const me = this.authService.currentUser();
    this.addPlayer(me ? me.username : 'Yönetici', true, me?.avatar, me?.id, me?.gender as any);
    this.enterLobby();
  }

  publishRoom() {
    this.settings.update(s => ({ ...s, isPublished: true }));
    this.audioService.playSuccess();
  }

  // --- Player Management ---

  addPlayer(name: string, forcePatron = false, avatarUrl?: string, existingId?: string, gender: 'Erkek'|'Kadın'|'Belirtilmemiş' = 'Belirtilmemiş') {
    const newPlayer: Player = {
      id: existingId || (Date.now().toString() + Math.random()),
      name,
      score: 0,
      status: 'ACTIVE',
      isPatron: forcePatron || this.players().length === 0,
      avatarColor: this.getRandomColor(),
      isMutedByPatron: false,
      badges: [],
      isBot: false,
      avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      team: Math.random() > 0.5 ? 'KING' : 'QUEEN', 
      gender: gender,
      hasJoker: false,
      hasPlayedInRound: false
    };
    this.players.update(list => {
        if(list.some(p => p.id === newPlayer.id)) return list;
        return [...list, newPlayer];
    });
    
    if (this.players().length > 1) {
       this.audioService.playTick(); 
    }
  }

  addBotPlayer(bot: SocialUser) {
     if(this.players().some(p => p.name === bot.username)) return;
     const newPlayer: Player = {
         id: bot.id,
         name: bot.username,
         score: 0,
         status: 'ACTIVE',
         isPatron: false,
         avatarColor: this.getRandomColor(),
         isMutedByPatron: false,
         badges: bot.achievements,
         isBot: true,
         avatar: bot.avatar,
         team: Math.random() > 0.5 ? 'KING' : 'QUEEN',
         gender: bot.gender as any,
         hasJoker: false,
         hasPlayedInRound: false
     };
     this.players.update(list => [...list, newPlayer]);
  }

  kickPlayer(id: string) {
    const p = this.players().find(x => x.id === id);
    if(p && !p.isPatron) {
        this.players.update(list => list.filter(x => x.id !== id));
    }
  }

  toggleMute(id: string) {
    this.players.update(list => list.map(p => p.id === id ? { ...p, isMutedByPatron: !p.isMutedByPatron } : p));
  }

  muteAll(mute: boolean) {
    this.players.update(list => list.map(p => p.isPatron ? p : { ...p, isMutedByPatron: mute }));
  }

  setPlayerOnStage(playerId: string) {
    const player = this.players().find(p => p.id === playerId);
    if (!player) return;

    if (player.status === 'ELIMINATED') {
        this.audioService.playFail();
        this.addLog(`UYARI: ${player.name} elendi.`);
        return;
    }

    if (player.hasPlayedInRound && this.gameState() !== 'ROUND_3') { 
        this.audioService.playFail();
        this.addLog(`UYARI: ${player.name} bu turu tamamladı.`);
        return;
    }

    if(!this.activeCard() || this.gameState() === 'ROUND_3') {
        this.players.update(list => list.map(p => p.id === playerId ? { ...p, isMutedByPatron: false } : p));
        this.activePlayerId.set(playerId);
        this.audioService.playOrbClick();
    }
  }

  dropPlayerFromStage() {
      if(this.activePlayerId()) {
          const pid = this.activePlayerId()!;
          this.players.update(list => list.map(p => p.id === pid ? { ...p, isMutedByPatron: true } : p));
      }
      this.activePlayerId.set(null);
      this.audioService.stopTension();
  }

  // --- Game Flow ---

  startGame() {
    if (this.players().length < 2) return; 
    this.audioService.playGameStart();
    this.resetRoundStatus();
    this.runTransition('1. TUR', 'BAŞLANGIÇ', 'ROUND_1');
  }

  resetRoundStatus() {
      this.players.update(list => list.map(p => ({ ...p, hasPlayedInRound: false })));
  }

  startNextRoundPreparation() {
      const current = this.gameState();
      let nextR = '';
      let title = '';
      let desc = '';

      if (current === 'ROUND_1') {
          nextR = 'ROUND_2';
          title = '2. TUR: RENKLERİN GÜCÜ';
          desc = 'Bu turda renklerin dili konuşacak. Sorular soyutlaşacak, süre kısalacak. Sadece dil ustaları hayatta kalabilir. Herkes hazır mı?';
      } else if (current === 'ROUND_2') {
          nextR = 'ROUND_3';
          title = '3. TUR: BÜYÜK FİNAL';
          desc = 'Sadece en iyi 3 oyuncu sahneye çıkacak. Yanlış yapan elenir. Büyük ödül sahibini arıyor.';
      } else {
          return;
      }

      this.gameState.set('PREPARE_ROUND');
      this.nextRoundTitle.set(title);
      this.nextRoundDesc.set(desc);
      this.activeCard.set(null);
      this.dropPlayerFromStage();
      this.audioService.playTension();
  }

  proceedToNextRound() {
      const currentTitle = this.nextRoundTitle();
      const targetState: GameState = currentTitle.includes('2. TUR') ? 'ROUND_2' : 'ROUND_3';
      
      this.runTransition(
          targetState === 'ROUND_2' ? '2. TUR' : '3. TUR', 
          targetState === 'ROUND_2' ? 'RENK SPEKTRUMU' : 'BÜYÜK SORGULAMA', 
          targetState
      );
  }

  runTransition(title: string, subtitle: string, nextState: GameState) {
      this.gameState.set('TRANSITION');
      this.transitionTitle.set(title);
      this.transitionSubtitle.set(subtitle);
      this.audioService.playGameStart();
      
      setTimeout(() => {
          if(nextState === 'ROUND_1') this.startRound1();
          if(nextState === 'ROUND_2') this.startRound2();
          if(nextState === 'ROUND_3') this.startRound3();
      }, 4000);
  }

  // Helper for TRUE shuffling (Fisher-Yates)
  private shuffleDeck(deck: CardType[]): CardType[] {
      const shuffled = [...deck];
      for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
  }

  startRound1() {
    this.resetRoundStatus();
    this.gameState.set('ROUND_1');
    this.roundInstruction.set('1. TUR: ISINMA. Herkesin 1 Hakkı Var.');
    
    // Define deck composition: 15 cards total
    // 4 Luck, 6 Task, 5 Punishment (Example distribution)
    const deckComposition: CardType[] = [
        'LUCK', 'LUCK', 'LUCK', 'LUCK', 
        'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK',
        'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT'
    ];
    
    // True Shuffle
    const shuffledDeck = this.shuffleDeck(deckComposition);
    this.currentRoundDeckMap.clear();

    const cards: GameCard[] = [];
    for (let i = 1; i <= 15; i++) {
      const cardId = i;
      this.currentRoundDeckMap.set(cardId, shuffledDeck[i-1]);
      
      cards.push({ 
        id: cardId, 
        label: i.toString(), 
        ariaLabel: `Sayı ${i}. Henüz açılmadı.`,
        type: 'EMPTY',
        content: '?', 
        orbType: 'GOLD',
        isRevealed: false,
        completed: false
      });
    }
    this.currentRoundCards.set(cards);
    this.activeCard.set(null);
    this.stopTimer();
  }

  startRound2() {
    this.resetRoundStatus();
    this.gameState.set('ROUND_2');
    this.roundInstruction.set('2. TUR: ZORLUK ARTIYOR. Dikkatli Ol.');

    // Define deck composition: 15 cards total
    const deckComposition: CardType[] = [
        'LUCK', 'LUCK', 'LUCK', 
        'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK', 'TASK',
        'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT', 'PUNISHMENT'
    ];
    const shuffledDeck = this.shuffleDeck(deckComposition);
    this.currentRoundDeckMap.clear();

    const cards: GameCard[] = [];
    const palette = [
      { c: 'from-red-500 to-red-700', n: 'Kırmızı' },
      { c: 'from-blue-500 to-blue-700', n: 'Mavi' },
      { c: 'from-green-500 to-green-700', n: 'Yeşil' },
      { c: 'from-purple-400 to-purple-600', n: 'Mor' },
      { c: 'from-yellow-400 to-yellow-600', n: 'Altın' },
      { c: 'from-pink-400 to-pink-600', n: 'Pembe' },
      { c: 'from-orange-400 to-orange-600', n: 'Turuncu' },
      { c: 'from-teal-400 to-teal-600', n: 'Turkuaz' },
      { c: 'from-indigo-500 to-indigo-800', n: 'Lacivert' },
      { c: 'from-rose-400 to-rose-600', n: 'Gül' },
      { c: 'from-cyan-400 to-cyan-600', n: 'Camgöbeği' },
      { c: 'from-lime-400 to-lime-600', n: 'Limon' },
      { c: 'from-amber-600 to-amber-800', n: 'Kehribar' },
      { c: 'from-gray-400 to-gray-600', n: 'Gümüş' },
      { c: 'from-emerald-500 to-emerald-700', n: 'Zümrüt' }
    ];

    for (let i = 0; i < 15; i++) {
       const p = palette[i % palette.length];
       const cardId = i + 200;
       this.currentRoundDeckMap.set(cardId, shuffledDeck[i]);

       cards.push({
         id: cardId,
         label: '',
         ariaLabel: `${p.n} Rengi.`,
         colorClass: `bg-gradient-to-br ${p.c}`,
         orbType: 'COLOR',
         colorName: p.n,
         type: 'EMPTY',
         content: '?',
         isRevealed: false,
         completed: false
       });
    }
    this.currentRoundCards.set(cards);
    this.activeCard.set(null);
  }

  startRound3() {
     this.gameState.set('ROUND_3');
     this.round3Stage.set('WAITING');
     this.roundInstruction.set('3. TUR: BÜYÜK SORGULAMA.');
     this.activeCard.set(null);
     this.audioService.playTension();
  }

  // --- Card Logic ---

  getTimerDuration(type: CardType) {
      const diff = this.settings().difficulty;
      let base = 45;
      if (diff === 'Kolay') base = 60;
      if (diff === 'Zor') base = 30;
      if (diff === 'Expert') base = 20;

      if (type === 'PUNISHMENT') return 20; 
      if (this.gameState() === 'ROUND_2') return base - 10; 
      return base;
  }

  // Generates a single, specific Luck Reward and applies it immediately.
  private processLuckCard(playerId: string): { rewardText: string, rewardType: string } {
      const outcomes = [
          { type: 'JACKPOT', text: '🎉 BÜYÜK İKRAMİYE!\n+50 Puan Anında Eklendi!', points: 50, joker: false },
          { type: 'BONUS', text: '✨ ŞANSLI GÜNÜNDESİN.\n+20 Puan Kazandın.', points: 20, joker: false },
          { type: 'JOKER', text: '🃏 JOKER KARTI ÇIKTI!\nBu kartı zor bir görevde kullanabilirsin.', points: 0, joker: true },
          { type: 'SAFE', text: '🛡️ KORUMA KALKANI.\n+10 Puan ve Dokunulmazlık.', points: 10, joker: false }
      ];

      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      // Apply immediately
      this.players.update(list => list.map(p => {
          if (p.id === playerId) {
              return {
                  ...p,
                  score: p.score + outcome.points,
                  hasJoker: outcome.joker ? true : p.hasJoker,
                  hasPlayedInRound: true, // Luck cards consume the turn immediately
                  lastDelta: outcome.points,
                  lastDeltaTime: Date.now()
              };
          }
          return p;
      }));

      return { rewardText: outcome.text, rewardType: outcome.type };
  }

  async openCard(cardId: number | string) {
    if (!this.activePlayerId()) {
        this.audioService.playFail();
        return;
    }

    const cards = this.currentRoundCards();
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1 || cards[idx].completed || this.activeCard()) return;

    // Retrieve random type from map
    const type = this.currentRoundDeckMap.get(cardId) || 'TASK';

    this.audioService.playTension();
    const newAriaLabel = `${cards[idx].colorName || ('Panel ' + cards[idx].label)} açılıyor.`;
    this.updateCard(idx, { isRevealed: true, type: type, content: 'YÜKLENİYOR...', ariaLabel: newAriaLabel });
    this.activeCard.set(this.currentRoundCards()[idx]);
    
    try {
        let content = '';
        
        if (type === 'LUCK') {
            // Handle Luck Logic Immediately
            const luckResult = this.processLuckCard(this.activePlayerId()!);
            
            // Get simple flavor text from AI to make it feel "alive" but keep mechanism strict
            const flavor = await this.geminiService.generateLuckFlavorText(luckResult.rewardType);
            content = `${luckResult.rewardText}\n\n"${flavor}"`;
            
            // Luck cards are auto-completed
             setTimeout(() => {
                 this.updateCard(idx, { content: content, completed: true });
                 this.activeCard.set(this.currentRoundCards()[idx]);
                 this.audioService.playVictory();
                 this.checkRoundCompletion(); // Check if round ends after luck
             }, 1500);

        } else {
            // Task or Punishment
            if (type === 'PUNISHMENT') {
                content = await this.geminiService.generatePenalty(this.settings().targetLanguage);
            } else {
                if (this.gameState() === 'ROUND_2') {
                    const cName = cards[idx].colorName || 'Renk';
                    content = await this.geminiService.generateColorTask(cName, this.settings().targetLanguage, this.settings().difficulty);
                } else {
                    content = await this.geminiService.generateRound1Task(this.settings().targetLanguage, this.settings().difficulty);
                }
            }
            
            setTimeout(() => {
                 const finalAria = `${type}: ${content}`;
                 this.updateCard(idx, { content: content, ariaLabel: finalAria });
                 this.activeCard.set(this.currentRoundCards()[idx]); 
                 
                 this.audioService.stopTension();
                 if (type === 'PUNISHMENT') this.audioService.playAlarm();
                 else this.audioService.playSuccess(); 

                 this.startTimer(this.getTimerDuration(type));
            }, 1500);
        }

    } catch (e) {
        this.updateCard(idx, { content: 'Bağlantı hatası.' });
        this.audioService.stopTension();
    }
  }

  judgeActivePlayer(success: boolean) {
    const pid = this.activePlayerId();
    const card = this.activeCard();
    if (!pid || !card) return;
    
    // Luck cards are already judged in openCard
    if (card.type === 'LUCK') {
        this.closeActiveCard();
        return;
    }

    const idx = this.currentRoundCards().findIndex(c => c.id === card.id);
    if (idx !== -1) this.updateCard(idx, { completed: true });

    let points = 0;
    points = success ? 15 : -5;
    if (card.type === 'PUNISHMENT' && !success) points = -15;

    this.players.update(list => list.map(p => {
        if (p.id === pid) {
            return { 
                ...p, 
                score: p.score + points, 
                lastDelta: points, 
                lastDeltaTime: Date.now(),
                hasPlayedInRound: true, 
                status: (p.score <= -50) ? 'ELIMINATED' : p.status 
            };
        }
        return p;
    }));

    if (points > 0) this.audioService.playVictory(); else this.audioService.playFail();
    this.closeActiveCard();
    this.checkRoundCompletion();
  }

  // Checks if all active contestants have played. If so, trigger prep.
  checkRoundCompletion() {
      // Small delay to let animations finish
      setTimeout(() => {
          const actives = this.waitingPlayers();
          if (actives.length === 0 && this.gameState() !== 'ROUND_3') {
              this.startNextRoundPreparation();
          }
      }, 2000);
  }

  handleTimeOut() {
      const pid = this.activePlayerId();
      if (pid) {
          this.players.update(list => list.map(p => 
              p.id === pid ? { 
                  ...p, 
                  score: p.score - 10, 
                  hasPlayedInRound: true,
                  status: 'ELIMINATED' 
              } : p
          ));
          this.audioService.playAlarm();
          this.activeCard.update(c => c ? ({...c, content: "🛑 SÜRE DOLDU!\nOyuncu ELENDİ."}) : null);
          
          setTimeout(() => {
             this.dropPlayerFromStage();
             this.closeActiveCard();
             this.checkRoundCompletion();
          }, 2500);
      } else {
          this.closeActiveCard();
      }
  }

  async triggerRound3Stage(stage: Round3Stage) {
      this.round3Stage.set(stage);
      this.finalRoundContent.set('Sistem Hazırlanıyor...');
      this.audioService.playTension(); 

      try {
          let content = '';
          if (stage === 'WRONG_WORD') {
              content = await this.geminiService.generateWrongWordPuzzle(this.settings().targetLanguage, this.settings().difficulty);
              this.startTimer(60);
          } else if (stage === 'QUERY') {
              content = await this.geminiService.generateInterviewQuestion(this.settings().targetLanguage, this.settings().difficulty);
              this.startTimer(45);
          } else if (stage === 'RIDDLE') {
              content = await this.geminiService.generateRiddle(this.settings().targetLanguage);
              this.startTimer(90);
          }
          this.finalRoundContent.set(content);
      } catch (e) {
          this.finalRoundContent.set('Hata: AI yanıt vermedi.');
      }
  }
  
  judgeRound3(playerId: string, success: boolean) {
      const points = success ? 50 : -20;
      this.updateScore(playerId, points);
      if (success) this.audioService.playVictory(); else this.audioService.playFail();
      this.dropPlayerFromStage();
      this.stopTimer();
  }

  closeActiveCard() {
      this.activeCard.set(null);
      this.dropPlayerFromStage();
      this.stopTimer();
      this.audioService.stopTension();
  }

  updateScore(pid: string, delta: number) {
      this.players.update(list => list.map(p => 
          p.id === pid ? { ...p, score: p.score + delta, lastDelta: delta, lastDeltaTime: Date.now() } : p
      ));
  }

  finalizeRound3() {
      const finalists = this.top3Players();
      if(finalists.length === 0) return;
      const winner = finalists.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      this.declareWinner(winner.id);
  }

  declareWinner(playerId: string) {
      const winner = this.players().find(p => p.id === playerId);
      if (!winner) return;
      
      // Update Crown Stats in Auth/Profile (Simulation)
      // In real app, update backend
      this.winnerPlayer.set(winner);
      this.gameState.set('WINNER_REVEAL');
      this.audioService.playVictory(); // Will be enhanced by component fireworks
  }

  restartGame() {
      this.gameState.set('LOBBY');
      this.players.update(list => list.map(p => ({
          ...p, score: 0, status: 'ACTIVE', hasPlayedInRound: false, hasJoker: false
      })));
      this.audioService.playSuccess();
  }

  resetGame() {
      this.gameState.set('MENU');
      this.players.set([]);
      const me = this.authService.currentUser();
      if (me) this.addPlayer(me.username, true, me.avatar, me.id, me.gender as any);
      this.audioService.stopTension();
  }
  
  leaveGame() {
      this.gameState.set('MENU'); 
      this.audioService.stopTension();
  }

  // Use Joker
  useJoker(playerId: string) {
     const p = this.players().find(x => x.id === playerId);
     if (p && p.hasJoker) {
         this.players.update(list => list.map(pl => pl.id === playerId ? { ...pl, hasJoker: false } : pl));
         this.audioService.playSuccess();
         this.triggerDealOrNoDeal(); 
     }
  }
  
  async triggerDealOrNoDeal() {
     this.activeCard.update(c => c ? ({ ...c, content: 'RİSK MODU...' }) : null);
     // Simplified logic for demo
     setTimeout(() => {
         this.activeCard.update(c => c ? ({...c, content: 'YENİ GÖREV YÜKLENDİ.'}) : null);
         this.startTimer(30);
     }, 1000);
  }

  startTimer(sec: number) {
    this.stopTimer();
    this.timerValue.set(sec);
    this.timerMax.set(sec);
    this.isTimerRunning.set(true);
    
    this.timerInterval = setInterval(() => {
        const v = this.timerValue();
        if (v > 0) {
            this.timerValue.set(v - 1);
            if (v <= 6) this.audioService.playTick();
        } else { 
            this.stopTimer(); 
            this.handleTimeOut();
        }
    }, 1000);
  }
  
  stopTimer() { 
      clearInterval(this.timerInterval); 
      this.isTimerRunning.set(false); 
  }

  revealCard(id: number | string, round: string) { this.openCard(id); }
  processCommand(cmd: string) { }
  private updateCard(idx: number, changes: Partial<GameCard>) {
    this.currentRoundCards.update(c => {
        const n = c.slice();
        n[idx] = { ...n[idx], ...changes };
        return n;
    });
  }
  private addLog(m: string) { this.gameLog.update(l => [m, ...l]); }
  private getRandomColor() { return ['#ef4444', '#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ec4899'][Math.floor(Math.random()*6)]; }
}
