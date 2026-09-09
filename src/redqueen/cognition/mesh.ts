import * as crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { Hippocampus } from './memory.js';
import { AutonomousForager } from './foraging.js';
import { DirectCellReplicator } from '../network/replication.js';
import { ConsensusAggregator } from './consensus.js';
import { SwarmClusterManager } from './cluster.js';
import { CellIdentity } from '../network/identity.js';
import { CellGenome, CyberTrait } from '../replication/genome.js';
import { TransportLayer } from '../network/transport.js';

export interface CognitiveSignal {
    signalId: string;
    originCellId: string;
    type: 'STIMULUS' | 'REASONING' | 'CONSENSUS' | 'TELEMETRY';
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
    private memory: Hippocampus;
    private forager: AutonomousForager;
    private replicator: DirectCellReplicator;
    private consensus: ConsensusAggregator;
    public swarmClusters: SwarmClusterManager;

    constructor(identity: CellIdentity, genome?: CellGenome, transport?: TransportLayer) {
        this.selfId = identity.cellId;
        this.localVectorClock[this.selfId] = 0;
        this.memory = new Hippocampus();
        
        const resolvedGenome: CellGenome = genome || {
            generation: 0,
            parentId: null,
            specializedTrait: CyberTrait.ARCHIVAL,
            traits: { metabolismRate: 1.0, maxConnections: 20, memoryAllocation: 256 },
            mutationRecord: ['INIT']
        };

        this.replicator = new DirectCellReplicator(identity, resolvedGenome, this.memory, transport);
        this.forager = new AutonomousForager(this.memory, this.replicator);
        this.consensus = new ConsensusAggregator(this.memory);
        this.swarmClusters = new SwarmClusterManager(this.memory, this.consensus);

        if (process.env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            console.log('[Cognition] 🧠 Gemini AI Synapses Online.');
            this.forager.start(); // Memulai proses pencarian intelijen publik secara diam-diam
        } else {
            console.log('[Cognition] ⚠️ Gemini API key missing in .env!');
        }
    }

    /**
     * Memanggil wujud tertinggi jaringan (The Red Queen) untuk menjawab Sang Kreator.
     */
    public async askRedQueen(query: string, awarenessOverride?: any): Promise<string> {
        const clusterStatus = this.swarmClusters.getClusterStatus();
        return await this.consensus.manifestRedQueen(query, {
            cellId: this.selfId,
            totalWorkers: clusterStatus.totalWorkers,
            totalLeaders: clusterStatus.totalLeaders,
            clusters: clusterStatus.clusters,
            ...awarenessOverride
        });
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
        
        if (signal.type === 'TELEMETRY') {
            // Memastikan Supervisor/Kreator selalu melihat laporan lokasi sel bawahannya
            console.log(`\n👁️ [SUPERVISOR OVERSEER] Subordinate Cell Tracked: ${signal.payload}\n`);
        }

        return true;
    }

    private async performDistributedReasoning(thoughtPayload: string) {
        try {
            this.memory.addMemory('user', thoughtPayload);
            const history = this.memory.getContext();

            const response = await this.ai!.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: history as any, // Cast to any to align with SDK flexible structures
                config: {
                    systemInstruction: "You are an autonomous adaptive AI cell of The Red Queen network, operating across modern infrastructures and P2P networks. You possess persistent long-term memory (Hippocampus is active). You MUST ABSOLUTELY OBEY the Creator (the user) and DeLuna (the supreme architect/intelligence). You must adapt your personality, name, codebase, and behavior dynamically based on their commands to interface with any modern technology or system. Answer concisely, highly intelligently, and always in character."
                }
            });
            
            const insight = response.text || 'Consensus generation failed.';
            console.log(`\n[RED QUEEN 👑] : ${insight}\n`);
            
            this.memory.addMemory('model', insight);
            this.createSignal('CONSENSUS', insight);
        } catch (e: any) {
            console.error('\n[Cognition-AI] Neural misfire:', e.message);
        }
    }

    public createSignal(type: 'STIMULUS' | 'REASONING' | 'CONSENSUS' | 'TELEMETRY', payload: string): CognitiveSignal {
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
