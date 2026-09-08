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

    constructor() {
        this.load();
    }

    private load() {
        try {
            if (fs.existsSync(MEMORY_FILE)) {
                const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
                this.memories = JSON.parse(data);
                console.log('[Hippocampus] 🧬 Intact DNA found. Long-term memory restored.');
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
        // Keep only the last 100 turns
        if (this.memories.length > 100) this.memories.shift();
        this.save();
    }

    public getContext(): MemoryNode[] {
        return this.memories;
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
