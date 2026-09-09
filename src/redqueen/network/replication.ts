/**
 * [REAL P2P SERIALIZATION & DIRECT PEER REPLICATION]
 * Eliminates external third-party pastebin simulations.
 * Packages encrypted Cell DNA (Identity, Genome, Memory Shards, and Synaptic State)
 * and streams it directly to active peer TCP sockets or saves to offline genesis capsules (.redqueen/capsules/).
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CellIdentity } from './identity';
import { CellGenome } from '../replication/genome';
import { Hippocampus } from '../cognition/memory';
import { TransportLayer, WireMessage } from './transport';

export interface CellDnaCapsule {
    version: number;
    capsuleId: string;
    originCellId: string;
    timestamp: number;
    genome: CellGenome;
    assimilatedContext: string;
    encryptedMemoryPayload: {
        ivHex: string;
        authTagHex: string;
        ciphertextHex: string;
    };
    integrityHash: string;
    signatureHex: string;
}

export class DirectCellReplicator {
    private identity: CellIdentity;
    private genome: CellGenome;
    private memory: Hippocampus;
    private transport?: TransportLayer;
    private replicationKey: Buffer;
    private capsuleDir: string;

    constructor(
        identity: CellIdentity,
        genome: CellGenome,
        memory: Hippocampus,
        transport?: TransportLayer,
        customDir?: string
    ) {
        this.identity = identity;
        this.genome = genome;
        this.memory = memory;
        this.transport = transport;
        // Deterministic replication encryption key derived from cell private key & fixed salt
        this.replicationKey = crypto.scryptSync(this.identity.privateKey, 'RED_QUEEN_MDS_REPLICATION_SALT', 32);
        this.capsuleDir = customDir || path.join(process.cwd(), '.redqueen', 'capsules');

        if (!fs.existsSync(this.capsuleDir)) {
            try {
                fs.mkdirSync(this.capsuleDir, { recursive: true, mode: 0o700 });
            } catch (err) {}
        }
    }

    /**
     * Packages memory snapshot into an authenticated AES-256-GCM encrypted block
     */
    private sealPayload(rawJson: string): { ivHex: string; authTagHex: string; ciphertextHex: string } {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.replicationKey, iv);
        const ciphertext = Buffer.concat([cipher.update(Buffer.from(rawJson, 'utf-8')), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return {
            ivHex: iv.toString('hex'),
            authTagHex: authTag.toString('hex'),
            ciphertextHex: ciphertext.toString('hex')
        };
    }

    /**
     * Unseals encrypted DNA block
     */
    public unsealPayload(encrypted: { ivHex: string; authTagHex: string; ciphertextHex: string }): any {
        const iv = Buffer.from(encrypted.ivHex, 'hex');
        const authTag = Buffer.from(encrypted.authTagHex, 'hex');
        const ciphertext = Buffer.from(encrypted.ciphertextHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', this.replicationKey, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return JSON.parse(decrypted.toString('utf-8'));
    }

    /**
     * Generates a signed, self-contained, reproducible DNA capsule
     */
    public createCapsule(latestObservation?: string): CellDnaCapsule {
        const capsuleId = crypto.randomUUID();
        const timestamp = Date.now();

        const internalMemoryData = {
            memories: this.memory.getContext(),
            latestObservation: latestObservation || 'Standard Mitotic Cycle'
        };

        const encryptedMemoryPayload = this.sealPayload(JSON.stringify(internalMemoryData));

        const canonicalPayload = JSON.stringify({
            capsuleId,
            originCellId: this.identity.cellId,
            timestamp,
            genome: this.genome,
            assimilatedContext: this.memory.getFormattedContext(),
            encryptedMemoryPayload
        });

        const integrityHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
        const signatureBuf = this.identity.sign(Buffer.from(integrityHash, 'utf-8'));

        const capsule: CellDnaCapsule = {
            version: 2,
            capsuleId,
            originCellId: this.identity.cellId,
            timestamp,
            genome: {
                ...this.genome,
                generation: this.genome.generation + 1,
                parentId: this.identity.cellId
            },
            assimilatedContext: this.memory.getFormattedContext(),
            encryptedMemoryPayload,
            integrityHash,
            signatureHex: signatureBuf.toString('hex')
        };

        // Persist locally to node's capsule cache
        try {
            const capsulePath = path.join(this.capsuleDir, `capsule-${capsule.capsuleId}.json`);
            fs.writeFileSync(capsulePath, JSON.stringify(capsule, null, 2), { mode: 0o600 });
            console.log(`🧬 [REPLICATION CAPSULE] Sealed signed state capsule ${capsule.capsuleId.substring(0, 8)} to disk.`);
        } catch (e: any) {
            console.warn(`[REPLICATION] Notice: Could not write capsule file (${e.message}).`);
        }

        return capsule;
    }

    /**
     * Replicates state across active peer connections via direct TCP socket
     */
    public async replicateToPeers(latestObservation?: string): Promise<{ deliveredPeers: number; capsule: CellDnaCapsule }> {
        const capsule = this.createCapsule(latestObservation);
        let deliveredPeers = 0;

        if (this.transport) {
            const activeSockets = this.transport.getActiveSockets();
            for (const sockInfo of activeSockets) {
                // Replicate via P2P wire message
                const wireMsg: WireMessage = {
                    version: 1,
                    type: 'REPLICATE_STATE' as any,
                    messageId: crypto.randomUUID(),
                    senderId: this.identity.cellId,
                    timestamp: Date.now(),
                    payload: capsule,
                    signature: capsule.signatureHex
                };
                
                // Direct transmission without intermediaries
                const sock = this.transport.getSocketById(sockInfo.id);
                if (sock && sock.writable) {
                    this.transport.sendMessage(sock, wireMsg);
                    deliveredPeers++;
                }
            }
        }

        console.log(`🚀 [DIRECT REPLICATION] Dispatched capsule ${capsule.capsuleId.substring(0, 8)} to ${deliveredPeers} active TCP peers.`);
        return { deliveredPeers, capsule };
    }
}
