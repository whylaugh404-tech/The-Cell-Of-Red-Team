import { randomUUID } from 'crypto';

export interface MemoryPayload {
    id: string;
    timestamp: number;
    dataSize: number;
    content: Buffer | string; // FIXED: Strict typing, menolak injection tipe data abstrak (sebelumnya 'any')
}

/**
 * [REAL IMPLEMENTATION] Sel Memori Red Queen (Autonomous Memory Node)
 * Telah diaudit: Mengandung perbaikan Heuristic Routing & Apoptosis
 */
export class RedQueenMemoryCell {
    public readonly id: string;
    public parentId: string | null;
    public isDead: boolean = false; // APOPTOSIS MARKER
    
    public readonly MAX_CAPACITY_BYTES: number;
    private currentSizeBytes: number = 0;
    
    private storage: Map<string, MemoryPayload> = new Map();
    private meshNetwork: Set<RedQueenMemoryCell>;

    constructor(
        maxCapacityBytes: number,
        meshNetwork: Set<RedQueenMemoryCell>,
        parentId: string | null = null
    ) {
        this.id = randomUUID();
        this.MAX_CAPACITY_BYTES = maxCapacityBytes;
        this.meshNetwork = meshNetwork;
        this.parentId = parentId;
        
        this.meshNetwork.add(this);
    }

    public store(payload: MemoryPayload): string {
        if (this.isDead) {
            throw new Error(`[CRITICAL] Akses ilegal ke Cell mati: ${this.id}`);
        }

        if (this.currentSizeBytes + payload.dataSize > this.MAX_CAPACITY_BYTES) {
            this.mitosis();
            return this.delegateToPeer(payload);
        }

        this.storage.set(payload.id, payload);
        this.currentSizeBytes += payload.dataSize;
        return this.id;
    }

    public retrieve(payloadId: string): MemoryPayload | null {
        if (this.isDead) return null;
        return this.storage.get(payloadId) || null;
    }

    private mitosis(): void {
        // 1. Initiating Child Nodes
        const childA = new RedQueenMemoryCell(this.MAX_CAPACITY_BYTES, this.meshNetwork, this.id);
        const childB = new RedQueenMemoryCell(this.MAX_CAPACITY_BYTES, this.meshNetwork, this.id);

        // 2. Distribusi Sharding (50/50 split)
        let toggle = true;
        for (const [key, payload] of this.storage.entries()) {
            if (toggle) childA.storeBypass(payload);
            else childB.storeBypass(payload);
            toggle = !toggle;
        }

        // 3. APOPTOSIS (Kematian Sel Terprogram)
        // Celah Logika Diperbaiki: Biologi mendikte induk menjadi dua anak. Induk tidak boleh tersisa sebagai 'Zombie Node'.
        this.storage.clear();
        this.currentSizeBytes = 0;
        this.isDead = true; 
        this.meshNetwork.delete(this); // Cabut diri dari jaringan P2P
    }

    private storeBypass(payload: MemoryPayload) {
        this.storage.set(payload.id, payload);
        this.currentSizeBytes += payload.dataSize;
    }

    private delegateToPeer(payload: MemoryPayload): string {
        // Celah Logika Diperbaiki: Heuristic Routing (Dynamic Load Balancing)
        // Mencari node dengan sisa ruang terbanyak, mencegah Cascade Failure (kegagalan beruntun) di area padat.
        let bestPeer: RedQueenMemoryCell | null = null;
        let maxAvailableSpace = -1;

        for (const cell of this.meshNetwork) {
            if (cell.id !== this.id && !cell.isDead) {
                const availableSpace = cell.MAX_CAPACITY_BYTES - cell.currentSizeBytes;
                if (availableSpace >= payload.dataSize && availableSpace > maxAvailableSpace) {
                    maxAvailableSpace = availableSpace;
                    bestPeer = cell;
                }
            }
        }

        if (bestPeer) {
            return bestPeer.store(payload);
        }
        
        // Failsafe: Jaringan Saturasi Global (Global Exhaustion).
        const emergencyCell = new RedQueenMemoryCell(this.MAX_CAPACITY_BYTES, this.meshNetwork, this.id);
        return emergencyCell.store(payload);
    }
    
    public getMetrics() {
        return {
            id: this.id,
            capacityUsage: `${((this.currentSizeBytes / this.MAX_CAPACITY_BYTES) * 100).toFixed(2)}%`,
            payloadCount: this.storage.size,
            status: this.isDead ? 'DEAD' : 'ALIVE',
            parentId: this.parentId
        };
    }
}
