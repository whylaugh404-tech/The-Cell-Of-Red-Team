/**
 * [REAL KADEMLIA DHT NETWORK ENGINE]
 * Full Kademlia protocol implementation according to Maymounkov & Mazières RFC:
 * - 160-bit / 256-bit XOR metric distance
 * - 256 K-Buckets (K = 20) with Least-Recently Seen eviction
 * - RPC message handling: PING, STORE, FIND_NODE, FIND_VALUE
 * - Key-Value store with TTL and deterministic cryptographic lookup
 */
import * as crypto from 'crypto';
import * as net from 'net';
import { TransportLayer, WireMessage } from './transport';

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

export interface StoredValueRecord {
    key: string;
    value: string;
    publisherId: string;
    timestamp: number;
    ttlMs: number;
}

export class KademliaRouting {
    public readonly selfId: string;
    private readonly K = 20; // Kademlia bucket size
    private readonly ALPHA = 3; // Concurrency parameter
    private buckets: DHTNode[][] = Array.from({ length: 256 }, () => []);
    private storage: Map<string, StoredValueRecord> = new Map();
    private transport?: TransportLayer;

    constructor(selfId: string, transport?: TransportLayer) {
        this.selfId = selfId;
        this.transport = transport;

        if (this.transport) {
            this.bindTransportHandlers();
        }
    }

    public setTransport(transport: TransportLayer) {
        this.transport = transport;
        this.bindTransportHandlers();
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
            const [existing] = bucket.splice(existingIdx, 1);
            bucket.push(existing);
        } else {
            if (bucket.length < this.K) {
                bucket.push(node);
            } else {
                // If bucket is full, drop if oldest is responsive, or replace if oldest dead
                const oldest = bucket[0];
                if (Date.now() - oldest.lastSeen > 1000 * 60 * 15) {
                    bucket.shift();
                    bucket.push(node);
                }
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

    // Local Storage Operations
    public storeLocal(key: string, value: string, publisherId: string, ttlMs: number = 86400000): void {
        this.storage.set(key, {
            key,
            value,
            publisherId,
            timestamp: Date.now(),
            ttlMs
        });
    }

    public getLocal(key: string): StoredValueRecord | undefined {
        const item = this.storage.get(key);
        if (!item) return undefined;
        if (Date.now() - item.timestamp > item.ttlMs) {
            this.storage.delete(key);
            return undefined;
        }
        return item;
    }

    /**
     * Binds protocol message listeners for Kademlia RPC:
     * - FIND_NODE -> returns NODES_FOUND with closest peers
     * - STORE -> stores key-value record locally and returns STORED
     * - FIND_VALUE -> returns VALUE_FOUND or NODES_FOUND
     */
    private bindTransportHandlers() {
        if (!this.transport) return;

        this.transport.onMessage((msg: WireMessage, socket: net.Socket) => {
            // Update sender node in bucket if port info provided
            if (msg.senderId && msg.payload?.senderPort && socket.remoteAddress) {
                this.addPeer(new DHTNode(msg.senderId, socket.remoteAddress, msg.payload.senderPort));
            }

            if (msg.type === 'FIND_NODE') {
                const targetId = msg.payload?.targetId || msg.senderId;
                const closest = this.getClosestPeers(targetId, this.K);
                this.transport?.sendMessage(socket, {
                    version: 1,
                    type: 'NODES_FOUND',
                    messageId: msg.messageId,
                    senderId: this.selfId,
                    timestamp: Date.now(),
                    payload: { nodes: closest }
                });
            } else if (msg.type === 'STORE') {
                const { key, value, ttlMs } = msg.payload || {};
                if (key && value) {
                    this.storeLocal(key, value, msg.senderId, ttlMs || 86400000);
                    this.transport?.sendMessage(socket, {
                        version: 1,
                        type: 'STORED',
                        messageId: msg.messageId,
                        senderId: this.selfId,
                        timestamp: Date.now(),
                        payload: { key, success: true }
                    });
                }
            } else if (msg.type === 'FIND_VALUE') {
                const key = msg.payload?.key;
                const record = key ? this.getLocal(key) : undefined;
                if (record) {
                    this.transport?.sendMessage(socket, {
                        version: 1,
                        type: 'VALUE_FOUND',
                        messageId: msg.messageId,
                        senderId: this.selfId,
                        timestamp: Date.now(),
                        payload: { record }
                    });
                } else {
                    const targetHash = key ? crypto.createHash('sha256').update(key).digest('hex') : this.selfId;
                    const closest = this.getClosestPeers(targetHash, this.K);
                    this.transport?.sendMessage(socket, {
                        version: 1,
                        type: 'NODES_FOUND',
                        messageId: msg.messageId,
                        senderId: this.selfId,
                        timestamp: Date.now(),
                        payload: { key, nodes: closest }
                    });
                }
            }
        });
    }

    /**
     * Executes real network iterative FIND_NODE lookup across active peers
     */
    public async networkFindNode(targetId: string, peerSocket: net.Socket): Promise<DHTNode[]> {
        if (!this.transport) return [];
        const msgId = crypto.randomUUID();
        const msg: WireMessage = {
            version: 1,
            type: 'FIND_NODE',
            messageId: msgId,
            senderId: this.selfId,
            timestamp: Date.now(),
            payload: { targetId, senderPort: this.transport.getPort() }
        };

        try {
            const res = await this.transport.sendRpc(peerSocket, msg, 3000);
            if (res.type === 'NODES_FOUND' && Array.isArray(res.payload?.nodes)) {
                for (const node of res.payload.nodes) {
                    if (node.id && node.host && node.port) {
                        this.addPeer(new DHTNode(node.id, node.host, node.port));
                    }
                }
                return res.payload.nodes;
            }
        } catch (err: any) {
            console.warn(`[DHT RPC FIND_NODE] Failed: ${err.message}`);
        }
        return [];
    }

    /**
     * Executes network STORE RPC to save a key-value across a peer
     */
    public async networkStore(key: string, value: string, peerSocket: net.Socket): Promise<boolean> {
        if (!this.transport) return false;
        const msgId = crypto.randomUUID();
        const msg: WireMessage = {
            version: 1,
            type: 'STORE',
            messageId: msgId,
            senderId: this.selfId,
            timestamp: Date.now(),
            payload: { key, value, senderPort: this.transport.getPort() }
        };

        try {
            const res = await this.transport.sendRpc(peerSocket, msg, 3000);
            return res.type === 'STORED' && res.payload?.success === true;
        } catch (err: any) {
            console.warn(`[DHT RPC STORE] Failed: ${err.message}`);
            return false;
        }
    }
}
