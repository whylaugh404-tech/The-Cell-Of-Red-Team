/**
 * [IMPLEMENTED] Distributed Cognition Mesh
 * Allows cells to pass and process stimuli/signals across the network.
 */
import * as crypto from 'crypto';

export interface CognitiveSignal {
    signalId: string;
    originCellId: string;
    type: 'STIMULUS' | 'REASONING' | 'CONSENSUS';
    payload: string;
    ttl: number; // Time-to-live in hops
    timestamp: number;
}

export class CognitiveMesh {
    private processedSignals: Set<string> = new Set();
    private activeThoughts: CognitiveSignal[] = [];
    private selfId: string;

    constructor(selfId: string) {
        this.selfId = selfId;
    }

    public processIncomingSignal(signal: CognitiveSignal): boolean {
        // Prevent infinite loops / echo chambers
        if (this.processedSignals.has(signal.signalId)) return false;
        
        // TTL Check
        if (signal.ttl <= 0) return false;

        this.processedSignals.add(signal.signalId);
        
        // Local evaluation
        console.log(`[Cognition] Processing signal ${signal.type} from ${signal.originCellId.substring(0,8)}`);
        
        this.activeThoughts.push(signal);
        if (this.activeThoughts.length > 50) this.activeThoughts.shift(); // keep memory bounded

        return true; // Signal should be propagated
    }

    public createSignal(type: 'STIMULUS' | 'REASONING', payload: string): CognitiveSignal {
        const signal: CognitiveSignal = {
            signalId: crypto.randomUUID(),
            originCellId: this.selfId,
            type,
            payload,
            ttl: 5, // 5 network hops
            timestamp: Date.now()
        };
        this.processedSignals.add(signal.signalId);
        this.activeThoughts.push(signal);
        return signal;
    }

    public getActiveThoughtsCount(): number {
        return this.activeThoughts.length;
    }
}
