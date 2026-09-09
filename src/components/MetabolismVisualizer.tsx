import React, { useState, useEffect } from 'react';
import { Activity, Zap, ShieldAlert, Cpu, HeartPulse, Dna, Settings2, Trash2, Power } from 'lucide-react';

export default function MetabolismVisualizer() {
    const [telemetry, setTelemetry] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [actionLog, setActionLog] = useState<string[]>([]);
    
    const fetchTelemetry = async () => {
        try {
            const res = await fetch('/api/cell/metabolism');
            const data = await res.json();
            if (data.success) {
                setTelemetry(data.telemetry);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 3000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (msg: string) => {
        setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const handleMutation = async (trait: string) => {
        if (!confirm(`Are you sure you want to trigger a forced mutation to ${trait} archetype?`)) return;
        setIsMutating(true);
        try {
            const res = await fetch('/api/cell/mutate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetTrait: trait, reason: 'Manual override via visualizer' })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`Mutation successful. New generation: ${data.genome.generation}. Trait: ${data.genome.specializedTrait}`);
                fetchTelemetry();
            } else {
                addLog(`Mutation failed: ${data.error}`);
            }
        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        } finally {
            setIsMutating(false);
        }
    };

    const handleApoptosis = async () => {
        if (!confirm(`WARNING: This will trigger programmed cellular death and shred all cryptographic memory. Continue?`)) return;
        try {
            const res = await fetch('/api/cell/apoptosis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Creator invoked apoptosis' })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`Apoptosis executed. Status: TERMINATED. Shredded ${data.shredStats.shreddedShards} shards.`);
                fetchTelemetry();
            } else {
                addLog(`Apoptosis failed: ${data.error}`);
            }
        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        }
    };

    const handleResurrect = async () => {
        try {
            const res = await fetch('/api/cell/resurrect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Creator invoked resurrection' })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`Cell resurrection initiated. Metabolism restarting.`);
                fetchTelemetry();
            } else {
                addLog(`Resurrection failed: ${data.error}`);
            }
        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        }
    };

    const handleSetRate = async (rate: number) => {
        try {
            const res = await fetch('/api/cell/metabolism', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`Metabolic rate adjusted to ${rate.toFixed(1)}x.`);
                fetchTelemetry();
            } else {
                addLog(`Rate adjustment failed: ${data.error}`);
            }
        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        }
    };

    if (loading) return <div className="text-red-500 font-mono animate-pulse">Scanning cellular vitals...</div>;
    if (!telemetry) return <div className="text-red-500 font-mono">Failed to acquire telemetry.</div>;

    const traits = ['REGENERATIVE', 'IMMUNE', 'ARCHIVAL', 'ROUTER', 'EPHEMERAL'];

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-3">
                    <Activity className="w-6 h-6 text-red-500" />
                    Cellular Metabolism & Plasticity
                </h2>
                <p className="text-neutral-400 mt-2 text-sm">
                    Phase 7: Real-time autonomous phenotypic adaptation, metabolic rate control, and apoptosis invocation.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="bg-black border border-red-900/40 p-6 rounded-2xl">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-red-500" />
                        Vitals
                    </h3>
                    <div className="space-y-4 font-mono text-sm">
                        <div className="flex justify-between items-center border-b border-red-900/20 pb-2">
                            <span className="text-neutral-500">State</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${telemetry.cellState === 'DEATH' ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>{telemetry.cellState}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-red-900/20 pb-2">
                            <span className="text-neutral-500">Assessment</span>
                            <span className="text-white">{telemetry.statusAssessment}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-red-900/20 pb-2">
                            <span className="text-neutral-500">Metabolic Rate</span>
                            <span className="text-cyan-400">{telemetry.metabolicRate.toFixed(1)}x</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-red-900/20 pb-2">
                            <span className="text-neutral-500">Heap Usage</span>
                            <span className="text-amber-400">{telemetry.heapUsagePercentage}% ({telemetry.heapUsedMB} MB)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-500">CPU Load (Norm)</span>
                            <span className="text-rose-400">{telemetry.cpuNormalizedLoad.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Adaptive Mutation */}
                <div className="bg-black border border-red-900/40 p-6 rounded-2xl md:col-span-2">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Dna className="w-4 h-4 text-purple-500" />
                        Phenotypic Plasticity (Mutation)
                    </h3>
                    <p className="text-neutral-400 text-xs mb-4">
                        Inject environmental pressure to force a cellular trait mutation. This alters memory allocation limits and metabolic ceilings deterministically.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {traits.map(t => (
                            <button
                                key={t}
                                onClick={() => handleMutation(t)}
                                disabled={isMutating || telemetry.cellState === 'DEATH'}
                                className="bg-neutral-900 hover:bg-red-900/40 text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-red-900/30 text-xs font-mono transition-colors disabled:opacity-50"
                            >
                                Trigger {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metabolic Controls */}
                <div className="bg-black border border-red-900/40 p-6 rounded-2xl">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-blue-500" />
                        Metabolic Modifiers
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleSetRate(0.5)} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs py-2 rounded">0.5x</button>
                            <button onClick={() => handleSetRate(1.0)} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white border border-red-900/50 text-xs py-2 rounded">1.0x</button>
                            <button onClick={() => handleSetRate(2.5)} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs py-2 rounded">2.5x</button>
                        </div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center mt-2">Adjust Monitoring Frequency</p>
                    </div>
                </div>

                {/* Critical Lifecycle */}
                <div className="bg-black border border-red-900/40 p-6 rounded-2xl md:col-span-2">
                    <h3 className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Critical Lifecycle Directives
                    </h3>
                    <div className="flex gap-4">
                        <button
                            onClick={handleApoptosis}
                            disabled={telemetry.cellState === 'DEATH'}
                            className="flex-1 bg-red-950/30 hover:bg-red-900/60 border border-red-900 text-red-400 px-4 py-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-xs font-mono font-semibold">Invoke Apoptosis (Crypto-Shred)</span>
                        </button>
                        <button
                            onClick={handleResurrect}
                            disabled={telemetry.cellState !== 'DEATH'}
                            className="flex-1 bg-emerald-950/30 hover:bg-emerald-900/60 border border-emerald-900 text-emerald-400 px-4 py-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Power className="w-5 h-5" />
                            <span className="text-xs font-mono font-semibold">Resurrect Cell</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Logs */}
            <div className="bg-black border border-red-900/40 p-4 rounded-xl font-mono text-[11px] text-neutral-400 h-32 overflow-y-auto space-y-1">
                {actionLog.map((log, i) => (
                    <div key={i} className={log.includes('failed') || log.includes('Error') ? 'text-red-400' : log.includes('Apoptosis') ? 'text-rose-500' : 'text-emerald-400'}>
                        {log}
                    </div>
                ))}
                {actionLog.length === 0 && <span className="text-neutral-600">Awaiting creator directives...</span>}
            </div>
        </div>
    );
}
