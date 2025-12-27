/**
 * EnergyEngine - The 'Brain' of Flux.
 * Determines the Operating Mode based on biological energy input.
 * 
 * Future: Will accept HRV, Sleep Data, and Cycle phase.
 */

export class EnergyEngine {
    static calculateContext(level) {
        // Sanity check
        if (typeof level !== 'number') return 'maintenance';

        // The "Elastic" Logic
        if (level <= 35) {
            return 'survival';
        } else if (level <= 70) {
            return 'maintenance';
        } else {
            return 'expansion';
        }
    }

    static getFeedback(level) {
        const context = this.calculateContext(level);
        const map = {
            'survival': { color: 'var(--accent-blue)', icon: '🛡️', label: 'Modo Supervivencia' },
            'maintenance': { color: 'var(--accent-violet)', icon: '⚖️', label: 'Modo Mantenimiento' },
            'expansion': { color: 'var(--accent-cyan)', icon: '🚀', label: 'Modo Expansión' }
        };
        return map[context];
    }
}
