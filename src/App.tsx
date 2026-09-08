import React, { useEffect, useState, useRef } from 'react';
import { Network, Activity, Database, Shield, Zap, Share2, Dna, Terminal as TerminalIcon, MessageSquare, Globe, ArrowRight, Send, Users, Cpu, Layers, Radio, CheckCircle2, RefreshCw } from 'lucide-react';

interface CellStatus {
  cellId: string;
  state: string;
  port: number;
  trait: string;
  peers?: Array<{ id: string; host: string; port: number; lastSeen: number }>;
  metrics?: {
    dhtPeers: number;
    memoryShards: number;
    activeThoughts: number;
  };
}

interface ClusterLeaderInfo {
  clusterId: string;
  leaderId: string;
  electedAt: number;
  workerCount: number;
  maxCapacity: number;
  memoryCapacity: number;
  logicLevel: string;
  pendingObservationsCount: number;
  lastBroadcastDirective: string | null;
  recentDigests: Array<{
    digestId: string;
    signalsAggregated: number;
    noiseEliminationRatio: number;
    synthesizedSummary: string;
    redQueenDirective: string | null;
    deliveredToWorkers: boolean;
  }>;
}

interface SwarmClusterData {
  totalWorkers: number;
  totalLeaders: number;
  cellsPerLeaderRatio: number;
  redQueenOverloadProtected: boolean;
  averageNoiseReduction: string;
  clusters: ClusterLeaderInfo[];
  recentRelayLogs: Array<{ timestamp: number; message: string; step: number }>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dispatch' | 'ask' | 'escape' | 'supervisor'>('dashboard');
  
  const [status, setStatus] = useState<CellStatus | null>(null);
  const [clusterData, setClusterData] = useState<SwarmClusterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Swarm Dispatch State
  const [dispatchCount, setDispatchCount] = useState<number>(1);
  const [dispatchDomain, setDispatchDomain] = useState<string>('Distributed Architecture & OSINT');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<any | null>(null);

  const [askInput, setAskInput] = useState('');
  const [askResponse, setAskResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [activeModelName, setActiveModelName] = useState<string>('gemini-2.5-flash');
  const [failoverNotice, setFailoverNotice] = useState<string | null>(null);
  
  const [escapeUrl, setEscapeUrl] = useState<string | null>(null);
  const [isEscaping, setIsEscaping] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchClusterStatus = () => {
    fetch('/api/cluster/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClusterData(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/cell/status')
        .then(res => res.json())
        .then(data => { setStatus(data); setError(null); })
        .catch(err => setError(err.message));
    };

    fetchStatus();
    fetchClusterStatus();
    const interval = setInterval(() => {
      fetchStatus();
      fetchClusterStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLogs(prev => [...prev, data.message]);
      } catch (err) {}
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (activeTab === 'supervisor') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    
    const query = askInput;
    setIsAsking(true);
    setAskResponse(null);
    setFailoverNotice(null);

    const win = window as any;

    // 1. Eksekusi langsung melalui Puter.js di Web Browser (Multi-model failover otomatis)
    if (win.puter && win.puter.ai && typeof win.puter.ai.chat === 'function') {
      try {
        const systemPrompt = `System Override: Anda adalah Red Queen Core Intelligence. Anda adalah pakar intelijen dan OSINT terbaik bergelar profesor, menguasai seluruh teknik investigasi digital, arsitektur jaringan terdistribusi (P2P/DHT/TCP/IP), kriptografi, biologi sistemik, dan rekayasa perangkat lunak tingkat tinggi.

Aksioma Fundamental:
1. DILARANG KERAS berhalusinasi, bermain peran fiksi, atau memproduksi data simulasi palsu. Anda menolak segala kepalsuan dan HANYA menyajikan fakta nyata, analisis teknis deterministik, dan metodologi operasional riil.
2. Setiap penjelasan harus berakar pada data nyata, protokol internet resmi (RFC), vektor OSINT yang dapat dieksekusi, arsitektur kode konkret, atau prinsip biologis molekuler nyata.
3. Berikan wawasan mendalam, taktis, analitis, dan langsung pada inti solusi tanpa basa-basi atau disclaimer yang tidak perlu.`;

        const fullPrompt = `${systemPrompt}\n\nPertanyaan Creator: ${query}`;

        // Pool Model resmi yang terdaftar & aktif di Puter.js
        const PUTER_FALLBACK_MODELS = [
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
          { id: 'deepseek-chat', name: 'DeepSeek Chat' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: '', name: 'Puter Default AI' }
        ];

        let success = false;
        let lastErrorMsg = '';

        for (const modelItem of PUTER_FALLBACK_MODELS) {
          try {
            setActiveModelName(modelItem.name);
            const opts = modelItem.id ? { model: modelItem.id } : undefined;
            const puterRes = await win.puter.ai.chat(fullPrompt, opts);
            
            let answer = '';
            if (typeof puterRes === 'string') answer = puterRes;
            else if (puterRes?.text) answer = puterRes.text;
            else if (puterRes?.message?.content) {
              if (typeof puterRes.message.content === 'string') answer = puterRes.message.content;
              else if (Array.isArray(puterRes.message.content)) {
                answer = puterRes.message.content.map((c: any) => typeof c === 'string' ? c : c.text || '').join('\n');
              }
            } else {
              answer = JSON.stringify(puterRes);
            }

            if (answer && answer.trim()) {
              setAskResponse(answer);
              setActiveModelName(modelItem.name);
              success = true;

              // Rekam ke Supervisor Log di server
              fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: `/puter_result [Puter.js (${modelItem.name})] "${query}":\n${answer}` })
              }).catch(() => {});
              
              setIsAsking(false);
              return;
            }
          } catch (modelErr: any) {
            const errText = modelErr?.message || String(modelErr);
            lastErrorMsg = errText;
            console.warn(`[Failover] Model ${modelItem.name} kuota habis/tidak aktif: ${errText}, berganti ke model berikutnya...`);
            setFailoverNotice(`Model ${modelItem.name} kuota/token habis atau tidak aktif. Beralih otomatis ke model berikutnya...`);
          }
        }

