
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private modelId = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  private getLevelDesc(difficulty: string): string {
    return difficulty === 'Expert' ? 'C1 (Advanced - Soyut)' : (difficulty === 'Zor' ? 'B2 (Upper Int - Karmaşık)' : 'A1-A2 (Beginner - Somut)');
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: prompt,
      });
      return response.text || 'İçerik alınamadı.';
    } catch (error) {
      console.error('AI Error:', error);
      return 'Bağlantı hatası. Lütfen tekrar deneyin.';
    }
  }

  // --- ROUND 1: FAST & FURIOUS (Basic) ---
  async generateRound1Task(targetLanguage: string, difficulty: string): Promise<string> {
    const prompt = `Sen 'DİL AVCILARI' yarışmasının sert ama adil sunucususun.
    Hedef Dil: ${targetLanguage}
    Seviye: ${difficulty}
    
    1. Tur için ÇOK KISA (maksimum 10 kelime), ANLIK YAPILABİLİR bir sözlü görev ver.
    Uzun cümleler kurma. Oyuncu okuduğu an ne yapacağını anlamalı.
    
    Örnekler:
    - "Masanın üzerindeki 3 nesneyi say."
    - "Bana 'Seni seviyorum' de."
    - "10'dan geriye say."
    
    Çıktı Formatı:
    [Sadece Görev Metni]
    `;
    return this.generateContent(prompt);
  }

  async generatePenalty(targetLanguage: string): Promise<string> {
    const prompt = `Kısa, komik ve utandırmayan bir ceza ver. Tek cümle.
    Örnek: "Bir sonraki tura kadar kedi gibi miyavla."
    `;
    return this.generateContent(prompt);
  }
  
  // Luck Flavor Text Only (Mechanics handled in GameService)
  async generateLuckFlavorText(rewardType: string): Promise<string> {
      const prompt = `Bir yarışma oyununda oyuncu '${rewardType}' kazandı.
      Bunu kutlayan, motive edici, çok kısa (tek cümle) havalı bir tebrik mesajı yaz.
      Sadece mesajı yaz.
      `;
      return this.generateContent(prompt);
  }

  // --- ROUND 2: COLORS & COMPLEXITY (Harder) ---
  async generateColorTask(colorName: string, targetLanguage: string, difficulty: string): Promise<string> {
    const prompt = `Oyun: 2. Tur (Renkler). Daha zorlayıcı ol.
    Renk: ${colorName}
    Dil: ${targetLanguage}
    Seviye: ${this.getLevelDesc(difficulty)}
    
    Bu rengi içeren bir deyim sor, ya da bu renkle ilgili soyut bir kavramı anlatmasını iste.
    Süre kısıtlı, okuması kolay olsun.
    
    Çıktı:
    [Sadece Görev]
    `;
    return this.generateContent(prompt);
  }

  // --- ROUND 3: THE FINALS (Expert) ---
  
  async generateWrongWordPuzzle(targetLanguage: string, difficulty: string): Promise<string> {
    const prompt = `3. Tur. Dil: ${targetLanguage}. Zorluk: ${difficulty}.
    5 kelimelik bir cümle yaz. Bir kelime bariz şekilde yanlış (absürt) olsun.
    
    Format:
    Cümle: [Cümle]
    Soru: Hangi kelime hatalı?
    `;
    return this.generateContent(prompt);
  }

  async generateInterviewQuestion(targetLanguage: string, difficulty: string): Promise<string> {
    const prompt = `3. Tur Mülakat. Dil: ${targetLanguage}.
    Felsefi veya düşündürücü tek bir soru sor.
    Örnek: "Mutluluk sence nedir?"
    `;
    return this.generateContent(prompt);
  }

  async generateRiddle(targetLanguage: string): Promise<string> {
    const prompt = `3. Tur Final Bilmecesi. Dil: ${targetLanguage}.
    Klasik, zeka gerektiren kısa bir bilmece.
    `;
    return this.generateContent(prompt);
  }
}
