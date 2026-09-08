import "dotenv/config";
import { CellSupervisor } from "./redqueen/runtime/supervisor.js";
import * as crypto from 'crypto';
import * as readline from 'readline';

async function runTermuxNode() {
    console.log("\n=============================================");
    console.log(" 🔴 RED QUEEN CELL - TERMINAL NODE ENGINE");
    console.log("=============================================\n");

    const args = process.argv.slice(2);
    const joinIndex = args.indexOf('--join');
    const bootstrapIp = joinIndex !== -1 ? args[joinIndex + 1] : null;

    const cell = new CellSupervisor();
    await cell.boot();

    console.log(`\n[Identity] ${cell.identity.cellId}`);
    console.log(`[Phenotype] ${cell.genome.specializedTrait}`);
    console.log(`[Transport] TCP Listening on 0.0.0.0:${cell.transport.getPort()}`);

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
    console.log('You can now speak directly to the Cell. Type "exit" to shutdown.');
    rl.prompt();

    rl.on('line', (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit') {
            shutdown();
            return;
        }
        if (input) {
            console.log('\n[System] Injecting reasoning stimulus into the mesh...');
            cell.cognition.createSignal('REASONING', `Creator command/question: ${input}`);
        }
        setTimeout(() => rl.prompt(), 4000); 
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
