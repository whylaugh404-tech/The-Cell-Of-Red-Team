import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { CellSupervisor } from "./src/redqueen/runtime/supervisor.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize a Red Queen Cell for this node
  console.log("Booting local Red Queen Node...");
  const localNode = new CellSupervisor();
  await localNode.boot();

  app.use(express.json());

  // API Routes to interact with the Local Cell
  app.get("/api/cell/status", (req, res) => {
    res.json({
      cellId: localNode.identity.cellId,
      state: localNode.lifecycle.getState(),
      port: localNode.transport.getPort(),
      metrics: {
        dhtPeers: localNode.dht.getRoutingTableSize(),
        memoryShards: localNode.memory.getLocalShardCount(),
        activeThoughts: localNode.cognition.getActiveThoughtsCount()
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web interface running on port ${PORT}`);
  });
}

startServer();
