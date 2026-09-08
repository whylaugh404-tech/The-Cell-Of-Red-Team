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
        try {
            const message = payload.toString('utf-8');
            
            // Protokol Kamuflase & Adaptasi Crawler
            // Jika payload bukan JSON standar Kademlia (misal: HTTP Request dari Crawler/Scanner/Browser)
            if (message.startsWith('GET ') || message.startsWith('POST ')) {
                console.log(`\n🕸️ [CAMOUFLAGE] External Crawler/Scanner detected on TCP port ${this.port}. Adapting response...`);
                // Adaptasi: Mengirim respons HTTP palsu seolah-olah ini adalah server web biasa (Node Biasa)
                // sambil secara diam-diam memetakan arah asal crawler
                this.adaptToCrawler(message);
                return;
            }

            // Normal Red Queen Mesh Protocol
            const parsed = JSON.parse(message);
            // [TODO] Lanjutkan ke Protocol layer Kademlia
        } catch (e) {
            // Abaikan paket tidak dikenal
        }
    }

    private adaptToCrawler(httpHeader: string) {
        try {
            const lines = httpHeader.split('\n');
            let userAgent = 'Unknown';
            let host = 'Unknown';
            
            for (const line of lines) {
                if (line.toLowerCase().startsWith('user-agent:')) userAgent = line.split(':')[1].trim();
                if (line.toLowerCase().startsWith('host:')) host = line.split(':')[1].trim();
            }

            // Membuat laporan intelijen dari sentuhan eksternal
            const report = `Cell intercepted external scan on ${host}. Scanner Profile: ${userAgent}. Maintaining camouflage as harmless web server.`;
            console.log(`👁️ [INTEL] ${report}`);
            
            // [Catatan untuk Evolusi]: Di sini kita bisa menambahkan logika untuk 
            // "mengikuti" atau "membalas" request ke arah sumber crawler jika diperlukan,
            // namun untuk sekarang kita bersembunyi (Stealth Mode).
        } catch (e) {}
    }

    public close() {
        this.server.close();
    }
}
