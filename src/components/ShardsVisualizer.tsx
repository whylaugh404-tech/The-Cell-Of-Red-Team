import React from 'react';
import { Database, Shield, Lock, Layers, CheckCircle2, Cpu } from 'lucide-react';

export interface ShardsData {
  galoisField: string;
  generator: string;
  localShardCount: number;
  indexedObjectsCount: number;
  objects: Array<{
    objectId: string;
    version: number;
    originalSize: number;
    ciphertextSize: number;
    chunkSize: number;
    shardCount: number;
    parityCount: number;
    encryption: string;
    shardIdentifiers: string[];
    shardHashes: string[];
  }>;
}

interface ShardsVisualizerProps {
  shardsData: ShardsData | null;
  onReplicate: () => void;
  isReplicating: boolean;
  replicationResult: any | null;
}

export const ShardsVisualizer: React.FC<ShardsVisualizerProps> = ({
  shardsData,
  onReplicate,
  isReplicating,
  replicationResult
}) => {
  return (
    <div className="space-y-6">
      {/* Galois Field Math Engine Info */}
      <div className="bg-black border border-red-900/40 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/40/50 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900/50 flex items-center justify-center text-white border border-red-900/40">
              <Database className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Holographic Memory • Cauchy MDS Reed-Solomon</h3>
              <p className="text-xs text-neutral-400">
                Matriks Cauchy Non-Singular atas Galois Field {shardsData?.galoisField || 'GF(2^8)'} dengan AES-256-GCM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-black text-red-500 px-3 py-1 rounded-full border border-red-900/40 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              MDS Property Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-neutral-900/40 border border-red-900/30 rounded-xl p-4">
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">Local Shards in Memory</div>
            <div className="text-2xl font-light text-white font-mono">{shardsData?.localShardCount ?? 0}</div>
          </div>
          <div className="bg-neutral-900/40 border border-red-900/30 rounded-xl p-4">
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">Indexed Cryptographic Objects</div>
            <div className="text-2xl font-light text-white font-mono">{shardsData?.indexedObjectsCount ?? 0}</div>
          </div>
          <div className="bg-neutral-900/40 border border-red-900/30 rounded-xl p-4">
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">Fault Tolerance (Loss Allowed)</div>
            <div className="text-2xl font-light text-white font-mono">2 / 5 Parity</div>
          </div>
          <div className="bg-neutral-900/40 border border-red-900/30 rounded-xl p-4">
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1">Encryption Mode</div>
            <div className="text-sm font-semibold text-white font-mono mt-1">AES-256-GCM</div>
          </div>
        </div>

        {/* Sharded Objects Table */}
        {shardsData && shardsData.objects.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              Surviving MDS Memory Shard Blocks
            </h4>
            <div className="overflow-x-auto border border-red-900/40 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 border-b border-red-900/40">
                    <th className="p-3">Object ID</th>
                    <th className="p-3">Original Size</th>
                    <th className="p-3">Ciphertext</th>
                    <th className="p-3">Shards / Parity</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-900/30 text-white">
                  {shardsData.objects.map((obj, i) => (
                    <tr key={i} className="hover:bg-neutral-900/30">
                      <td className="p-3 font-semibold text-red-400">{obj.objectId.substring(0, 18)}...</td>
                      <td className="p-3 text-neutral-300">{obj.originalSize} B</td>
                      <td className="p-3 text-neutral-300">{obj.ciphertextSize} B</td>
                      <td className="p-3 text-neutral-300">{obj.shardCount} data + {obj.parityCount} parity</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-red-950/60 text-red-400 border border-red-800/40 px-2 py-0.5 rounded">
                          100% RECOVERABLE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Direct Cell Mitosis / DNA Replication Capsule */}
      <div className="bg-black border border-red-900/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-500 mb-2">
            <Lock className="w-4 h-4 text-red-500" />
            Direct Cell Mitosis & Immutable DNA Capsule
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight">
            Pemicu Replikasi Mandiri P2P (Zero Pastebin / Direct Socket)
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Membungkus keadaan genetik sel, status mutasi, dan ingatan Hippocampus ke dalam kapsul DNA ber-tanda tangan ECDSA secp256k1 dan terenkripsi AES-256-GCM. Kapsul ditransmisikan langsung ke socket peer aktif.
          </p>
        </div>

        <button
          onClick={onReplicate}
          disabled={isReplicating}
          className="bg-red-900 hover:bg-red-950 disabled:bg-neutral-800 text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 border border-red-700/50 shadow-lg shadow-red-950/40 cursor-pointer"
        >
          <Cpu className="w-4 h-4" />
          {isReplicating ? 'Mereplikasi DNA Sel...' : 'Picukan Mitosis Sel P2P'}
        </button>
      </div>

      {/* Replication Result Output */}
      {replicationResult && (
        <div className="p-4 rounded-xl border border-red-900/40 bg-neutral-950 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-2 font-bold text-red-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-red-500" />
            Mitosis Berhasil: Kapsul DNA Tersegel & Ditransmisikan
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-neutral-400">
            <div>Capsule ID: <span className="text-white">{replicationResult.capsule?.capsuleId}</span></div>
            <div>Generasi Genom: <span className="text-white">Gen {replicationResult.capsule?.genome?.generation}</span></div>
            <div>Peer Socket Replikasi: <span className="text-white">{replicationResult.replicatedPeersCount ?? 0} Node</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
