/**
 * [IMPLEMENTED] Cell Lifecycle
 * Explicit state machine for cell lifecycle.
 */
export enum CellState {
    BIRTH = 'BIRTH',
    INITIALIZING = 'INITIALIZING',
    ACTIVE = 'ACTIVE',
    STRESSED = 'STRESSED',
    HIBERNATING = 'HIBERNATING',
    RECOVERING = 'RECOVERING',
    DEATH = 'DEATH'
}

export interface StateTransitionRecord {
    timestamp: number;
    fromState: CellState;
    toState: CellState;
    reason: string;
}

export class LifecycleManager {
    private state: CellState = CellState.BIRTH;
    private history: StateTransitionRecord[] = [];

    constructor() {
        this.history.push({
            timestamp: Date.now(),
            fromState: CellState.BIRTH,
            toState: CellState.BIRTH,
            reason: 'Cell genesis initialized'
        });
    }

    public getState(): CellState {
        return this.state;
    }

    public getHistory(): StateTransitionRecord[] {
        return [...this.history];
    }

    public transition(newState: CellState, reason: string): boolean {
        const previous = this.state;
        if (previous === newState) return true;

        console.log(`[Lifecycle] Transition: ${previous} -> ${newState} (${reason})`);
        this.state = newState;
        
        this.history.push({
            timestamp: Date.now(),
            fromState: previous,
            toState: newState,
            reason
        });

        // Keep last 50 transitions
        if (this.history.length > 50) {
            this.history.shift();
        }

        return true;
    }
}

