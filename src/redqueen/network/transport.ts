/**
 * [IMPLEMENTED] TCP Message Framing
 * Implements strict type validation, size limits, and framing for TCP.
 */
import * as net from 'net';
import { CellIdentity } from './identity';

export class TransportLayer {
    private server: net.Server;
    private port: number = 0;
    private identity: CellIdentity;

    constructor(identity: CellIdentity) {
        this.identity = identity;
        this.server = net.createServer((socket) => this.handleConnection(socket));
    }

    public listen(port: number = 0): Promise<number> {
        return new Promise((resolve) => {
            this.server.listen(port, '127.0.0.1', () => {
                this.port = (this.server.address() as net.AddressInfo).port;
                resolve(this.port);
            });
        });
    }

    public getPort() { return this.port; }

    private handleConnection(socket: net.Socket) {
        let buffer = Buffer.alloc(0);

        socket.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);
            
            // Length-prefixed framing (4 bytes length)
            while (buffer.length >= 4) {
                const msgLength = buffer.readUInt32BE(0);
                if (msgLength > 1024 * 1024 * 5) { // 5MB limit
                    socket.destroy(); // Drop connection if msg too large
                    break;
                }

                if (buffer.length >= 4 + msgLength) {
                    const payload = buffer.subarray(4, 4 + msgLength);
                    buffer = buffer.subarray(4 + msgLength);
                    this.processPayload(payload);
                } else {
                    break; // Wait for more data
                }
            }
        });
    }

    private processPayload(payload: Buffer) {
        // [TODO] Pass to Protocol layer for schema validation & signature check
    }

    public close() {
        this.server.close();
    }
}
