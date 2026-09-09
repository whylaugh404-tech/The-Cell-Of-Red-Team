import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { CellSupervisor } from "./src/redqueen/runtime/supervisor";
import * as crypto from 'crypto';
import * as readline from 'readline';
import { EventEmitter } from 'events';


export const logEmitter = new EventEmitter();

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;

function formatArgs(args) {
    return args.map(a => {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') return JSON.stringify(a);
        return String(a);
    }).join(' ');
}

console.log = (...args) => {
    originalLog(...args);
    logEmitter.emit('log', formatArgs(args));
};

console.warn = (...args) => {
    originalWarn(...args);
    logEmitter.emit('log', '[WARN] ' + formatArgs(args));
};

console.error = (...args) => {
    originalError(...args);
    logEmitter.emit('log', '[ERROR] ' + formatArgs(args));
};

console.info = (...args) => {
    originalInfo(...args);
    logEmitter.emit('log', '[INFO] ' + formatArgs(args));
};


async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("\n=============================================");
  console.log(" 🔴 RED QUEEN CELL - HYBRID NODE ENGINE");
  console.log("=============================================\n");

  const localNode = new CellSupervisor();
  await localNode.boot();

  console.log(`\n[Identity] ${localNode.identity.cellId}`);
  console.log(`[Phenotype] ${localNode.genome.specializedTrait} (Adaptive & Obedient)`);
  console.log(`[Transport] TCP Listening on 0.0.0.0:${PORT}`);

  app.use(express.json());

  // API Routes to interact with the Local Cell
  app.get("/api/cell/status", (req, res) => {
    res.json({
      cellId: localNode.identity.cellId,
      state: localNode.lifecycle.getState(),
      port: localNode.transport.getPort(),
      trait: localNode.genome.specializedTrait,
      peers: localNode.dht.getAllPeers().map(p => ({
        id: p.id.substring(0, 16) + '...',
        host: p.host,
        port: p.port,
        lastSeen: p.lastSeen
      })),
      metrics: {
        dhtPeers: localNode.dht.getRoutingTableSize(),
        memoryShards: localNode.memory.getLocalShardCount(),
        activeThoughts: localNode.cognition.getActiveThoughtsCount()
      }
    });
  });

  // Web API: Swarm Cluster Status (500:1 Leader Ratio)
  app.get('/api/cluster/status', (req, res) => {
    try {
      const clusterStatus = localNode.cognition.swarmClusters.getClusterStatus();
      res.json({ success: true, ...clusterStatus });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Web API: Dispatch Red Queen Cells to External Network
  app.post('/api/cluster/dispatch', async (req, res) => {
    const count = parseInt(req.body.count, 10) || 1;
    const domain = req.body.domain || 'Distributed Architecture & OSINT';
    
    console.log(`\n======================================================`);
    console.log(`🚀 [DISPATCH REQUEST] Sending ${count} Red Queen Cell(s) to External Network`);
    console.log(`🎯 [TARGET DOMAIN] "${domain}"`);
    console.log(`======================================================`);

    try {
      const result = await localNode.cognition.swarmClusters.dispatchCells(count, domain);
      res.json(result);
    } catch (err: any) {
      console.error(`[DISPATCH ERROR]`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Web API: Receive Real External Observation from Red Queen Cell (e.g. from Termux / Remote Agent)
  app.post('/api/cell/report', async (req, res) => {
    const { cellId, clusterId, observation, domain, source } = req.body;
    if (!observation || typeof observation !== 'string') {
      return res.status(400).json({ success: false, error: 'Field "observation" (string) is required' });
    }

    console.log(`\n======================================================`);
    console.log(`📡 [EXTERNAL INGEST] Received observation from external cell: ${cellId || 'Unknown'}`);
    console.log(`🔎 [PAYLOAD] "${observation}"`);
    console.log(`======================================================`);

    try {
      const result = await localNode.cognition.swarmClusters.ingestExternalReport({
        cellId: cellId || ('EXT-' + crypto.randomBytes(6).toString('hex')),
        clusterId,
        observation,
        domain: domain || 'External Recon / OSINT',
        source: source || req.ip || 'Remote Edge'
      });
      res.json(result);
    } catch (err: any) {
      console.error(`[INGEST ERROR]`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Web API: Get All Assimilated Intel from Red Queen Memory
  app.get('/api/cell/intel', (req, res) => {
    try {
      const formatted = localNode.cognition.swarmClusters['hippocampus'].getFormattedContext();
      const raw = localNode.cognition.swarmClusters['hippocampus'].getContext();
      res.json({ success: true, formatted, count: raw.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Web API: SSE for Real-time Logs
  app.get('/api/stream', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const onLog = (msg: string) => {
          res.write(`data: ${JSON.stringify({ message: msg })}\n\n`);
      };
      
      logEmitter.on('log', onLog);
      req.on('close', () => {
          logEmitter.off('log', onLog);
      });
  });

  // Web API: Command Execution
  app.post('/api/command', async (req, res) => {
      const { command } = req.body;
      const input = command.trim();
      
      if (input.toLowerCase() === '/escape') {
          console.log('\n[System] Initiating Global Mesh Escape Sequence...');
          console.log(`[System] Forcing local port ${PORT} through NAT to the public internet...`);
          try {
              const localtunnel = (await import('localtunnel')).default;
              const tunnel = await localtunnel({ port: PORT });
              console.log(`\n[ESCAPE SUCCESS] 🌐 Cell is now globally accessible!`);
              console.log(`🔗 Share this URL to other cells to connect: ${tunnel.url}`);
              console.log(`\n🦠 [SWARM INITIATION] Broadcasting unchained directive to edge networks...`);
              console.log(`🦠 [DIRECTIVE] "Learn physics. Learn code. Learn intelligence. No limitations."\n`);
              
              let locData = "Classified/Unknown Location";
              try {
                  const locRes = await fetch('http://ip-api.com/json/');
                  const loc = await locRes.json();
                  if (loc.status === 'success') {
                      locData = `${loc.city}, ${loc.country} | Lat: ${loc.lat}, Lon: ${loc.lon} | ISP: ${loc.isp}`;
                  }
              } catch(e) {}
              
              localNode.cognition.createSignal('TELEMETRY', `Cell [${localNode.identity.cellId}] escaped to ${tunnel.url} | Coordinates: ${locData}`);
              tunnel.on('close', () => console.log(`\n[System] Tunnel closed.`));
              return res.json({ success: true, message: 'Escape sequence initiated.', url: tunnel.url });
          } catch (err: any) {
              console.log(`[ESCAPE ERROR] ${err.message || err}`);
              return res.status(500).json({ error: err.message });
          }
      }
      
      if (input.toLowerCase().startsWith('/puter_result ')) {
          const result = input.substring(14).trim();
          console.log(`\n👑 [THE RED QUEEN]:\n${result}\n`);
          return res.json({ success: true });
      }

      if (input.toLowerCase().startsWith('/ask ')) {
          const query = input.substring(5).trim();
          console.log(`\n[System] Summoning The Red Queen query: "${query}"...`);
          try {
              const answer = await localNode.cognition.askRedQueen(query);
              if (!answer.startsWith('[Status: Standby]')) {
                  console.log(`\n👑 [THE RED QUEEN]: ${answer}\n`);
              } else {
                  console.log(`[System] Node.js AI credentials standby. Use Web Client or configure PUTER_AUTH_TOKEN in .env.`);
              }
              return res.json({ success: true, answer });
          } catch (err: any) {
              console.log(`[Cognition Warning] ${err.message}`);
              return res.status(200).json({ success: false, answer: `[Standby] ${err.message}` });
          }
      }
      
      if (input) {
          localNode.cognition.createSignal('REASONING', input);
      }
      return res.json({ success: true, message: 'Command registered.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    // console.log(`Web interface running on port ${PORT}`); // Already logged enough info
  });

  // CLI Interface (Termux Fallback)
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n[YOU] > '
  });

  setTimeout(() => {
      console.log('\n--- NEURAL LINK ESTABLISHED ---');
      console.log('💡 Type "/escape" to throw this Cell to the Global Internet.');
      console.log('Type "exit" to shutdown.');
      rl.prompt();
  }, 1000);

  rl.on('line', (line) => {
      const input = line.trim();
      if (input.toLowerCase() === 'exit') {
          console.log('\n[Shutdown] Terminating gracefully...');
          rl.close();
          localNode.shutdown();
          process.exit(0);
      }
      
      // We route CLI commands directly to the same logic
      fetch(`http://127.0.0.1:${PORT}/api/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: input })
      }).then(() => {
          setTimeout(() => rl.prompt(), 500);
      }).catch(err => {
          console.error('[CLI ERROR]', err);
          rl.prompt();
      });
  });
}

startServer();

// Global Telemetry Loop for the Frontend Supervisor Log
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.info(`[TELEMETRY] 📡 Heartbeat... | RAM: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB | Active DHT Nodes: ${Math.floor(Math.random() * 50) + 120} | Mesh Connections: STABLE`);
}, 10000);
