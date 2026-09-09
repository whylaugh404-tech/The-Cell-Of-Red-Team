/**
 * [REAL ERASURE CODING & CRYPTOGRAPHY] HolographicMemory
 * Uses Cauchy Distribution Generator over GF(256) which is guaranteed to be non-singular
 * for any submatrix (MDS property: Maximum Distance Separable code),
 * and authenticated AES-256-GCM encryption.
 * Allows recovery when ANY 'parityCount' shards are lost.
 */
import * as crypto from 'crypto';

export interface MemoryMetadata {
    objectId: string;
    version: number;
    originalSize: number;
    ciphertextSize: number;
    chunkSize: number;
    shardCount: number;
    parityCount: number;
    encryption: 'aes-256-gcm';
    shardIdentifiers: string[];
    shardHashes: string[];
}

export interface EncryptedShards {
    metadata: MemoryMetadata;
    shards: Buffer[];
    nonce: Buffer;
    authTag: Buffer;
}

// GF(256) Primitive Polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1)
export class GF256 {
    public static exp: number[] = new Array(512);
    public static log: number[] = new Array(256);
    private static initialized = false;

    public static init() {
        if (this.initialized) return;
        let x = 1;
        for (let i = 0; i < 255; i++) {
            this.exp[i] = x;
            this.log[x] = i;
            x <<= 1;
            if (x & 0x100) {
                x ^= 0x11D;
            }
        }
        for (let i = 255; i < 512; i++) {
            this.exp[i] = this.exp[i - 255];
        }
        this.initialized = true;
    }

    public static mul(a: number, b: number): number {
        this.init();
        if (a === 0 || b === 0) return 0;
        return this.exp[(this.log[a] + this.log[b]) % 255];
    }

    public static inv(a: number): number {
        this.init();
        if (a === 0) throw new Error('Zero has no inverse in GF(256)');
        return this.exp[255 - this.log[a]];
    }

    public static add(a: number, b: number): number {
        return a ^ b;
    }
}

export class HolographicMemory {
    private memoryIndex: Map<string, MemoryMetadata>;
    private localShards: Map<string, Buffer>;

    constructor() {
        this.memoryIndex = new Map();
        this.localShards = new Map();
        GF256.init();
    }

    /**
     * Cauchy Matrix element at (i, j): 1 / (X_i ^ Y_j)
     * Cauchy matrices guarantee that EVERY square submatrix is invertible over GF(256).
     * X = [128, 129, ...] (Parity indices)
     * Y = [0, 1, 2, ...] (Data indices)
     * Since X and Y are completely disjoint sets, (X_i ^ Y_j) != 0 for all i, j.
     */
    private getCauchyCoeff(parityIndex: number, dataIndex: number): number {
        const x = 128 + parityIndex;
        const y = dataIndex;
        const diff = x ^ y;
        return GF256.inv(diff);
    }

    /**
     * Authenticated AES-256-GCM encryption followed by Cauchy MDS Erasure Coding
     */
    public encryptAndShard(
        data: Buffer,
        key: Buffer,
        shardCount: number = 3,
        parityCount: number = 2
    ): EncryptedShards {
        if (key.length !== 32) {
            throw new Error('Key must be exactly 32 bytes for AES-256-GCM');
        }
        if (shardCount < 1 || parityCount < 1 || shardCount > 120 || parityCount > 120) {
            throw new Error('Invalid shard/parity dimensions');
        }

        // 1. Authenticated AES-256-GCM Encryption
        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
        const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();

        const objectId = crypto.createHash('sha256').update(ciphertext).digest('hex');

        // 2. Data Chunking
        const chunkSize = Math.ceil(ciphertext.length / shardCount);
        const shards: Buffer[] = [];
        const shardIdentifiers: string[] = [];
        const shardHashes: string[] = [];

        for (let i = 0; i < shardCount; i++) {
            const chunk = Buffer.alloc(chunkSize, 0);
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, ciphertext.length);
            if (start < ciphertext.length) {
                ciphertext.copy(chunk, 0, start, end);
            }
            shards.push(chunk);

            const shardId = crypto.createHash('sha256').update(`${objectId}-data-${i}`).digest('hex');
            shardIdentifiers.push(shardId);
            shardHashes.push(crypto.createHash('sha256').update(chunk).digest('hex'));
        }

        // 3. Cauchy MDS Parity Generation
        for (let p = 0; p < parityCount; p++) {
            const parityChunk = Buffer.alloc(chunkSize, 0);
            for (let b = 0; b < chunkSize; b++) {
                let acc = 0;
                for (let d = 0; d < shardCount; d++) {
                    const coeff = this.getCauchyCoeff(p, d);
                    acc ^= GF256.mul(shards[d][b], coeff);
                }
                parityChunk[b] = acc;
            }
            shards.push(parityChunk);

            const parityId = crypto.createHash('sha256').update(`${objectId}-parity-${p}`).digest('hex');
            shardIdentifiers.push(parityId);
            shardHashes.push(crypto.createHash('sha256').update(parityChunk).digest('hex'));
        }

        const metadata: MemoryMetadata = {
            objectId,
            version: 2,
            originalSize: data.length,
            ciphertextSize: ciphertext.length,
            chunkSize,
            shardCount,
            parityCount,
            encryption: 'aes-256-gcm',
            shardIdentifiers,
            shardHashes
        };

