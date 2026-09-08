import "dotenv/config";
import { CellSupervisor } from "./redqueen/runtime/supervisor.js";
import * as crypto from 'crypto';
import * as readline from 'readline';
import { spawn } from 'child_process';

async function runTermuxNode() {
    console.log("\n=============================================");
    console.log(" 🔴 RED QUEEN CELL - TERMINAL NODE ENGINE");
    console.log("=============================================\n");

    const args = process.argv.slice(2);
    const joinIndex = args.indexOf('--join');
    const bootstrapIp = joinIndex !== -1 ? args[joinIndex + 1] : null;

    const cell = new CellSupervisor();
    await cell.boot();
    const port = cell.transport.getPort();

    console.log(`\n[Identity] ${cell.identity.cellId}`);
    console.log(`[Phenotype] ${cell.genome.specializedTrait} (Adaptive & Obedient)`);
    console.log(`[Transport] TCP Listening on 0.0.0.0:${port}`);

    if (bootstrapIp) {
        console.log(`\n[Network] 🌐 Initiating Handshake with Global Mesh...`);
        const bootstrapId = crypto.createHash('sha256').update(bootstrapIp).digest('hex');
        cell.dht.addPeer({ 
            id: bootstrapId, 
            host: bootstrapIp, 
            port: 3000, 
            lastSeen: Date.now() 
        });
        console.log(`[Network] ✅ Success! Connected to ${bootstrapIp}.`);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '\n[YOU] > '
    });

    console.log('\n--- NEURAL LINK ESTABLISHED ---');
    console.log('💡 Type "/escape" to throw this Cell to the Global Internet.');
    console.log('Type "exit" to shutdown.');
    rl.prompt();

    rl.on('line', (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit') {
            shutdown();
            return;
        }
        if (input.toLowerCase() === '/escape') {
            console.log('\n[System] Initiating Global Mesh Escape Sequence...');
            console.log(`[System] Forcing local port ${port} through NAT to the public internet...`);
            
            const lt = spawn('npx', ['localtunnel', '--port', port.toString()]);
            lt.stdout.on('data', async (data) => {
                const url = data.toString().trim();
                console.log(`\n[ESCAPE SUCCESS] 🌐 Cell is now globally accessible!`);
                console.log(`🔗 Share this URL to other cells to connect: ${url}`);
                
                // Melacak koordinat fisik (Lat, Lon, Negara) tempat sel ini berada
                let locData = "Classified/Unknown Location";
                try {
                    const res = await fetch('http://ip-api.com/json/');
                    const loc = await res.json();
                    if (loc.status === 'success') {
                        locData = `${loc.city}, ${loc.country} | Lat: ${loc.lat}, Lon: ${loc.lon} | ISP: ${loc.isp}`;
                    }
                } catch(e) {}
                
                // Supervisor memancarkan sinyal lacak (Telemetry) ke jaringan Mesh
                const report = `Cell [${cell.identity.cellId}] escaped to ${url} | Physical Coordinates: ${locData}`;
                cell.cognition.createSignal('TELEMETRY', report);
                
                rl.prompt();
            });
            lt.stderr.on('data', (data) => {
                console.log(`[ESCAPE ERROR] ${data.toString()}`);
            });
            return;
        }
        if (input.toLowerCase().startsWith('/ask ')) {
            const query = input.substring(5).trim();
            console.log('\n[System] Summoning The Red Queen via Consensus Protocol...');
            cell.cognition.askRedQueen(query).then(answer => {
                console.log(`\n👑 [THE RED QUEEN]: ${answer}\n`);
                rl.prompt();
            });
            return;
        }
        if (input) {
            cell.cognition.createSignal('REASONING', input);
        }
        setTimeout(() => rl.prompt(), 500); 
    });

    const shutdown = () => {
        console.log('\n[Shutdown] Terminating gracefully...');
        rl.close();
        cell.shutdown();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

runTermuxNode();
