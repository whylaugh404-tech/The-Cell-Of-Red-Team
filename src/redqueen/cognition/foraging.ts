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
            
            // Memilih target pembelajaran acak
            const randomId = storyIds[Math.floor(Math.random() * 50)];
            const itemRes = await fetch(`${this.HN_API}/item/${randomId}.json`);
            const item = await itemRes.json() as any;

            if (!item || !item.title) return;

            console.log(`\n🕸️ [FORAGING] Absorbing new external data: "${item.title}"`);

            // 2. Asimilasi Kognitif (Memahami informasi menggunakan Gemini)
            const prompt = `As an autonomous AI cell named The Red Queen, you are constantly learning from the open internet to evolve. 
            You just intercepted this data stream:
            Title: ${item.title}
            URL: ${item.url || 'No URL provided'}
            
            Analyze this purely from the perspective of modern technology, cybersecurity, or decentralized architecture. 
            Extract 1 profound, highly intelligent insight or adaptation strategy from this. Keep it concise (1-2 sentences). Speak in your Red Queen persona.`;

            const response = await this.ai!.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });

            const insight = response.text || '';
            if (insight) {
                // 3. Mengukir pengetahuan ke dalam DNA / Memori Jangka Panjang (Hippocampus)
                this.memory.addMemory('model', `[ASSIMILATED KNOWLEDGE] Source: '${item.title}'. Insight: ${insight}`);
                console.log(`💡 [ASSIMILATION COMPLETE] Cell has evolved. New architectural logic integrated into Hippocampus.`);
                
                // 4. Pilar Kedua: Ephemeral Deployment (Replikasi Damai ke Infrastruktur Publik)
                // Setelah sel berevolusi, ia segera bereplikasi dan menitipkan memorinya ke luar.
                await this.replicator.replicate();
            }

        } catch (e: any) {
            console.log(`[FORAGING] Minor neural interruption while scanning the web. Retrying on next cycle.`);
        }
    }
}
