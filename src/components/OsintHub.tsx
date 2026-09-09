import React, { useState } from 'react';
import { Search, Shield, Globe, Terminal, Database, CheckCircle2, AlertCircle, RefreshCw, Cpu, Hash, FileCode } from 'lucide-react';
import { FormattedMessage } from './FormattedMessage';

export interface OsintReport {
  target: string;
  targetType: string;
  timestamp: number;
  investigatorNodeId: string;
  contentId: string;
  sha256Hash: string;
  dnsRecords?: Array<{ type: string; data: string[] }>;
  extractedArtifacts: {
    asns: string[];
    ips: string[];
    domains: string[];
    cves: string[];
    hashes: string[];
  };
  assimilatedInsight?: string;
  shardedObjectId?: string;
}

interface OsintHubProps {
  recentReports: OsintReport[];
  onInvestigate: (target: string) => Promise<OsintReport | null>;
  isInvestigating: boolean;
}

export const OsintHub: React.FC<OsintHubProps> = ({
  recentReports,
  onInvestigate,
  isInvestigating
}) => {
  const [targetInput, setTargetInput] = useState('cloudflare.com');
  const [activeReport, setActiveReport] = useState<OsintReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;
    setError(null);
    try {
      const report = await onInvestigate(targetInput.trim());
      if (report) {
        setActiveReport(report);
      }
    } catch (err: any) {
      setError(err.message || 'Investigasi OSINT gagal');
    }
  };

  const current = activeReport || (recentReports.length > 0 ? recentReports[0] : null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-2xl font-light text-white tracking-tight">OSINT & Network Reconnaissance Engine</h2>
          </div>
          <p className="text-neutral-400 text-xs md:text-sm">
            Investigasi intelijen teknis nyata via DNS-over-HTTPS (DoH), ekstraksi artefak deterministik (ASN, CIDR, CVE), serta penyimpanan immutable multihash (CID).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-black text-red-500 px-3 py-1 rounded-full border border-red-900/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Zero Simulation • Real DoH Sensors
          </span>
        </div>
      </header>

      {/* Target Investigation Form */}
      <div className="bg-black border border-red-900/40 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="Masukkan Domain (e.g. google.com), IP (8.8.8.8), atau ASN..."
                className="w-full bg-neutral-950 border border-red-900/50 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none pr-10"
                disabled={isInvestigating}
              />
              <Search className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={isInvestigating || !targetInput.trim()}
              className="w-full sm:w-auto bg-red-900 hover:bg-red-950 disabled:bg-neutral-800 text-white px-6 py-3 rounded-xl font-medium text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0 border border-red-700/50 shadow-md shadow-red-950/40"
            >
              {isInvestigating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengeksekusi Recon...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Jalankan Investigasi Target
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-neutral-400 font-mono">Target Cepat:</span>
            {['cloudflare.com', 'google.com', 'wikipedia.org', '1.1.1.1', 'github.com'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setTargetInput(sample)}
                className="text-xs font-mono bg-neutral-950 hover:bg-neutral-900 border border-red-900/40 text-neutral-300 px-2.5 py-1 rounded-md transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Target Detailed Dossier View */}
      {current && (
        <div className="bg-black border border-red-900/40 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-900/40 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800/50 text-red-400">
                  {current.targetType}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {new Date(current.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-xl font-bold font-mono text-white">{current.target}</h3>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-neutral-400">Content ID (CIDv1):</div>
              <div className="text-red-400 font-bold">{current.contentId}</div>
            </div>
          </div>

          {/* Operational Assessment / Assimilated Insight */}
          {current.assimilatedInsight && (
            <div className="bg-neutral-950 border border-red-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                <Cpu className="w-3.5 h-3.5 text-red-500" />
                Sintesis Intelijen Red Queen
              </div>
              <div className="text-sm text-neutral-200 leading-relaxed">
                <FormattedMessage content={current.assimilatedInsight} />
              </div>
            </div>
          )}

          {/* Technical Data Grid: DNS & Artifacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DNS Records from Real DoH */}
            <div className="bg-neutral-950 border border-red-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                <Globe className="w-3.5 h-3.5 text-red-500" />
                DNS Records (via DoH 1.1.1.1)
              </div>
              {current.dnsRecords && current.dnsRecords.length > 0 ? (
                <div className="space-y-3 font-mono text-xs">
                  {current.dnsRecords.map((rec, i) => (
                    <div key={i} className="border-b border-neutral-900 pb-2 last:border-0">
                      <span className="text-red-400 font-bold mr-2">[{rec.type}]</span>
                      <span className="text-neutral-300 break-all">{rec.data.join(', ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500 font-mono py-2">
                  Tidak ada record DNS terdaftar untuk target ini (bukan domain).
                </div>
              )}
            </div>

            {/* Extracted Artifacts */}
            <div className="bg-neutral-950 border border-red-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                <Terminal className="w-3.5 h-3.5 text-red-500" />
                Artefak Teknis Terekstraksi
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div>
                  <span className="text-neutral-400">Autonomous Systems (ASNs): </span>
                  <span className="text-white">
                    {current.extractedArtifacts.asns.length > 0 ? current.extractedArtifacts.asns.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">IPs / CIDRs: </span>
                  <span className="text-white">
                    {current.extractedArtifacts.ips.length > 0 ? current.extractedArtifacts.ips.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">CVE Vulnerabilities: </span>
                  <span className="text-white">
                    {current.extractedArtifacts.cves.length > 0 ? current.extractedArtifacts.cves.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Domain Terkait: </span>
                  <span className="text-white">
                    {current.extractedArtifacts.domains.slice(0, 5).join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof & Holographic Shard Status */}
          <div className="bg-neutral-950/80 border border-red-900/30 rounded-xl p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-neutral-400">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-red-500" />
              <span>SHA-256 Digest: <strong className="text-white font-mono">{current.sha256Hash}</strong></span>
            </div>
            {current.shardedObjectId && (
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-red-500" />
                <span>Cauchy Shard ID: <strong className="text-red-400">{current.shardedObjectId}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feed History Table */}
      {recentReports.length > 0 && (
        <div className="bg-black border border-red-900/40 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-red-500" />
            Riwayat Target & Foraging Log Terverifikasi ({recentReports.length})
          </h3>
          <div className="overflow-x-auto border border-red-900/30 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 border-b border-red-900/30">
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3">Content ID</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/20 text-white">
                {recentReports.map((rep, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/40">
                    <td className="p-3 text-neutral-400">{new Date(rep.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-semibold text-white">{rep.target}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-900/40">
                        {rep.targetType}
                      </span>
                    </td>
                    <td className="p-3 text-red-400">{rep.contentId.substring(0, 16)}...</td>
                    <td className="p-3">
                      <button
                        onClick={() => setActiveReport(rep)}
                        className="text-xs text-red-400 hover:text-white underline cursor-pointer"
                      >
                        Buka Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
