/**
 * [IMPLEMENTED] Kademlia DHT
 * Real XOR metric routing table with K-Buckets.
 */
export class DHTNode {
    public readonly id: string;
    public readonly host: string;
    public readonly port: number;
    public lastSeen: number;

    constructor(id: string, host: string, port: number) {
        this.id = id;
        this.host = host;
        this.port = port;
        this.lastSeen = Date.now();
    }
}

export class KademliaRouting {
    private selfId: string;
    private readonly K = 20; // Kademlia constant K
    private buckets: DHTNode[][] = Array.from({ length: 256 }, () => []);

    constructor(selfId: string) {
        this.selfId = selfId;
    }

    public static xorDistance(id1: string, id2: string): bigint {
        const b1 = BigInt(`0x${id1}`);
        const b2 = BigInt(`0x${id2}`);
        return b1 ^ b2;
    }

    private getBucketIndex(distance: bigint): number {
        if (distance === 0n) return 0;
        let index = 0;
        let temp = distance;
        while (temp > 0n) {
            temp >>= 1n;
            index++;
        }
        return Math.min(index, 255);
    }

    public addPeer(node: DHTNode): void {
        if (node.id === this.selfId) return;
        const distance = KademliaRouting.xorDistance(this.selfId, node.id);
        const bucketIndex = this.getBucketIndex(distance);
        const bucket = this.buckets[bucketIndex];

        const existingIdx = bucket.findIndex(n => n.id === node.id);
        if (existingIdx !== -1) {
            bucket[existingIdx].lastSeen = Date.now();
            // Move to tail (most recently seen)
            const [existing] = bucket.splice(existingIdx, 1);
            bucket.push(existing);
        } else {
            if (bucket.length < this.K) {
                bucket.push(node);
            } else {
                // Ping oldest, if alive drop new, else replace. (Simplified to drop for now)
            }
        }
    }

    public getClosestPeers(targetId: string, limit: number = this.K): DHTNode[] {
        const allPeers = this.buckets.flat();
        allPeers.sort((a, b) => {
            const distA = KademliaRouting.xorDistance(a.id, targetId);
            const distB = KademliaRouting.xorDistance(b.id, targetId);
            return distA < distB ? -1 : distA > distB ? 1 : 0;
        });
        return allPeers.slice(0, limit);
    }

    public getRoutingTableSize(): number {
        return this.buckets.flat().length;
    }

    public getPeerCount(): number {
        return this.getRoutingTableSize();
    }

    public getAllPeers(): DHTNode[] {
        return this.buckets.flat();
    }
}
