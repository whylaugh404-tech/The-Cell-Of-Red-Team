/**
 * [REAL NETWORK PROTOCOL & TRANSPORT]
 * Length-prefixed framing, active peer socket connection tracking,
 * full RPC message multiplexing (PING, PONG, FIND_NODE, STORE, FIND_VALUE, REPLICATE_STATE),
 * and direct socket communication.
 */
import * as net from 'net';
import { CellIdentity } from './identity';

export type WireMessageType =
    | 'HELLO'
    | 'PING'
    | 'PONG'
    | 'FIND_NODE'
    | 'NODES_FOUND'
    | 'STORE'
    | 'STORED'
    | 'FIND_VALUE'
    | 'VALUE_FOUND'
    | 'REPLICATE_STATE'
    | 'ACK'
    | 'ERROR';

export interface WireMessage {
    version: number;
    type: WireMessageType;
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
    private pendingRpcCallbacks: Map<string, (response: WireMessage) => void> = new Map();

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

    public getSocketById(connId: string): net.Socket | undefined {
        return this.activeConnections.get(connId);
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
            
            // Length-prefixed framing (4 bytes length header)
            while (buffer.length >= 4) {
                const msgLength = buffer.readUInt32BE(0);
                if (msgLength > 1024 * 1024 * 10) { // 10MB safety cap
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
                // Intercept HTTP probes gracefully
                socket.write('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK');
                return;
            }

            const parsed: WireMessage = JSON.parse(raw);
            if (!parsed.type || !parsed.senderId) return;

            // Check if this is an answer to a pending RPC call
            if (parsed.messageId && this.pendingRpcCallbacks.has(parsed.messageId)) {
                const cb = this.pendingRpcCallbacks.get(parsed.messageId);
                this.pendingRpcCallbacks.delete(parsed.messageId);
                if (cb) cb(parsed);
            }

            // Built-in PING response
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

            // Dispatch to registered observers
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

    /**
     * Connects to a remote peer via TCP socket and registers it in active connections
     */
    public connectToPeer(host: string, port: number): Promise<net.Socket> {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection({ host, port }, () => {
                const connId = `${socket.remoteAddress || host}:${socket.remotePort || port}`;
                this.activeConnections.set(connId, socket);
                this.handleConnection(socket);
                resolve(socket);
            });

            socket.once('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Sends an RPC request to a socket and awaits a matching response messageId
     */
    public sendRpc(socket: net.Socket, msg: WireMessage, timeoutMs: number = 5000): Promise<WireMessage> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRpcCallbacks.delete(msg.messageId);
                reject(new Error(`RPC timeout (${timeoutMs}ms) for ${msg.type} [${msg.messageId}]`));
            }, timeoutMs);

            this.pendingRpcCallbacks.set(msg.messageId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });

            this.sendMessage(socket, msg);
        });
    }

    public close() {
        this.activeConnections.forEach(s => s.destroy());
        this.activeConnections.clear();
        this.server.close();
    }
}
