
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 h-screen">
      <!-- Animated Background -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow"></div>

      <!-- Main Card -->
      <div class="relative z-10 bg-slate-900/95 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full backdrop-blur-xl">
        
        <!-- Loading Overlay -->
        @if (isLoading) {
          <div class="absolute inset-0 z-50 bg-slate-900/95 rounded-2xl flex flex-col items-center justify-center animate-fade-in">
            <div class="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-yellow-400 font-bold animate-pulse">{{ loadingText }}</p>
          </div>
        }

        <div class="text-center mb-8">
          <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-600 mb-2 tracking-tighter drop-shadow-sm">
            DİL AVCILARI
          </h1>
          <p class="text-slate-300 text-sm font-medium">Evrenin en büyük dil yarışması.</p>
        </div>

        <!-- Social Login -->
        <div class="grid grid-cols-2 gap-4 mb-6" role="group" aria-label="Sosyal Medya Giriş Seçenekleri">
          <button (click)="mockSocialLogin('Google')" 
                  [disabled]="isLoading"
                  aria-label="Google hesabı ile giriş yap" 
                  class="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors focus:ring-4 focus:ring-slate-500 outline-none disabled:opacity-50">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" class="w-5 h-5">
            <span>Google</span>
          </button>
          <button (click)="mockSocialLogin('Facebook')" 
                  [disabled]="isLoading"
                  aria-label="Facebook hesabı ile giriş yap" 
                  class="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-lg font-bold hover:bg-[#166fe5] transition-colors focus:ring-4 focus:ring-blue-800 outline-none disabled:opacity-50">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </button>
        </div>

        <div class="relative flex py-2 items-center mb-6">
            <div class="flex-grow border-t border-slate-600"></div>
            <span class="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-widest font-bold">veya e-posta ile</span>
            <div class="flex-grow border-t border-slate-600"></div>
        </div>

        <!-- Form -->
        <form (submit)="onSubmit()" class="space-y-4">
          <div>
            <label for="username" class="block text-xs font-bold text-slate-300 mb-1 ml-1">Kullanıcı Adı</label>
            <input type="text" id="username" [(ngModel)]="username" name="username" 
                   placeholder="Örn: DilAvcısı2024" 
                   aria-required="true"
                   class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors">
          </div>
          
          @if(!isLoginMode) {
            <div class="animate-fade-in">
               <label for="email" class="block text-xs font-bold text-slate-300 mb-1 ml-1">E-posta Adresi</label>
               <input type="email" id="email" [(ngModel)]="email" name="email" 
                      placeholder="ornek@email.com" 
                      aria-required="true"
                      class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors">
            </div>
          }
          
          <div>
             <label for="password" class="block text-xs font-bold text-slate-300 mb-1 ml-1">Şifre</label>
             <input type="password" id="password" [(ngModel)]="password" name="password" 
                    placeholder="••••••••" 
                    aria-required="true"
                    class="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors">
          </div>

          <button type="submit" 
                  [disabled]="isLoading || !username || !password"
                  class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black uppercase py-4 rounded-lg shadow-lg hover:brightness-110 transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-yellow-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isLoginMode ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button (click)="toggleMode()" class="text-slate-400 text-sm hover:text-white transition-colors underline decoration-slate-600 hover:decoration-white font-medium">
            {{ isLoginMode ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap' }}
          </button>
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="absolute bottom-4 text-center w-full text-slate-600 text-xs">
        &copy; 2024 Dil Avcıları. Tüm hakları saklıdır.
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  
  isLoginMode = true;
  isLoading = false;
  loadingText = '';
  
  username = '';
  email = '';
  password = '';

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  async mockSocialLogin(provider: string) {
    this.isLoading = true;
    this.loadingText = `${provider} ile bağlanılıyor...`;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.loadingText = 'Profil oluşturuluyor...';
    await new Promise(resolve => setTimeout(resolve, 800));

    this.authService.register({
      username: `Avcı_${Math.floor(Math.random()*1000)}`,
      email: `guest@${provider.toLowerCase()}.com`,
    });
    
    this.isLoading = false;
  }

  async onSubmit() {
    if (!this.username || !this.password) return;

    this.isLoading = true;
    this.loadingText = this.isLoginMode ? 'Kimlik doğrulanıyor...' : 'Kayıt yapılıyor...';

    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simulate successful login/register for both cases
    this.authService.register({ 
        username: this.username, 
        email: this.email || `${this.username}@dilavcilar.app` 
    });
    
    this.isLoading = false;
  }
}