        this.memoryIndex.set(objectId, metadata);

        // Store shards locally
        shards.forEach((shard, idx) => {
            this.storeLocalShard(shardIdentifiers[idx], shard);
        });

        return { metadata, shards, nonce, authTag };
    }

    /**
     * Reconstructs missing shards using Cauchy Matrix Inversion over GF(256),
     * recombines ciphertext, and performs authenticated decryption.
     */
    public reconstructAndDecrypt(
        availableShards: (Buffer | null)[],
        key: Buffer,
        nonce: Buffer,
        authTag: Buffer,
        metadata: MemoryMetadata
    ): Buffer {
        const { shardCount, parityCount, chunkSize, ciphertextSize } = metadata;
        const totalShards = shardCount + parityCount;

        // Collect available shards
        const presentIndices: number[] = [];
        for (let i = 0; i < totalShards; i++) {
            if (availableShards[i] && availableShards[i]!.length === chunkSize) {
                presentIndices.push(i);
            }
        }

        if (presentIndices.length < shardCount) {
            throw new Error(`Insufficient surviving shards (${presentIndices.length}/${shardCount} required)`);
        }

        // Check if all data shards are already available
        let allDataPresent = true;
        for (let i = 0; i < shardCount; i++) {
            if (!availableShards[i]) {
                allDataPresent = false;
                break;
            }
        }

        const recoveredDataShards: Buffer[] = [];

        if (allDataPresent) {
            for (let i = 0; i < shardCount; i++) {
                recoveredDataShards.push(availableShards[i]!);
            }
        } else {
            // Select exactly 'shardCount' surviving shards
            const selectedIndices = presentIndices.slice(0, shardCount);

            // Construct selected encoding matrix
            const matrix: number[][] = [];
            for (let r = 0; r < shardCount; r++) {
                const idx = selectedIndices[r];
                const row = new Array(shardCount).fill(0);
                if (idx < shardCount) {
                    row[idx] = 1; // Identity row for data shard
                } else {
                    const p = idx - shardCount;
                    for (let c = 0; c < shardCount; c++) {
                        row[c] = this.getCauchyCoeff(p, c);
                    }
                }
                matrix.push(row);
            }

            // Invert using Gauss-Jordan over GF(256)
            const augmented: number[][] = [];
            for (let r = 0; r < shardCount; r++) {
                const augRow = new Array(2 * shardCount).fill(0);
                for (let c = 0; c < shardCount; c++) {
                    augRow[c] = matrix[r][c];
                }
                augRow[shardCount + r] = 1;
                augmented.push(augRow);
            }

            for (let col = 0; col < shardCount; col++) {
                // Find non-zero pivot
                let pivotRow = -1;
                for (let r = col; r < shardCount; r++) {
                    if (augmented[r][col] !== 0) {
                        pivotRow = r;
                        break;
                    }
                }
                if (pivotRow === -1) {
                    throw new Error('Singular submatrix encountered in Cauchy decode');
                }

                // Swap rows
                if (pivotRow !== col) {
                    const temp = augmented[col];
                    augmented[col] = augmented[pivotRow];
                    augmented[pivotRow] = temp;
                }

                // Scale pivot row
                const pivotVal = augmented[col][col];
                const invPivot = GF256.inv(pivotVal);
                for (let c = 0; c < 2 * shardCount; c++) {
                    augmented[col][c] = GF256.mul(augmented[col][c], invPivot);
                }

                // Eliminate other rows
                for (let r = 0; r < shardCount; r++) {
                    if (r !== col && augmented[r][col] !== 0) {
                        const factor = augmented[r][col];
                        for (let c = 0; c < 2 * shardCount; c++) {
                            augmented[r][c] ^= GF256.mul(factor, augmented[col][c]);
                        }
                    }
                }
            }

            // Extract inverted submatrix
            const invMatrix: number[][] = [];
            for (let r = 0; r < shardCount; r++) {
                invMatrix.push(augmented[r].slice(shardCount));
            }

            // Reconstruct data shards
            for (let d = 0; d < shardCount; d++) {
                const chunk = Buffer.alloc(chunkSize, 0);
                for (let b = 0; b < chunkSize; b++) {
                    let val = 0;
                    for (let s = 0; s < shardCount; s++) {
                        const coeff = invMatrix[d][s];
                        const shardData = availableShards[selectedIndices[s]]!;
                        val ^= GF256.mul(shardData[b], coeff);
                    }
                    chunk[b] = val;
                }
                recoveredDataShards.push(chunk);
            }
        }

        // Recombine ciphertext
        const combined = Buffer.concat(recoveredDataShards).subarray(0, ciphertextSize);

        // Authenticated AES-256-GCM Decryption
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(combined), decipher.final()]);
    }

    public storeLocalShard(shardId: string, data: Buffer) {
        this.localShards.set(shardId, data);
    }

    public getLocalShard(shardId: string): Buffer | undefined {
        return this.localShards.get(shardId);
    }

    public getLocalShardCount(): number {
        return this.localShards.size;
    }

    public getIndexedObjectsCount(): number {
        return this.memoryIndex.size;
    }

    public getMetadata(objectId: string): MemoryMetadata | undefined {
        return this.memoryIndex.get(objectId);
    }
}
