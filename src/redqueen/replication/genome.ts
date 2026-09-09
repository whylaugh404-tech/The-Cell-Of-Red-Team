/**
 * [PARTIAL] Genome / Controlled Replication
 * AST/Configuration based mutation constraints.
 */
import * as crypto from 'crypto';

export enum CyberTrait {
    REGENERATIVE = 'REGENERATIVE', // Restores lost memory shards
    IMMUNE = 'IMMUNE',             // Strict firewall, drops bad packets
    ARCHIVAL = 'ARCHIVAL',         // Deep storage for memory parity
    ROUTER = 'ROUTER',             // High DHT bandwidth routing
    EPHEMERAL = 'EPHEMERAL'        // Fast, RAM-only, short lifespan
}

export interface CellGenome {
    generation: number;
    parentId: string | null;
    specializedTrait: CyberTrait;
    traits: {
        metabolismRate: number;
        maxConnections: number;
        memoryAllocation: number;
    };
    mutationRecord: string[];
}

export class ReplicationController {
    public static validateAndMutate(parentGenome: CellGenome, parentId: string): CellGenome | null {
        // Limit generation depth to prevent uncontrolled explosion
        if (parentGenome.generation >= 100) return null;

        const childGenome: CellGenome = {
            generation: parentGenome.generation + 1,
            parentId: parentId,
            specializedTrait: parentGenome.specializedTrait,
            traits: { ...parentGenome.traits },
            mutationRecord: [...parentGenome.mutationRecord]
        };

        // Controlled Mutation (e.g., +/- 10% on traits)
        const mutationChance = crypto.randomInt(0, 100);
        if (mutationChance < 10) { // 10% chance to mutate
            childGenome.traits.maxConnections += 1;
            childGenome.mutationRecord.push(`GEN_${childGenome.generation}: Increased maxConnections`);
        }

        return childGenome;
    }

    /**
     * [PHASE 7: PHENOTYPIC PLASTICITY & ADAPTIVE MUTATION]
     * Mutates the current active cell genome in response to environmental
     * pressure or creator directive. Updates trait limits and logs immutable audit.
     */
    public static adaptPhenotype(
        currentGenome: CellGenome,
        targetTrait?: CyberTrait,
        pressureReason: string = 'Environmental adaptation pressure'
    ): CellGenome {
        const nextGen = currentGenome.generation + 1;
        const availableTraits = Object.values(CyberTrait);
        
        let newTrait = targetTrait;
        if (!newTrait || !availableTraits.includes(newTrait)) {
            // Pick next trait cyclically or based on entropy
            const currentIdx = availableTraits.indexOf(currentGenome.specializedTrait);
            newTrait = availableTraits[(currentIdx + 1) % availableTraits.length];
        }

        // Calibrate trait parameters based on phenotype archetype
        let metabolismRate = 1.0;
        let maxConnections = 20;
        let memoryAllocation = 512;

        switch (newTrait) {
            case CyberTrait.ROUTER:
                maxConnections = 128;
                metabolismRate = 1.5;
                memoryAllocation = 384;
                break;
            case CyberTrait.ARCHIVAL:
                memoryAllocation = 4096;
                maxConnections = 30;
                metabolismRate = 0.8;
                break;
            case CyberTrait.IMMUNE:
                maxConnections = 15;
                metabolismRate = 1.2;
                memoryAllocation = 512;
                break;
            case CyberTrait.REGENERATIVE:
                metabolismRate = 2.0;
                maxConnections = 50;
                memoryAllocation = 1024;
                break;
            case CyberTrait.EPHEMERAL:
                metabolismRate = 2.5;
                maxConnections = 64;
                memoryAllocation = 256;
                break;
        }

        const mutationDigest = crypto.createHash('sha256')
            .update(`GEN_${nextGen}:${newTrait}:${Date.now()}:${pressureReason}`)
            .digest('hex').substring(0, 12);

        const newRecord = `GEN_${nextGen} [${newTrait}]: ${pressureReason} (hash:${mutationDigest})`;

        return {
            generation: nextGen,
            parentId: currentGenome.parentId,
            specializedTrait: newTrait,
            traits: {
                metabolismRate,
                maxConnections,
                memoryAllocation
            },
            mutationRecord: [...currentGenome.mutationRecord, newRecord]
        };
    }
}

