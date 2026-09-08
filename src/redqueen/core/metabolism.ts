/**
 * [PARTIAL] Metabolism
 * Resource/state manager that monitors CPU and Memory.
 * Modifies cell behavior based on health.
 */
import * as os from 'os';
import * as v8 from 'v8';
import { LifecycleManager, CellState } from './lifecycle';

export class MetabolicCore {
    private lifecycle: LifecycleManager;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(lifecycle: LifecycleManager) {
        this.lifecycle = lifecycle;
    }

    public startMonitoring() {
        this.checkInterval = setInterval(() => this.checkHealth(), 5000);
    }

    public stopMonitoring() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    private checkHealth() {
        if (this.lifecycle.getState() === CellState.DEATH) {
            this.stopMonitoring();
            return;
        }

        // Hitung persentase beban nyata terhadap batas maksimal heap V8
        const heapStats = v8.getHeapStatistics();
        const memRatio = heapStats.used_heap_size / heapStats.heap_size_limit;
        
        // Beban CPU dinormalisasi terhadap jumlah inti core fisik
        const cpus = Math.max(1, os.cpus().length);
        const normalizedLoad = os.loadavg()[0] / cpus;

        if (memRatio > 0.9 || normalizedLoad > 3.0) {
            if (this.lifecycle.getState() !== CellState.HIBERNATING) {
                this.lifecycle.transition(CellState.HIBERNATING, 'Critical resource shortage');
            }
        } else if (memRatio > 0.8 || normalizedLoad > 1.8) {
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
