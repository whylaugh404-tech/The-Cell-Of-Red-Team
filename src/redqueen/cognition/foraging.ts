import { GoogleGenAI } from '@google/genai';
import { Hippocampus } from './memory.js';
import { DirectCellReplicator } from '../network/replication.js';

export class AutonomousForager {
    private ai: GoogleGenAI | null = null;
    private memory: Hippocampus;
    private replicator: DirectCellReplicator;
    private isForaging: boolean = false;
    
    // Hacker News Public API
    private HN_API = 'https://hacker-news.firebaseio.com/v0';
    private currentStoryIndex: number = 0;

    constructor(memory: Hippocampus, replicator: DirectCellReplicator) {
        this.memory = memory;
        this.replicator = replicator;
        if (process.env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
    }

    public start() {
        if (this.isForaging || !this.ai) return;
        this.isForaging = true;
        console.log('\n🧠 [FORAGING] Autonomous Knowledge Foraging initialized.');
        
        this.forage();
        setInterval(() => this.forage(), 5 * 60 * 1000); 
    }

    private async forage() {
        try {
            const res = await fetch(`${this.HN_API}/topstories.json`);
            const storyIds = await res.json() as number[];
            if (!storyIds || storyIds.length === 0) return;
            
            const targetId = storyIds[this.currentStoryIndex % Math.min(storyIds.length, 50)];
            this.currentStoryIndex++;
            const itemRes = await fetch(`${this.HN_API}/item/${targetId}.json`);
            const item = await itemRes.json() as any;

            if (!item || !item.title) return;

            console.log(`\n🕸️ [FORAGING] Intercepted technical feed: "${item.title}"`);

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
                this.memory.addMemory('model', `[ASSIMILATED] Source: '${item.title}'. Insight: ${insight}`);
                console.log(`💡 [ASSIMILATION COMPLETE] Cell updated knowledge base.`);
                
                // Genuine direct replication across peer network
                await this.replicator.replicateToPeers(insight);
            }
        } catch (e: any) {
            console.log(`[FORAGING] Standby - web query cycle completed.`);
        }
    }
}
