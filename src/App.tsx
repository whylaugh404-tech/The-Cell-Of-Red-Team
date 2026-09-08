import React, { useEffect, useState } from 'react';
import { Network, Activity, Cpu, Database, Shield, Zap, RefreshCw, Share2, BrainCircuit, Dna } from 'lucide-react';

interface CellStatus {
  cellId: string;
  state: string;
  port: number;
  trait: string;
  epigenetics?: string[];
  metrics?: {
    dhtPeers: number;
    memoryShards: number;
    activeThoughts: number;
    atp: number;
    maxAtp: number;
    vectorClock: number;
  };
}

export default function App() {
  const [status, setStatus] = useState<CellStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/cell/status')
        .then(res => res.json())
        .then(data => {
          setStatus(data);
          setError(null);
        })
        .catch(err => setError(err.message));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-light text-neutral-100 flex items-center gap-3">
            <Network className="w-8 h-8 text-rose-500" />
            Red Queen Cell <span className="text-neutral-500 text-sm ml-2 font-mono">v0.3.0-atp</span>
          </h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Autonomous Distributed Digital Organism - Global Node Interface
          </p>
        </header>

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-lg text-sm flex items-center gap-3">
            <Zap className="w-4 h-4" />
            Lost connection to the local Cell Supervisor: {error}
          </div>
        )}

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Identity Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 xl:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Cell Cryptographic Identity</h2>
              </div>
              <div className="font-mono text-xs text-indigo-200/70 bg-neutral-950 p-4 rounded border border-neutral-800/80 break-all leading-relaxed">
                {status.cellId}
              </div>
              <div className="mt-4 flex justify-between items-center text-xs text-neutral-500">
                <span>Listening Port (TCP Transport)</span>
                <span className="bg-neutral-800 px-2 py-1 rounded text-indigo-300 font-mono">{status.port}</span>
              </div>
            </div>

            {/* Lifecycle Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Metabolic State</h2>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className={`relative flex h-4 w-4`}>
                  {status.state === 'ACTIVE' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${status.state === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </div>
                <span className="font-mono text-xl text-neutral-100">{status.state}</span>
              </div>
              <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
                Homeostasis is active. The explicit state machine is dynamically adapting to host resources.
              </p>
            </div>

            {/* Cyber Phenotype Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Dna className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Cyber Phenotype</h2>
              </div>
              <div className="mt-2 space-y-2">
                <span className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-xs font-mono">
                  BASE: ADAPTATION
                </span>
                <br />
                <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded text-xs font-mono">
                  SPECIALIZED: {status.trait}
                </span>
                <br />
                {status.epigenetics && status.epigenetics.length > 0 && (
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-xs font-mono">
                    EPIGENETICS: {status.epigenetics.join(', ')}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
                Unique genetic network trait. Adapts via epigenetic markers upon environmental stress.
              </p>
            </div>

            {/* ATP Metabolism */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Metabolism (ATP)</h2>
              </div>
              <div className="text-3xl font-light text-neutral-100 mt-2">
                {status.metrics?.atp || 0} <span className="text-sm text-neutral-500">/ {status.metrics?.maxAtp || 10000}</span>
              </div>
              <div className="mt-4 h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (status.metrics?.atp || 0) < 4000 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${((status.metrics?.atp || 0) / (status.metrics?.maxAtp || 10000)) * 100}%` }}
                ></div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Cellular energy pool. Drained by intensive CPU/network cognitive loads.
              </p>
            </div>

            {/* Network Mesh Stats */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Kademlia DHT Overlay</h2>
              </div>
              <div className="text-3xl font-light text-neutral-100 mt-2">
                {status.metrics?.dhtPeers || 0}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Connected peers in K-Buckets. Real-time XOR metric routing active.
              </p>
            </div>

            {/* Distributed Cognition */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 xl:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <BrainCircuit className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Cognitive Mesh Signals</h2>
              </div>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-light text-neutral-100">{status.metrics?.activeThoughts || 0}</span>
                <span className="text-sm text-neutral-500">active signal(s) in local queue</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
                <span className="text-xs text-neutral-500 font-mono">VECTOR_CLOCK_SYNC</span>
                <span className="text-sm text-fuchsia-300 font-mono">T: {status.metrics?.vectorClock || 0}</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500/50 w-full animate-pulse"></div>
                </div>
                <p className="text-xs text-neutral-500 text-right">Awaiting distributed stimulus propagation...</p>
              </div>
            </div>

            {/* Holographic Memory */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 xl:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-widest">Holographic Memory Shards</h2>
              </div>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-light text-neutral-100">{status.metrics?.memoryShards || 0}</span>
                <span className="text-sm text-neutral-500">encrypted fragments stored locally</span>
              </div>
              <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
                Memory objects undergo AES-256-GCM encryption and mathematical erasure coding distribution to survive catastrophic peer failure.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
