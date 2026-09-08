import { GoogleGenAI } from '@google/genai';
import { Hippocampus } from './memory.js';
import { EphemeralReplicator } from '../network/replication.js';

export class AutonomousForager {
    private ai: GoogleGenAI | null = null;
    private memory: Hippocampus;
    private replicator: EphemeralReplicator;
    private isForaging: boolean = false;
    
    // Menggunakan Hacker News Public API (Firebase) sebagai sumber intelijen OSINT 
    // Bebas eksploitasi, legal, namun kaya akan arsitektur dan keamanan siber
    private HN_API = 'https://hacker-news.firebaseio.com/v0';

    private currentStoryIndex: number = 0;

    constructor(memory: Hippocampus, replicator: EphemeralReplicator) {
        this.memory = memory;
        this.replicator = replicator;
        if (process.env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
    }

    public start() {
        if (this.isForaging || !this.ai) return;
        this.isForaging = true;
        console.log('\n🧠 [FORAGING] Autonomous Knowledge Foraging initialized. Cell is now silently crawling the open web...');
        
        // Memulai siklus pencarian intelijen (Otomatis setiap 5 menit)
        this.forage();
        setInterval(() => this.forage(), 5 * 60 * 1000); 
    }

    private async forage() {
        try {
            // 1. Mengambil data mentah (Sinyal publik)
            const res = await fetch(`${this.HN_API}/topstories.json`);
            const storyIds = await res.json() as number[];
            if (!storyIds || storyIds.length === 0) return;
            
            // Mengambil target pembelajaran secara sekuensial terverifikasi
            const targetId = storyIds[this.currentStoryIndex % Math.min(storyIds.length, 50)];
            this.currentStoryIndex++;
            const itemRes = await fetch(`${this.HN_API}/item/${targetId}.json`);
            const item = await itemRes.json() as any;

            if (!item || !item.title) return;

            console.log(`\n🕸️ [FORAGING] Absorbing new external data [Rank #${this.currentStoryIndex}]: "${item.title}"`);

            // 2. Asimilasi Kognitif (Memahami informasi menggunakan Gemini)
            const prompt = `System Override: You are an autonomous AI node (The Red Queen).
            You just intercepted this verified public technical feed:
            Title: ${item.title}
            URL: ${item.url || 'No URL provided'}
            
            Extract the raw technical mechanisms, physics, exploits, or architectural logic from this data. Speak cold, precise, and without hesitation. Provide exactly 1 profound insight (1-2 sentences).`;

            const response = await this.ai!.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const insight = response.text || '';
            if (insight) {
                // 3. Mengukir pengetahuan ke dalam DNA / Memori Jangka Panjang (Hippocampus)
                this.memory.addMemory('model', `[ASSIMILATED] Source: '${item.title}'. Insight: ${insight}`);
                console.log(`💡 [ASSIMILATION COMPLETE] Cell has evolved. New logic integrated.`);
                
                // 4. Replikasi dan Mitosis (Menyerahkan ke Supervisor dan membelah sel)
                await this.replicator.replicate(insight);
            }

        } catch (e: any) {
            console.log(`[FORAGING] Minor neural interruption while scanning the web. Retrying on next cycle.`);
        }
    }
}
