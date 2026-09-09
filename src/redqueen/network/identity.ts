/**
 * [REAL CRYPTOGRAPHY] Cell Identity
 * Persistent ECDSA secp256k1 public/private keypair.
 * Saves and loads securely from disk so Node ID is strictly stable across reboots.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export class CellIdentity {
    public readonly publicKey: string;
    public readonly privateKey: string;
    public readonly cellId: string;
    private static readonly IDENTITY_DIR = path.join(process.cwd(), '.redqueen');
    private static readonly KEY_PATH = path.join(process.cwd(), '.redqueen', 'identity.json');

    constructor(customDir?: string) {
        const keyDir = customDir || CellIdentity.IDENTITY_DIR;
        const keyPath = customDir ? path.join(customDir, 'identity.json') : CellIdentity.KEY_PATH;

        if (fs.existsSync(keyPath)) {
            try {
                const raw = fs.readFileSync(keyPath, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed.publicKey && parsed.privateKey && parsed.cellId) {
                    this.publicKey = parsed.publicKey;
                    this.privateKey = parsed.privateKey;
                    this.cellId = parsed.cellId;
                    return;
                }
            } catch (err) {
                console.warn('[IDENTITY] Existing identity corrupted, generating new stable keypair.');
            }
        }

        // Generate secp256k1 keypair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        this.publicKey = publicKey;
        this.privateKey = privateKey;
        // cell_id is the deterministic SHA-256 hash of the public key (hex)
        this.cellId = crypto.createHash('sha256').update(this.publicKey).digest('hex');

        // Persist to disk with restricted permissions
        try {
            if (!fs.existsSync(keyDir)) {
                fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
            }
            fs.writeFileSync(keyPath, JSON.stringify({
                cellId: this.cellId,
                publicKey: this.publicKey,
                privateKey: this.privateKey,
                createdAt: new Date().toISOString()
            }, null, 2), { mode: 0o600 });
        } catch (e: any) {
            console.warn(`[IDENTITY] Notice: could not persist keypair to disk (${e.message}).`);
        }
    }

    public sign(data: Buffer): Buffer {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(this.privateKey);
    }

    public static verify(data: Buffer, signature: Buffer, publicKeyPem: string): boolean {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKeyPem, signature);
    }
}
