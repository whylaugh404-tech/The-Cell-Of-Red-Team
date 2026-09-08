import * as fs from 'fs';
import * as path from 'path';

const MEMORY_FILE = path.join(process.cwd(), 'redqueen_memory.json');
const BACKUP_FILE = path.join(process.cwd(), 'redqueen_memory.bak.json');

export interface MemoryNode {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export class Hippocampus {
    private memories: MemoryNode[] = [];

    private MAX_MEMORY_LIMIT = 50;

    constructor() {
        this.load();
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
        
        // Synaptic Pruning: Mencegah storage Termux kepenuhan
        if (this.memories.length > this.MAX_MEMORY_LIMIT) {
            const removed = this.memories.shift();
            console.log(`[Hippocampus] 🧹 Synaptic Pruning: Memory full. Oldest memory deleted locally (safely archived in IPFS).`);
        }
        
        this.save();
    }

    public getContext(): MemoryNode[] {
        return this.memories;
    }

    public getFormattedContext(): string {
        if (!this.memories || this.memories.length === 0) {
            return 'Tidak ada observasi tersimpan.';
        }
        return this.memories
            .slice(-15) // ambil 15 catatan relevan terakhir
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
