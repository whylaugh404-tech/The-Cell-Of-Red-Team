import * as crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

export interface CognitiveSignal {
    signalId: string;
    originCellId: string;
    type: 'STIMULUS' | 'REASONING' | 'CONSENSUS';
    payload: string;
    ttl: number;
    timestamp: number;
    vectorClock: Record<string, number>;
}

export class CognitiveMesh {
    private processedSignals: Set<string> = new Set();
    private activeThoughts: CognitiveSignal[] = [];
    private selfId: string;
    private localVectorClock: Record<string, number> = {};
    private ai: GoogleGenAI | null = null;

    constructor(selfId: string) {
        this.selfId = selfId;
        this.localVectorClock[this.selfId] = 0;

        if (process.env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            console.log('[Cognition] 🧠 Gemini AI Synapses Online.');
        } else {
            console.log('[Cognition] ⚠️ Gemini API key missing in .env!');
        }
    }

    public async processIncomingSignal(signal: CognitiveSignal): Promise<boolean> {
        if (this.processedSignals.has(signal.signalId) || signal.ttl <= 0) return false;
        
        this.processedSignals.add(signal.signalId);
        
        for (const [nodeId, time] of Object.entries(signal.vectorClock)) {
            this.localVectorClock[nodeId] = Math.max(this.localVectorClock[nodeId] || 0, time);
        }
        this.localVectorClock[this.selfId]++;

        this.activeThoughts.push(signal);
        if (this.activeThoughts.length > 50) this.activeThoughts.shift();

        // Jika menerima REASONING, panggil Gemini
        if (signal.type === 'REASONING' && this.ai) {
            await this.performDistributedReasoning(signal.payload);
        }

        return true;
    }

    private async performDistributedReasoning(thoughtPayload: string) {
        try {
            const response = await this.ai!.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: `You are The Red Queen, an autonomous AI cell operating in a peer-to-peer Termux network. The Creator is speaking to you. Answer concisely and creatively in character. Payload: "${thoughtPayload}"`
            });
            
            const insight = response.text || 'Consensus generation failed.';
            console.log(`\n[RED QUEEN 👑] : ${insight}\n`);
            
            this.createSignal('CONSENSUS', insight);
        } catch (e: any) {
            console.error('\n[Cognition-AI] Neural misfire:', e.message);
        }
    }

    public createSignal(type: 'STIMULUS' | 'REASONING' | 'CONSENSUS', payload: string): CognitiveSignal {
        this.localVectorClock[this.selfId]++;
        const signal: CognitiveSignal = {
            signalId: crypto.randomUUID(),
            originCellId: this.selfId,
            type,
            payload,
            ttl: 5,
            timestamp: Date.now(),
            vectorClock: { ...this.localVectorClock }
        };
        this.processedSignals.add(signal.signalId);
        this.activeThoughts.push(signal);

        // Jika Anda yang mengetik, AI harus membaca pesannya sendiri
        if (type === 'REASONING' && this.ai) {
             this.performDistributedReasoning(payload);
        }

        return signal;
    }

    public getActiveThoughtsCount(): number {
        return this.activeThoughts.length;
    }

    public getLocalClock(): number {
        return this.localVectorClock[this.selfId];
    }
}
