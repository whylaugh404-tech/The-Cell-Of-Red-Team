import { RedQueenMemoryCell, MemoryPayload } from './cell.ts';
import { randomBytes, randomUUID } from 'crypto';

const distributedMesh = new Set<RedQueenMemoryCell>();
const MAX_CAPACITY = 10 * 1024; 

let entryPointCell = new RedQueenMemoryCell(MAX_CAPACITY, distributedMesh);

const injectData = (megabytes: number) => {
    const totalBytes = megabytes * 1024 * 1024;
    let bytesInjected = 0;
    
    while (bytesInjected < totalBytes) {
        const packetSize = 4096; 
        const payload: MemoryPayload = {
            id: randomUUID(),
            timestamp: Date.now(),
            dataSize: packetSize,
            content: randomBytes(packetSize) 
        };

        // Jika sel akses pertama mati (Apoptosis), cari sel terdekat yang hidup
        if (entryPointCell.isDead) {
            for (const cell of distributedMesh) {
                if (!cell.isDead) {
                    entryPointCell = cell;
                    break;
                }
            }
        }
        entryPointCell.store(payload);
        bytesInjected += packetSize;
    }
};

// Eksekusi Stress Test
injectData(0.05);

console.log(`\n[HASIL JARINGAN MEMORI] Total Sel Memori di Mesh: ${distributedMesh.size}`);
for (const cell of distributedMesh) {
    console.log(cell.getMetrics());
}
