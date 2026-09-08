/**
 * [IMPLEMENTED] Cell Identity
 * Uses secp256k1 public/private keys for strong cryptographic identity.
 */
import * as crypto from 'crypto';

export class CellIdentity {
    public readonly publicKey: string;
    public readonly privateKey: string;
    public readonly cellId: string;

    constructor() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        // cell_id is the SHA-256 hash of the public key (hex)
        this.cellId = crypto.createHash('sha256').update(this.publicKey).digest('hex');
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
