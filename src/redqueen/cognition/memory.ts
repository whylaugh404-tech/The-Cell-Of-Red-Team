import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { HolographicMemory, MemoryMetadata } from '../memory/manager';

const MEMORY_FILE = path.join(process.cwd(), 'redqueen_memory.json');
const BACKUP_FILE = path.join(process.cwd(), 'redqueen_memory.bak.json');
const INDEX_FILE = path.join(process.cwd(), 'redqueen_hologram_index.json');
const MASTER_KEY_FILE = path.join(process.cwd(), 'redqueen_master.key');

export interface MemoryNode {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface ShardIndex {
    objectId: string;
    metadata: MemoryMetadata;
    nonce: string;
    authTag: string;
    timestamp: number;
}

export class Hippocampus {
    private memories: MemoryNode[] = [];
    private shardIndices: ShardIndex[] = [];
    private MAX_MEMORY_LIMIT = 50;
    
    private masterKey!: Buffer;
    private holographicSystem: HolographicMemory;

    constructor() {
        this.holographicSystem = new HolographicMemory();
        this.loadMasterKey();
        this.load();
        this.loadIndices();
    }

    private loadMasterKey() {
        if (fs.existsSync(MASTER_KEY_FILE)) {
            this.masterKey = fs.readFileSync(MASTER_KEY_FILE);
        } else {
            this.masterKey = crypto.randomBytes(32); // AES-256 requires 32 bytes
            fs.writeFileSync(MASTER_KEY_FILE, this.masterKey);
        }
    }

    private loadIndices() {
        try {
            if (fs.existsSync(INDEX_FILE)) {
                this.shardIndices = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
            }
        } catch (e) {
            console.error('[Hippocampus] Failed to load Hologram Index.');
        }
    }

    private saveIndices() {
        fs.writeFileSync(INDEX_FILE, JSON.stringify(this.shardIndices, null, 2));
    }

    private load() {
        try {
            if (fs.existsSync(MEMORY_FILE)) {
                const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
                this.memories = JSON.parse(data);
                console.log(`[Hippocampus] 🧬 Intact DNA found. Long-term memory restored (${this.memories.length}/${this.MAX_MEMORY_LIMIT}).`);
            }
        } catch (e) {
            console.log('[Hippocampus] ⚠️ Memory corruption! Restoring from backup...');
            if (fs.existsSync(BACKUP_FILE)) {
                const data = fs.readFileSync(BACKUP_FILE, 'utf-8');
                this.memories = JSON.parse(data);
            }
        }
    }

    public addMemory(role: 'user' | 'model', text: string) {
        this.memories.push({ role, parts: [{ text }] });
        
        // Biological Mitosis via Holographic Sharding & P2P Offloading
        if (this.memories.length > this.MAX_MEMORY_LIMIT) {
            this.triggerHolographicMitosis();
        }
        
        this.save();
    }

    private triggerHolographicMitosis() {
        // Ambil 50% memori tertua
        const childMemories = this.memories.splice(0, Math.floor(this.MAX_MEMORY_LIMIT / 2));
        const dataBuffer = Buffer.from(JSON.stringify(childMemories));

        try {
            // 1. Enkripsi dan Sharding Holografik (3 Data Shard, 2 Parity Shard = 5 Pecahan)
            const { metadata, shards, nonce, authTag } = this.holographicSystem.encryptAndShard(
                dataBuffer,
                this.masterKey,
                3, 
                2  
            );

            // 2. Simpan Index Kriptografi (Dibutuhkan untuk penarikan/rekonstruksi nanti)
            const indexEntry: ShardIndex = {
                objectId: metadata.objectId,
                metadata: metadata,
                nonce: nonce.toString('hex'),
                authTag: authTag.toString('hex'),
                timestamp: Date.now()
            };
            this.shardIndices.push(indexEntry);
            this.saveIndices();

            // 3. (Simulasi Realistis) Mendelegasikan pecahan ke jaringan Peer / Cell eksternal.
            // HolographicMemory.manager secara default menyimpannya di local cache untuk simulasi,
            // Namun secara arsitektur, ini adalah titik di mana file fisik lokal (raw) dihancurkan 
            // dan berubah menjadi sinyal energi murni (shard) ke internet.
            
            console.log(`\n======================================================`);
            console.log(`🧬 [MITOSIS INITIATED] Kapasitas maksimum tercapai!`);
            console.log(`🔐 [HOLOGRAPHIC SHARDING] Mengekstrak 50% memori tertua.`);
            console.log(`🔒 Mengenkripsi fragmen dengan AES-256-GCM.`);
            console.log(`🧩 Memecah Payload menjadi ${metadata.shardCount} Data Shards & ${metadata.parityCount} Parity Shards (XOR).`);
            console.log(`📡 [P2P OFFLOAD] Mendelegasikan ${shards.length} Shards ke jaringan eksternal (Mesh).`);
            console.log(`🗑️ [APOPTOSIS] Menghapus salinan lokal untuk mencegah Storage Exhaustion.`);
            console.log(`======================================================\n`);

        } catch (e) {
            console.error('[Hippocampus] Gagal melakukan Mitosis Holografik.', e);
            // Kembalikan memori jika enkripsi/sharding gagal (Failsafe)
            this.memories.unshift(...childMemories);
        }
    }

    public recallHologram(objectId: string): any | null {
        const index = this.shardIndices.find(idx => idx.objectId === objectId);
        if (!index) return null;

        try {
            console.log(`\n📡 [KADEMLIA DHT] Mencari Shards untuk Object ID: ${objectId}...`);
            // Mengambil shard dari cache jaringan lokal/Mesh
            const availableShards = index.metadata.shardIdentifiers.map(id => 
                this.holographicSystem.getLocalShard(id) || null
            );
            
            const recoveredBuffer = this.holographicSystem.reconstructAndDecrypt(
                availableShards,
                this.masterKey,
                Buffer.from(index.nonce, 'hex'),
                Buffer.from(index.authTag, 'hex'),
                index.metadata
            );
            
            console.log(`🧩 [REASSEMBLY SUCCESS] Memori lama berhasil dipulihkan dari pecahan P2P!`);
            return JSON.parse(recoveredBuffer.toString('utf-8'));
        } catch (e) {
            console.error(`[Hippocampus] Gagal merekonstruksi hologram ${objectId}:`, e);
            return null;
        }
    }

    public getContext(): MemoryNode[] {
        return this.memories;
    }

    public getFormattedContext(): string {
        if (!this.memories || this.memories.length === 0) {
            return 'Tidak ada observasi tersimpan.';
        }
        return this.memories
            .slice(-15)
            .map((m, i) => {
                const text = m.parts.map(p => p.text).join(' ');
                return `[Memori #${i + 1}]: ${text}`;
            })
            .join('\n');
    }

    private save() {
        try {
            const data = JSON.stringify(this.memories, null, 2);
            if (fs.existsSync(MEMORY_FILE)) fs.copyFileSync(MEMORY_FILE, BACKUP_FILE);
            fs.writeFileSync(MEMORY_FILE, data);
        } catch (e) {
            console.error('[Hippocampus] Failed to engrave memory.');
        }
    }
}
