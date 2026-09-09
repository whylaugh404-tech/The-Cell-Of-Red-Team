/**
 * [REAL CREATOR GOVERNANCE]
 * Verifies secp256k1 cryptographic signatures for creator commands.
 * Commands signed by authorized creator key are granted elevated execution permissions.
 */
import { CellIdentity } from '../network/identity';

export interface CreatorCommand {
    action: string;
    params?: any;
    targetCellId?: string;
    timestamp: number;
    nonce: string;
}

export class GovernanceEngine {
    private authorizedPublicKeys: Set<string> = new Set();
    private processedNonces: Set<string> = new Set();

    constructor(defaultAuthorizedKeys: string[] = []) {
        for (const k of defaultAuthorizedKeys) {
            if (k && k.trim()) this.authorizedPublicKeys.add(k.trim());
        }
    }

    public addAuthorizedKey(publicKeyPem: string) {
        this.authorizedPublicKeys.add(publicKeyPem.trim());
    }

    public isKeyAuthorized(publicKeyPem: string): boolean {
        return this.authorizedPublicKeys.has(publicKeyPem.trim());
    }

    public verifyCommand(
        commandPayloadJson: string,
        signatureHex: string,
        senderPublicKeyPem: string
    ): { authorized: boolean; reason?: string; command?: CreatorCommand } {
        try {
            const sigBuf = Buffer.from(signatureHex, 'hex');
            const dataBuf = Buffer.from(commandPayloadJson, 'utf-8');

            const isValidSig = CellIdentity.verify(dataBuf, sigBuf, senderPublicKeyPem);
            if (!isValidSig) {
                return { authorized: false, reason: 'INVALID_CRYPTOGRAPHIC_SIGNATURE' };
            }

            const cmd: CreatorCommand = JSON.parse(commandPayloadJson);

            // Replay protection (10 minutes window)
            const now = Date.now();
            if (Math.abs(now - cmd.timestamp) > 1000 * 60 * 10) {
                return { authorized: false, reason: 'EXPIRED_COMMAND_TIMESTAMP' };
            }

            if (this.processedNonces.has(cmd.nonce)) {
                return { authorized: false, reason: 'REPLAY_ATTACK_DETECTED' };
            }
            this.processedNonces.add(cmd.nonce);
            if (this.processedNonces.size > 10000) {
                const first = this.processedNonces.values().next().value;
                if (first) this.processedNonces.delete(first);
            }

            // Check authorization whitelist
            if (this.authorizedPublicKeys.size > 0 && !this.authorizedPublicKeys.has(senderPublicKeyPem.trim())) {
                return { authorized: false, reason: 'SENDER_KEY_NOT_IN_CREATOR_WHITELIST', command: cmd };
            }

            return { authorized: true, command: cmd };
        } catch (err: any) {
            return { authorized: false, reason: `MALFORMED_PAYLOAD: ${err.message}` };
        }
    }
}
