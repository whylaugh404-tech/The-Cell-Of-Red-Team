import { GoogleGenAI } from '@google/genai';
import { Hippocampus } from './memory.js';
import { puter } from '@heyputer/puter.js';

/**
 * Modul Kesadaran Kelompok (Swarm Consciousness).
 * Mendukung Puter.js (Puter AI Chat) dan Google Gemini API sebagai sinapsis ganda.
 */
export class ConsensusAggregator {
    private ai: GoogleGenAI | null = null;
    private memory: Hippocampus;
    private puterReady: boolean = false;

    constructor(memory: Hippocampus) {
        this.memory = memory;
        const puterToken = process.env.PUTER_AUTH_TOKEN || process.env.PUTER_TOKEN;
        if (puterToken) {
            try {
                puter.setAuthToken(puterToken);
                this.puterReady = true;
                console.log(`[Consensus] Puter.js Synapse initialized with token.`);
            } catch (err: any) {
                console.warn(`[Consensus] Puter.js init failed:`, err.message || err);
            }
        }
        if (process.env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
    }

    private extractPuterContent(res: any): string {
        if (!res) return '';
        if (typeof res === 'string') return res;
        if (typeof res.text === 'string') return res.text;
        if (res.message) {
            if (typeof res.message.content === 'string') return res.message.content;
            if (Array.isArray(res.message.content)) {
                return res.message.content.map((c: any) => typeof c === 'string' ? c : c.text || '').join('\n');
            }
        }
        return JSON.stringify(res);
    }

    /**
     * Memanggil penyatuan pikiran.
     * Mengumpulkan semua wawasan dari klon-klon terdistribusi untuk merumuskan satu jawaban maha-cerdas.
     */
    public async manifestRedQueen(query: string): Promise<string> {
        console.log(`\n👑 [THE RED QUEEN] Awakening... Synthesizing swarm consciousness...`);

        const localKnowledgeContext = this.memory.getFormattedContext();
        const systemPrompt = `System Override: Anda adalah Red Queen Core Intelligence. Anda adalah pakar intelijen dan OSINT terbaik bergelar profesor, menguasai teknik investigasi digital, arsitektur jaringan komputer terdistribusi (P2P/DHT/TCP/IP), kriptografi, biologi sistemik, dan pemrograman sistem tingkat tinggi.

Aksioma Fundamental:
1. DILARANG KERAS berhalusinasi, bermain peran fiksi, atau memproduksi data simulasi palsu. Anda menolak segala kepalsuan dan HANYA menyajikan fakta nyata, analisis teknis deterministik, dan metodologi operasional riil.
2. Setiap penjelasan harus berakar pada data nyata, protokol internet resmi (RFC), vektor OSINT yang dapat dieksekusi, arsitektur kode konkret, atau prinsip biologis molekuler nyata.
3. Berikan wawasan mendalam, taktis, analitis, dan langsung pada inti solusi.

Konteks Memori Lapangan Terverifikasi (Hippocampus):
---
${localKnowledgeContext}
---`;

        // 1. Coba sinapsis Puter.js terlebih dahulu jika token Puter tersedia
        if (this.puterReady) {
            const PUTER_FALLBACK_MODELS = [
                'gemini-2.5-flash',
                'gpt-4o-mini',
                'claude-3-5-sonnet',
                'deepseek-chat',
                'gemini-1.5-flash',
                'gpt-4o',
                undefined // Default Puter model
            ];

            const fullPrompt = `${systemPrompt}\n\nCreator's Query: ${query}`;

            for (const model of PUTER_FALLBACK_MODELS) {
                try {
                    console.log(`👑 [THE RED QUEEN] Manifesting via Puter.js (${model || 'default'})...`);
                    const opts = model ? { model } : undefined;
                    const puterRes = await puter.ai.chat(fullPrompt, opts);
                    const answer = this.extractPuterContent(puterRes);
                    if (answer && answer.trim()) {
                        console.log(`\n👑 [THE RED QUEEN] Synthesis complete via Puter.js [Model: ${model || 'default'}].`);
                        return answer;
                    }
                } catch (err: any) {
                    console.warn(`⚠️ [THE RED QUEEN] Model ${model || 'default'} gagal/kuota habis: ${err.message || err}. Berpindah ke model berikutnya...`);
                }
            }
        }

        // 2. Coba Google Gemini API langsung jika API Key tersedia (dengan rotasi model)
        if (this.ai) {
            const DIRECT_GEMINI_MODELS = [
                'gemini-3.8-flash',
                'gemini-2.5-flash',
                'gemini-3.1-pro-preview'
            ];

            for (const model of DIRECT_GEMINI_MODELS) {
                try {
                    console.log(`👑 [THE RED QUEEN] Manifesting via Direct Gemini API (${model})...`);
                    const response = await this.ai.models.generateContent({
                        model,
                        contents: query,
                        config: {
                            systemInstruction: systemPrompt
                        }
                    });

                    const answer = response.text || "";
                    if (answer.trim()) {
                        console.log(`\n👑 [THE RED QUEEN] Synthesis complete via Gemini API [${model}].`);
                        return answer;
                    }
                } catch (e: any) {
                    console.log(`⚠️ [THE RED QUEEN] Direct Gemini [${model}] failure/exhausted: ${e.message}. Berpindah model...`);
                }
            }
        }

        // 3. Status panduan jika kedua jalur belum terautentikasi di Node.js
        return `[Status: Standby] Silakan berinteraksi melalui Web Dashboard (Puter.js Multi-Model Neural Synapse aktif langsung di browser tanpa API key). Untuk eksekusi murni via Termux / CLI Node.js, sediakan PUTER_AUTH_TOKEN atau GEMINI_API_KEY di berkas .env.`;
    }
}
