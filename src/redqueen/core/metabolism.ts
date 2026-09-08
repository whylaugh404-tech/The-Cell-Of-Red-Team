/**
 * [PARTIAL] Metabolism
 * Resource/state manager that monitors CPU and Memory.
 * Modifies cell behavior based on health.
 */
import * as os from 'os';
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

        const memUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
        const loadAvg = os.loadavg()[0]; // 1 minute load average

        if (memUsage > 0.9 || loadAvg > 4.0) {
            if (this.lifecycle.getState() !== CellState.HIBERNATING) {
                this.lifecycle.transition(CellState.HIBERNATING, 'Critical resource shortage');
            }
        } else if (memUsage > 0.7 || loadAvg > 2.0) {
            if (this.lifecycle.getState() !== CellState.STRESSED) {
                this.lifecycle.transition(CellState.STRESSED, 'High resource usage');
            }
        } else {
            if (this.lifecycle.getState() === CellState.STRESSED || this.lifecycle.getState() === CellState.HIBERNATING) {
                this.lifecycle.transition(CellState.RECOVERING, 'Resources normalized');
                setTimeout(() => this.lifecycle.transition(CellState.ACTIVE, 'Recovery complete'), 2000);
            }
        }
    }
}
