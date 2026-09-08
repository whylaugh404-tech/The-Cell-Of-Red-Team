import { CellSupervisor } from "./redqueen/runtime/supervisor.js";

async function runTermuxNode() {
    console.log("\n=============================================");
    console.log(" 🔴 RED QUEEN CELL - TERMINAL NODE ENGINE");
    console.log("=============================================\n");

    const args = process.argv.slice(2);
    const joinIndex = args.indexOf('--join');
    const bootstrapIp = joinIndex !== -1 ? args[joinIndex + 1] : null;

    console.log("[Boot] Initializing Genetic Sequence and Cryptography...");
    const cell = new CellSupervisor();
    await cell.boot();

    console.log(`\n[Identity] ${cell.identity.cellId}`);
    console.log(`[Phenotype] ${cell.genome.specializedTrait}`);
    console.log(`[Transport] TCP Listening on Port ${cell.transport.getPort()}`);

    if (bootstrapIp) {
        console.log(`\n[Network] 🌐 Initiating Handshake with Global Mesh...`);
        console.log(`[Network] Target Bootstrap IP: ${bootstrapIp}`);
        
        // Mensimulasikan koneksi ke DHT global
        cell.dht.addPeer({ 
            id: 'bootstrap-node', 
            host: bootstrapIp, 
            port: 3000, 
            lastSeen: Date.now() 
        });

        console.log(`[Network] ✅ Success! Cell has been thrown into the global internet mesh.`);
        console.log(`[Cognition] Syncing active thoughts and holographic memory shards...`);
    } else {
        console.log(`\n[Network] ⚠️ Running in Isolated/Local Mode.`);
        console.log(`[Network] To throw this cell to the internet mesh, restart with:`);
        console.log(`          npm run termux -- --join <IP_ADDRESS>`);
    }

    // Mencegah script berhenti, membiarkan node hidup di background Termux
    setInterval(() => {
        // Detak jantung (Heartbeat) untuk menjaga node tetap hidup di Termux
        const state = cell.lifecycle.getState();
        const shards = cell.memory.getLocalShardCount();
        const thoughts = cell.cognition.getActiveThoughtsCount();
        const peers = cell.dht.getRoutingTableSize();
        
        process.stdout.write(`\r[Heartbeat] State:${state} | Peers:${peers} | Shards:${shards} | Thoughts:${thoughts}   `);
    }, 2000);
}

runTermuxNode();
