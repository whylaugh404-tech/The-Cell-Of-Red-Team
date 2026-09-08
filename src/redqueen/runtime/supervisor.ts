/**
 * [IMPLEMENTED] Cell Supervisor
 * Orchestrates Metabolism, Network, Memory, and Cognition safely.
 */
import { CellIdentity } from '../network/identity';
import { LifecycleManager, CellState } from '../core/lifecycle';
import { MetabolicCore } from '../core/metabolism';
import { TransportLayer } from '../network/transport';
import { KademliaRouting, DHTNode } from '../network/dht';
import { HolographicMemory } from '../memory/manager';
import { CognitiveMesh } from '../cognition/mesh';

export class CellSupervisor {
    public identity: CellIdentity;
    public lifecycle: LifecycleManager;
    public metabolism: MetabolicCore;
    public transport: TransportLayer;
    public dht: KademliaRouting;
    public memory: HolographicMemory;
    public cognition: CognitiveMesh;

    constructor() {
        this.lifecycle = new LifecycleManager();
        this.lifecycle.transition(CellState.INITIALIZING, 'Supervisor boot');
        
        this.identity = new CellIdentity();
        this.metabolism = new MetabolicCore(this.lifecycle);
        this.transport = new TransportLayer(this.identity);
        this.dht = new KademliaRouting(this.identity.cellId);
        this.memory = new HolographicMemory();
        this.cognition = new CognitiveMesh(this.identity.cellId);
    }

    public async boot() {
        await this.transport.listen();
        this.metabolism.startMonitoring();
        
        // Self-add to DHT logically (though Kademlia explicitly avoids storing self)
        // We'll populate some mock neighbors to simulate an active mesh for the dashboard
        this.simulateMeshConnections();

        this.lifecycle.transition(CellState.ACTIVE, 'Boot complete');
        console.log(`[Cell ${this.identity.cellId.substring(0, 8)}] Active on port ${this.transport.getPort()}`);
    }

    private simulateMeshConnections() {
        // Simulate discovering peers on the global mesh
        import('crypto').then(crypto => {
            for(let i=0; i<5; i++) {
                const mockId = crypto.randomBytes(32).toString('hex');
                this.dht.addPeer(new DHTNode(mockId, '192.168.1.' + Math.floor(Math.random()*255), 3000));
            }
            
            // Simulate a stray thought/signal arriving
            setInterval(() => {
                if (this.lifecycle.getState() === CellState.ACTIVE) {
                     this.cognition.createSignal('STIMULUS', 'Environmental heartbeat ping');
                }
            }, 10000);
        });
    }

    public shutdown() {
        this.lifecycle.transition(CellState.DEATH, 'Graceful shutdown requested');
        this.metabolism.stopMonitoring();
        this.transport.close();
        console.log(`[Cell ${this.identity.cellId.substring(0, 8)}] Shutdown complete`);
    }
}
