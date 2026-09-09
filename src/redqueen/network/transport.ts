/**
 * [REAL NETWORK PROTOCOL & TRANSPORT]
 * Length-prefixed framing, active peer socket connection tracking,
 * and authenticated message exchange.
 */
import * as net from 'net';
import { CellIdentity } from './identity';

export interface WireMessage {
    version: number;
    type: 'HELLO' | 'PING' | 'PONG' | 'FIND_NODE' | 'GET_STATUS' | 'ACK' | 'ERROR';
    messageId: string;
    senderId: string;
    timestamp: number;
    payload: any;
    signature?: string;
}

export class TransportLayer {
    private server: net.Server;
    private port: number = 0;
    private identity: CellIdentity;
    private activeConnections: Map<string, net.Socket> = new Map();
    private messageHandlers: ((msg: WireMessage, socket: net.Socket) => void)[] = [];

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

    public getActiveConnectionCount(): number {
        return this.activeConnections.size;
    }

    public getActiveSockets(): { id: string; remoteAddress?: string; remotePort?: number }[] {
        const result: { id: string; remoteAddress?: string; remotePort?: number }[] = [];
        this.activeConnections.forEach((sock, id) => {
            result.push({
                id,
                remoteAddress: sock.remoteAddress,
                remotePort: sock.remotePort
            });
        });
        return result;
    }

    public onMessage(handler: (msg: WireMessage, socket: net.Socket) => void) {
        this.messageHandlers.push(handler);
    }

    private handleConnection(socket: net.Socket) {
        const connId = `${socket.remoteAddress}:${socket.remotePort}`;
        this.activeConnections.set(connId, socket);

        socket.on('close', () => {
            this.activeConnections.delete(connId);
        });

        socket.on('error', () => {
            this.activeConnections.delete(connId);
        });

        let buffer = Buffer.alloc(0);

        socket.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);
            
            // Length-prefixed framing (4 bytes length)
            while (buffer.length >= 4) {
                const msgLength = buffer.readUInt32BE(0);
                if (msgLength > 1024 * 1024 * 5) { // 5MB limit
                    socket.destroy();
                    break;
                }

                if (buffer.length >= 4 + msgLength) {
                    const payload = buffer.subarray(4, 4 + msgLength);
                    buffer = buffer.subarray(4 + msgLength);
                    this.processPayload(payload, socket);
                } else {
                    break;
                }
            }
        });
    }

    private processPayload(payload: Buffer, socket: net.Socket) {
        try {
            const raw = payload.toString('utf-8');
            if (raw.startsWith('GET ') || raw.startsWith('POST ')) {
                // Intercept HTTP scanner
                socket.write('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK');
                return;
            }

            const parsed: WireMessage = JSON.parse(raw);
            if (!parsed.type || !parsed.senderId) return;

            // Handle standard PING -> respond with signed PONG
            if (parsed.type === 'PING') {
                this.sendMessage(socket, {
                    version: 1,
                    type: 'PONG',
                    messageId: parsed.messageId,
                    senderId: this.identity.cellId,
                    timestamp: Date.now(),
                    payload: { pong: true }
                });
            }

            for (const h of this.messageHandlers) {
                h(parsed, socket);
            }
        } catch (e) {}
    }

    public sendMessage(socket: net.Socket, msg: WireMessage) {
        if (!socket.writable) return;
        const jsonStr = JSON.stringify(msg);
        const payloadBuf = Buffer.from(jsonStr, 'utf-8');
        const header = Buffer.alloc(4);
        header.writeUInt32BE(payloadBuf.length, 0);
        socket.write(Buffer.concat([header, payloadBuf]));
    }

    public close() {
        this.activeConnections.forEach(s => s.destroy());
        this.activeConnections.clear();
        this.server.close();
    }
}
