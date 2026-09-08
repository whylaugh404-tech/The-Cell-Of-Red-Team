/**
 * [IMPLEMENTED] Local Multi-Cell Simulator
 * Safely runs multiple cells on a single node for testing distributed behavior.
 */
import { CellSupervisor } from './redqueen/runtime/supervisor';

async function runSimulator(cellCount: number) {
    console.log(`===========================================`);
    console.log(` RED QUEEN CELL SIMULATOR`);
    console.log(` Booting ${cellCount} isolated cells...`);
    console.log(`===========================================\n`);

    const cells: CellSupervisor[] = [];

    for (let i = 0; i < cellCount; i++) {
        const cell = new CellSupervisor();
        await cell.boot();
        cells.push(cell);
    }

    console.log(`\n[Simulator] All ${cellCount} cells are ACTIVE in the cognitive mesh.`);
    
    // Simulate runtime
    setTimeout(() => {
        console.log(`\n[Simulator] Simulating catastrophic failure (killing 30% of cells)...`);
        const killCount = Math.floor(cellCount * 0.3);
        for(let i=0; i<killCount; i++) {
            cells[i].shutdown();
        }
        
        console.log(`[Simulator] Remaining cells should maintain homeostasis.`);
    }, 3000);

    // Graceful exit
    setTimeout(() => {
        console.log(`\n[Simulator] Test complete. Shutting down remaining cells.`);
        cells.forEach(c => {
            if (c.lifecycle.getState() !== 'DEATH') {
                c.shutdown();
            }
        });
        process.exit(0);
    }, 6000);
}

const args = process.argv.slice(2);
const cellIndex = args.indexOf('--cells');
const count = cellIndex !== -1 ? parseInt(args[cellIndex + 1]) || 1 : 1;

runSimulator(count);