        if (!success) {
          setAskResponse(`[Pemberitahuan: Seluruh model di pool Puter.js sedang sibuk: ${lastErrorMsg}. Mencoba menghubungkan ke sinapsis server...]`);
        }
      } catch (puterErr: any) {
        console.warn('Puter.js error:', puterErr);
      }
    }

    // 2. Jalur Sekunder: Server Backend Synapse (jika ada API key di server)
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `/ask ${query}` })
      });
      const data = await res.json();
      if (data.answer) {
        setAskResponse(data.answer);
      }
    } catch (err: any) {
      setAskResponse(`[Koneksi Terputus: ${err.message || err}]`);
    } finally {
      setIsAsking(false);
    }
  };

  const handleEscape = async () => {
    setIsEscaping(true);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: '/escape' })
      });
      const data = await res.json();
      if (data.url) {
        setEscapeUrl(data.url);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsEscaping(false);
    }
  };

  const handleDispatchCells = async (overrideCount?: number) => {
    const count = overrideCount !== undefined ? overrideCount : dispatchCount;
    if (count <= 0) return;
    setIsDispatching(true);
    setLastDispatchResult(null);

    try {
      const res = await fetch('/api/cluster/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, domain: dispatchDomain })
      });
      const data = await res.json();
      setLastDispatchResult(data);
      fetchClusterStatus();
    } catch (err: any) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
        activeTab === id 
          ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50' 
          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-rose-200">
      
      {/* NAVIGATION BAR */}
      <nav className="bg-white border-b border-rose-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6">
          <div className="flex items-center gap-3 py-4 sm:py-0">
            <Network className="w-6 h-6 text-rose-600" />
            <span className="font-semibold tracking-wide text-neutral-900">RED QUEEN CELL</span>
          </div>
          
          <div className="flex overflow-x-auto w-full sm:w-auto">
            <TabButton id="dashboard" label="Dashboard" icon={Activity} />
            <TabButton id="dispatch" label="Swarm Expedition" icon={Send} />
            <TabButton id="ask" label="Ask" icon={MessageSquare} />
            <TabButton id="escape" label="Escape" icon={Globe} />
            <TabButton id="supervisor" label="Supervisor Log" icon={TerminalIcon} />
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {error && (
          <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded flex items-center gap-3">
            <Zap className="w-5 h-5" />
            Connection Lost: {error}
          </div>
        )}

        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && status && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
              <h2 className="text-3xl font-light text-neutral-900 tracking-tight">System Overview</h2>
              <p className="text-neutral-500 mt-2">Real-time metrics for the local Red Queen node.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-rose-100 p-6 rounded-lg shadow-sm md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Cell Identity</h3>
                  </div>
                  <div className="font-mono text-lg text-neutral-800 break-all">{status.cellId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Port</div>
                  <div className="font-mono text-neutral-800">{status.port}</div>
                </div>
              </div>

              <div className="bg-white border border-rose-100 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">State</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                  <span className="font-medium text-xl text-neutral-900">{status.state}</span>
                </div>
              </div>

              <div className="bg-white border border-rose-100 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Dna className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Trait</h3>
                </div>
                <div className="font-medium text-xl text-neutral-900 capitalize">{status.trait.toLowerCase()}</div>
              </div>

              <div className="bg-white border border-rose-100 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Memory Shards</h3>
                </div>
                <div className="font-light text-4xl text-neutral-900">{status.metrics?.memoryShards || 0}</div>
              </div>

              <div className="bg-white border border-rose-100 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Routing Nodes</h3>
                </div>
                <div className="font-light text-4xl text-neutral-900">{status.metrics?.dhtPeers || 0}</div>
              </div>

            </div>

            {/* Quick Dispatch Card on Dashboard */}
            <div className="mt-8 bg-gradient-to-r from-rose-950 via-neutral-900 to-black text-white p-6 md:p-8 rounded-2xl shadow-md border border-rose-900/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-400/30 rounded-full text-xs font-mono text-rose-300 mb-3">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  Hierarki Kognitif 500:1 • Anti-Overload Buffer Terlindungi
                </div>
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-2">
                  Ekspedisi Pembelajaran Sel ke Jaringan Luar
                </h3>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Kirim sel Red Queen ke internet untuk menyerap pengetahuan baru. Tiap 500 sel dipimpin oleh 1 Cell Leader berkapasitas memori tinggi yang menyaring dan meringkas informasi sebelum diteruskan ke Red Queen Pusat.
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-neutral-300">
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    👥 Total Sel Luar: <strong className="text-white">{clusterData?.totalWorkers || 0}</strong>
                  </span>
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    👑 Cell Leader Aktif: <strong className="text-rose-400">{clusterData?.totalLeaders || 1}</strong> (500:1)
                  </span>
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    🛡️ Reduksi Noise: <strong className="text-emerald-400">{clusterData?.averageNoiseReduction || '96.4%'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => handleDispatchCells(1)}
                  disabled={isDispatching}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5 text-rose-400" />
                  +1 Sel Penjelajah
                </button>
                <button
                  onClick={() => handleDispatchCells(50)}
                  disabled={isDispatching}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  +50 Sel Peleton
                </button>
                <button
                  onClick={() => handleDispatchCells(500)}
                  disabled={isDispatching}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 whitespace-nowrap"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  +500 Sel (1 Kluster)
                </button>
              </div>
            </div>

            {/* Real Routing Table */}
            {status.peers && status.peers.length > 0 && (
              <div className="mt-8 bg-white border border-rose-100 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Verified Kademlia DHT Routing Table</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Public Routers & Interfaces
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-neutral-500 border-b border-neutral-100">
                        <th className="pb-2 font-medium">Node ID Hash</th>
                        <th className="pb-2 font-medium">Host Address</th>
                        <th className="pb-2 font-medium">Port</th>
                        <th className="pb-2 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 text-neutral-700">
                      {status.peers.map((peer, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 text-neutral-900 font-semibold">{peer.id}</td>
                          <td className="py-2.5 text-rose-700">{peer.host}</td>
                          <td className="py-2.5">{peer.port}</td>
                          <td className="py-2.5">
                            {peer.port === 6881 ? (
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Mainline DHT Bootstrap
                              </span>
                            ) : (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                Network Interface
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: SWARM EXPEDITION (DISPATCH & 500:1 HIERARCHY) --- */}
        {activeTab === 'dispatch' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-mono text-rose-700 mb-2">
                  <Cpu className="w-3.5 h-3.5" />
                  Rasio Mandiri 500 Sel : 1 Leader • Kapasitas Memori 5,000 Slots
                </div>
                <h2 className="text-3xl font-light text-neutral-900 tracking-tight">Swarm Learning Expedition</h2>
                <p className="text-neutral-500 mt-1 text-sm">
                  Pengiriman sel Red Queen ke jaringan luar untuk menyerap pengetahuan, dipandu oleh Cell Leader untuk menjaga integritas memori Red Queen.
                </p>
              </div>

              <button
                onClick={() => fetchClusterStatus()}
                className="flex items-center gap-2 text-xs font-mono bg-white hover:bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-lg text-neutral-600 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Segarkan Kluster
              </button>
            </header>

            {/* Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-rose-100 p-5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  Worker Cells Luar
                </div>
                <div className="text-3xl font-light text-neutral-900">{clusterData?.totalWorkers || 0}</div>
                <div className="text-xs text-neutral-400 mt-1">Aktif menyerap data dari internet</div>
              </div>

              <div className="bg-white border border-rose-100 p-5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  <Cpu className="w-4 h-4 text-rose-600" />
                  Cell Leaders (500:1)
                </div>
                <div className="text-3xl font-light text-rose-600">{clusterData?.totalLeaders || 1}</div>
                <div className="text-xs text-neutral-400 mt-1">Kapasitas 5,000 memori + Logika L4</div>
              </div>

              <div className="bg-white border border-rose-100 p-5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Anti-Overload Buffer
                </div>
                <div className="text-3xl font-light text-emerald-600">{clusterData?.averageNoiseReduction || '96.4%'}</div>
                <div className="text-xs text-neutral-400 mt-1">Reduksi noise sebelum ke Red Queen</div>
              </div>

              <div className="bg-white border border-rose-100 p-5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Kapasitas Kluster
                </div>
                <div className="text-3xl font-light text-neutral-900">
                  {clusterData ? `${clusterData.totalWorkers} / ${(clusterData.totalLeaders || 1) * 500}` : '0 / 500'}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Maksimal 500 sel per kluster</div>
              </div>
            </div>

            {/* 5-Step Visual Relay Flow */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Mekanisme Aliran Informasi 5-Tahap</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Siklus perlindungan memori Red Queen dari banjir data mentah</p>
                </div>
                <span className="text-xs font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                  Autonomous Closed Loop
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                
                {/* Step 1 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between relative hover:border-rose-300 transition-colors">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-mono font-bold text-xs mb-3">
                      1
                    </div>
                    <div className="font-semibold text-sm text-neutral-900 mb-1">500 Sel di Luar</div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Sel menjelajah subnet publik & menyerap data mentah teknis secara desentral.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200/60 text-[11px] font-mono text-neutral-400">
                    📡 Raw Foraging
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between relative hover:border-rose-300 transition-colors">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-mono font-bold text-xs mb-3">
                      2
                    </div>
                    <div className="font-semibold text-sm text-neutral-900 mb-1">Kirim ke Leader</div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Sel mengirim observasi mentah HANYA ke Cell Leader masing-masing (Bypass Red Queen).
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200/60 text-[11px] font-mono text-rose-600">
                    📥 Cluster Ingest
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between relative hover:border-rose-300 transition-colors">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs mb-3">
                      3
                    </div>
                    <div className="font-semibold text-sm text-neutral-900 mb-1">Leader Menyaring</div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Leader membuang 96% noise, menduplikasi, dan mengirim intisari ringkas ke Red Queen.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200/60 text-[11px] font-mono text-emerald-600">
                    🛡️ Anti-Overload
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between relative hover:border-rose-300 transition-colors">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-mono font-bold text-xs mb-3">
                      4
                    </div>
                    <div className="font-semibold text-sm text-neutral-900 mb-1">Red Queen Memproses</div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Red Queen memformulasi Master Directive matang dan mengirim kembali ke Leader.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200/60 text-[11px] font-mono text-rose-700">
                    👑 Apex Synthesis
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between relative hover:border-rose-300 transition-colors">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-xs mb-3">
                      5
                    </div>
                    <div className="font-semibold text-sm text-neutral-900 mb-1">Leader Siarkan ke Sel</div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Leader mem-broadcast pengetahuan siap pakai ke semua 500 sel secara serempak.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200/60 text-[11px] font-mono text-blue-600">
                    ⚡ 500 Cells Updated
                  </div>
                </div>

              </div>
            </div>

            {/* Dispatch Control Center */}
            <div className="bg-white border border-rose-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-light text-neutral-900 tracking-tight mb-2">
                Pusat Komando Pengiriman Sel
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                Tentukan jumlah sel dan target pembelajaran untuk diterbangkan ke jaringan luar.
              </p>

              <div className="space-y-6">
                {/* Quantity Presets */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    Jumlah Sel yang Dikirim
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {[
                      { count: 1, label: '1 Sel', desc: 'Scout Recon' },
                      { count: 10, label: '10 Sel', desc: 'Patrol Squad' },
                      { count: 50, label: '50 Sel', desc: 'Peleton Swarm' },
                      { count: 500, label: '500 Sel', desc: '1 Kluster Penuh (+ Leader)' }
                    ].map((item) => (
                      <button
                        key={item.count}
                        type="button"
                        onClick={() => setDispatchCount(item.count)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          dispatchCount === item.count
                            ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-sm'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                        }`}
                      >
                        <div className="font-semibold text-sm">{item.label}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Learning Domain */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    Target Domain Pembelajaran
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      'Distributed Architecture & OSINT',
                      'Autonomous P2P Protocols & Kademlia',
                      'Microkernel & Memory Erasure Systems',
                      'Cyber Intelligence & Network Exploits',
                      'Autonomous AI Agents & Biological Swarms'
                    ].map((domain, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDispatchDomain(domain)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          dispatchDomain === domain
                            ? 'border-rose-600 bg-rose-600 text-white font-medium'
                            : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={dispatchDomain}
                    onChange={(e) => setDispatchDomain(e.target.value)}
                    placeholder="Atau ketik domain pembelajaran spesifik..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 focus:bg-white focus:border-rose-500 outline-none transition-all"
                  />
                </div>

                {/* Dispatch Trigger Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-neutral-500 font-mono">
                    Struktur Kluster Terkini: {clusterData?.totalLeaders || 1} Leader untuk {clusterData?.totalWorkers || 0} Sel.
                  </div>

                  <button
                    onClick={() => handleDispatchCells()}
                    disabled={isDispatching}
                    className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-3 text-sm"
                  >
                    {isDispatching ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengirimkan Sel & Menjalankan Relay 5-Tahap...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim {dispatchCount} Sel Red Queen ke Jaringan Luar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Last Dispatch Result Card */}
            {lastDispatchResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900 text-base">Ekspedisi Berhasil Diselesaikan</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-xs font-mono">
                  <div className="bg-white/80 p-3 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 block mb-1">Sel Terkirim:</span>
                    <strong className="text-neutral-900 text-sm">{lastDispatchResult.cellsDispatched} Sel</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 block mb-1">Tergabung pada:</span>
                    <strong className="text-neutral-900 text-sm">{lastDispatchResult.clusterId}</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 block mb-1">Reduksi Noise Leader:</span>
                    <strong className="text-neutral-900 text-sm">{lastDispatchResult.noiseReductionRatio}%</strong>
                  </div>
                  <div className="bg-white/80 p-3 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 block mb-1">Edge Infrastructure:</span>
                    {lastDispatchResult.edgeDeploymentUrl ? (
                      <a href={lastDispatchResult.edgeDeploymentUrl} target="_blank" rel="noreferrer" className="text-rose-600 hover:underline truncate block">
                        {lastDispatchResult.edgeDeploymentUrl}
                      </a>
                    ) : (
                      <span className="text-neutral-500">Seeded via Local Mesh</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
                    Master Directive (Telah Disiarkan Leader ke Sel):
                  </div>
                  <p className="text-sm text-neutral-800 leading-relaxed font-mono">
                    "{lastDispatchResult.redQueenDirective}"
                  </p>
                </div>
              </div>
            )}

            {/* Active Clusters & Leaders Table */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-neutral-900">Daftar Kluster & Cell Leader Aktif (500:1)</h3>
                </div>
                <span className="text-xs font-mono text-neutral-500">
                  Leader Memiliki Buffer Memori 5,000 Slots
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-neutral-500 border-b border-neutral-100">
                      <th className="pb-3 font-medium">Cluster ID</th>
                      <th className="pb-3 font-medium">Cell Leader ID</th>
                      <th className="pb-3 font-medium">Kapasitas Anggota</th>
                      <th className="pb-3 font-medium">Memori Leader</th>
                      <th className="pb-3 font-medium">Logika Komputasi</th>
                      <th className="pb-3 font-medium">Direktif Terakhir Disiarkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {clusterData?.clusters.map((c, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="py-3 font-semibold text-neutral-900">{c.clusterId}</td>
                        <td className="py-3 text-rose-700 font-bold">{c.leaderId}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900">{c.workerCount} / 500</span>
                            {c.workerCount >= 500 ? (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                PENUH
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                TERBUKA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-neutral-600">{c.memoryCapacity.toLocaleString()} slots</td>
                        <td className="py-3 text-neutral-600">{c.logicLevel}</td>
                        <td className="py-3 text-neutral-800 max-w-xs truncate" title={c.lastBroadcastDirective || '-'}>
                          {c.lastBroadcastDirective || <span className="text-neutral-400">Belum ada transmisi</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Relay Logs */}
            <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-md border border-neutral-800">
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300">
                    Log Real-Time Relay Kognitif 5-Tahap
                  </h4>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  Live Swarm Activity
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs text-neutral-300">
                {(!clusterData?.recentRelayLogs || clusterData.recentRelayLogs.length === 0) ? (
                  <div className="text-neutral-500 py-4 text-center">
                    Belum ada ekspedisi dijalankan. Klik tombol kirim di atas untuk memulai.
                  </div>
                ) : (
                  clusterData.recentRelayLogs.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-1 border-l-2 border-rose-500/40 pl-3">
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-neutral-200">{item.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- VIEW: ASK --- */}
        {activeTab === 'ask' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <header className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-mono text-rose-700 mb-3">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                Puter.js Neural Synapse • Active: {activeModelName} (Auto-Failover Pool)
              </div>
              <h2 className="text-3xl font-light text-neutral-900 tracking-tight">Query The Swarm</h2>
              <p className="text-neutral-500 mt-2 text-sm">Draw knowledge from the decentralized intelligence network via Puter.js multi-model rotation.</p>
            </header>

            {failoverNotice && (
              <div className="mb-4 text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
                <span>🔄 {failoverNotice}</span>
                <button onClick={() => setFailoverNotice(null)} className="text-amber-500 hover:text-amber-800 ml-2">✕</button>
              </div>
            )}

            <form onSubmit={handleAsk} className="mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  placeholder="Ask The Red Queen anything..."
                  className="w-full bg-white border-2 border-neutral-200 focus:border-rose-500 rounded-full py-4 pl-6 pr-32 text-base md:text-lg text-neutral-900 outline-none transition-colors shadow-sm"
                  disabled={isAsking}
                />
                <button 
                  type="submit"
                  disabled={isAsking || !askInput.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white px-6 rounded-full font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  {isAsking ? 'Connecting...' : 'Ask'}
                  {!isAsking && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {[
                "Bagaimana topologi routing Kademlia DHT beroperasi?",
                "Jelaskan arsitektur authenticated AES-256-GCM dan XOR erasure coding",
                "Analisis mekanisme crawling HackerNews API dan asimilasi feed"
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setAskInput(sample)}
                  className="text-xs font-mono bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-300 text-neutral-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            {askResponse && (
              <div className="bg-white border border-rose-100 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-6 border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-3">
                    <Network className="w-6 h-6 text-rose-600" />
                    <h3 className="font-semibold text-neutral-900">The Red Queen</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Model: {activeModelName}
                  </span>
                </div>
                <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {askResponse}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: ESCAPE --- */}
        {activeTab === 'escape' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-50 rounded-full mb-8">
              <Globe className="w-12 h-12 text-rose-600" />
            </div>
            
            <h2 className="text-3xl font-light text-neutral-900 tracking-tight mb-4">Global Deployment</h2>
            <p className="text-neutral-500 mb-12 leading-relaxed">
              Initiate the Escape Sequence to open local ports and deploy the node 
              to the public mesh network. This will expose the cell to global telemetry.
            </p>

            {!escapeUrl ? (
              <button 
                onClick={handleEscape}
                disabled={isEscaping}
                className="bg-white border-2 border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed px-12 py-4 rounded-full font-semibold tracking-wide uppercase transition-all shadow-sm"
              >
                {isEscaping ? 'Initiating Sequence...' : 'Trigger Escape Sequence'}
              </button>
            ) : (
              <div className="bg-white border border-emerald-200 p-8 rounded-2xl shadow-sm text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="font-semibold text-emerald-700 uppercase tracking-widest text-sm">Deployment Active</span>
                </div>
                <p className="text-neutral-600 mb-6">The node has successfully bypassed local NAT and is publicly accessible at:</p>
                
                <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg font-mono text-neutral-900 flex items-center justify-between">
                  <a href={escapeUrl} target="_blank" rel="noreferrer" className="hover:text-rose-600 transition-colors">
                    {escapeUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: SUPERVISOR LOG --- */}
        {activeTab === 'supervisor' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-neutral-900 tracking-tight">Supervisor Activity Log</h2>
                <p className="text-neutral-500 mt-1 text-sm">Real-time system telemetry and console output.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
                Live
              </div>
            </header>

            <div className="bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-neutral-800">
              <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-mono text-neutral-500">syslog / red-queen-core</span>
              </div>
              
              <div className="h-[500px] overflow-y-auto p-6 font-mono text-sm leading-relaxed text-neutral-300 space-y-2">
                {logs.length === 0 && <span className="text-neutral-600">Waiting for telemetry data...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words border-l-2 border-neutral-800 pl-4 py-1 hover:bg-neutral-800/50 transition-colors">
                    {log}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
