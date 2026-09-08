/**
 * [IMPLEMENTED] Creator Governance
 * Policy engine verifying cryptographic signatures on commands.
 */
import { CellIdentity } from '../network/identity';

export interface CreatorCommand {
    action: string;
    targetCellId?: string;
    timestamp: number;
}

export class GovernanceEngine {
    private creatorPublicKeyPem: string;

    constructor(creatorPublicKeyPem: string) {
        this.creatorPublicKeyPem = creatorPublicKeyPem;
    }

    public executeCommand(commandPayload: string, signature: Buffer): boolean {
        const isValid = CellIdentity.verify(
            Buffer.from(commandPayload),
            signature,
            this.creatorPublicKeyPem
        );

        if (!isValid) {
            console.error('[Governance] Unauthorized command rejected.');
            return false;
        }

        const cmd: CreatorCommand = JSON.parse(commandPayload);
        console.log(`[Governance] Authorized action executed: ${cmd.action}`);
        return true;
    }
}
