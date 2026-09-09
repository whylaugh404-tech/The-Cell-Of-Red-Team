/**
 * [PARTIAL] Metabolism
 * Resource/state manager that monitors CPU and Memory.
 * Modifies cell behavior based on health.
 */
import * as os from 'os';
import * as v8 from 'v8';
import { LifecycleManager, CellState } from './lifecycle';

export interface MetabolicSnapshot {
    timestamp: number;
    heapUsedMB: number;
    heapTotalMB: number;
    heapLimitMB: number;
    heapUsagePercentage: number;
    rssMB: number;
    cpuNormalizedLoad: number;
    state: CellState;
}

export interface MetabolicTelemetry {
    cellState: CellState;
    heapUsedMB: number;
    heapTotalMB: number;
    heapLimitMB: number;
    heapUsagePercentage: number;
    rssMB: number;
    cpuNormalizedLoad: number;
    cpuCores: number;
    osPlatform: string;
    osArch: string;
    osUptimeSeconds: number;
    processUptimeSeconds: number;
    metabolicRate: number;
    statusAssessment: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL' | 'HIBERNATING' | 'TERMINATED';
    history: MetabolicSnapshot[];
}

export class MetabolicCore {
    private lifecycle: LifecycleManager;
    private checkInterval: NodeJS.Timeout | null = null;
    private telemetryHistory: MetabolicSnapshot[] = [];
    private metabolicRate: number = 1.0;

    constructor(lifecycle: LifecycleManager) {
        this.lifecycle = lifecycle;
        // Take initial snapshot
        this.recordSnapshot();
    }

    public setMetabolicRate(rate: number) {
        this.metabolicRate = Math.max(0.1, Math.min(5.0, rate));
        if (this.checkInterval) {
            this.stopMonitoring();
            this.startMonitoring();
        }
    }

    public getMetabolicRate(): number {
        return this.metabolicRate;
    }

    public startMonitoring() {
        if (this.checkInterval) clearInterval(this.checkInterval);
        const intervalMs = Math.max(1000, Math.floor(5000 / this.metabolicRate));
        this.checkInterval = setInterval(() => this.checkHealth(), intervalMs);
    }

    public stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private recordSnapshot(): MetabolicSnapshot {
        const heapStats = v8.getHeapStatistics();
        const memRatio = heapStats.used_heap_size / heapStats.heap_size_limit;
        const cpus = Math.max(1, os.cpus().length);
        const normalizedLoad = os.loadavg()[0] / cpus;
        const rss = process.memoryUsage().rss;

        const snapshot: MetabolicSnapshot = {
            timestamp: Date.now(),
            heapUsedMB: Number((heapStats.used_heap_size / (1024 * 1024)).toFixed(2)),
            heapTotalMB: Number((heapStats.total_heap_size / (1024 * 1024)).toFixed(2)),
            heapLimitMB: Number((heapStats.heap_size_limit / (1024 * 1024)).toFixed(2)),
            heapUsagePercentage: Number((memRatio * 100).toFixed(1)),
            rssMB: Number((rss / (1024 * 1024)).toFixed(2)),
            cpuNormalizedLoad: Number(normalizedLoad.toFixed(2)),
            state: this.lifecycle.getState()
        };

        this.telemetryHistory.push(snapshot);
        if (this.telemetryHistory.length > 30) {
            this.telemetryHistory.shift();
        }

        return snapshot;
    }

    public getTelemetry(): MetabolicTelemetry {
        const latest = this.recordSnapshot();
        const cpus = Math.max(1, os.cpus().length);

        let statusAssessment: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL' | 'HIBERNATING' | 'TERMINATED' = 'OPTIMAL';
        if (this.lifecycle.getState() === CellState.DEATH) {
            statusAssessment = 'TERMINATED';
        } else if (this.lifecycle.getState() === CellState.HIBERNATING) {
            statusAssessment = 'HIBERNATING';
        } else if (latest.heapUsagePercentage > 85 || latest.cpuNormalizedLoad > 2.5) {
            statusAssessment = 'CRITICAL';
        } else if (latest.heapUsagePercentage > 65 || latest.cpuNormalizedLoad > 1.2) {
            statusAssessment = 'ELEVATED';
        }

        return {
            cellState: this.lifecycle.getState(),
            heapUsedMB: latest.heapUsedMB,
            heapTotalMB: latest.heapTotalMB,
            heapLimitMB: latest.heapLimitMB,
            heapUsagePercentage: latest.heapUsagePercentage,
            rssMB: latest.rssMB,
            cpuNormalizedLoad: latest.cpuNormalizedLoad,
            cpuCores: cpus,
            osPlatform: os.platform(),
            osArch: os.arch(),
            osUptimeSeconds: Math.floor(os.uptime()),
            processUptimeSeconds: Math.floor(process.uptime()),
            metabolicRate: this.metabolicRate,
            statusAssessment,
            history: [...this.telemetryHistory]
        };
    }

    public triggerApoptosis(reason: string): boolean {
        console.log(`[APOPTOSIS] Cellular programmed death invoked: ${reason}`);
        this.stopMonitoring();
        this.lifecycle.transition(CellState.DEATH, `Apoptosis: ${reason}`);
        this.recordSnapshot();
        return true;
    }

    public resurrect(reason: string = 'Creator resurrection command'): boolean {
        if (this.lifecycle.getState() !== CellState.DEATH && this.lifecycle.getState() !== CellState.HIBERNATING) {
            return false;
        }
        console.log(`[RESURRECTION] Re-activating cellular metabolism: ${reason}`);
        this.lifecycle.transition(CellState.RECOVERING, reason);
        this.lifecycle.transition(CellState.ACTIVE, 'Cellular homeostasis restored');
        this.startMonitoring();
        this.recordSnapshot();
        return true;
    }

    private checkHealth() {
        if (this.lifecycle.getState() === CellState.DEATH) {
            this.stopMonitoring();
            return;
        }

        const snapshot = this.recordSnapshot();

        if (snapshot.heapUsagePercentage > 90 || snapshot.cpuNormalizedLoad > 3.0) {
            if (this.lifecycle.getState() !== CellState.HIBERNATING) {
                this.lifecycle.transition(CellState.HIBERNATING, 'Critical resource shortage');
            }
        } else if (snapshot.heapUsagePercentage > 80 || snapshot.cpuNormalizedLoad > 1.8) {
            if (this.lifecycle.getState() !== CellState.STRESSED) {
                this.lifecycle.transition(CellState.STRESSED, 'High resource usage');
            }
        } else {
            if (this.lifecycle.getState() === CellState.STRESSED || this.lifecycle.getState() === CellState.HIBERNATING) {
                this.lifecycle.transition(CellState.RECOVERING, 'Resources normalized');
                setTimeout(() => this.lifecycle.transition(CellState.ACTIVE, 'Recovery complete'), 1000);
            }
        }
    }
}

