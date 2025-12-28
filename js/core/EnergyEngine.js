/**
 * EnergyEngine - The 'Brain' of Flux.
 * Determines the Operating Mode based on biological energy input.
 * 
 * Future: Will accept HRV, Sleep Data, and Cycle phase.
 */

export class EnergyEngine {
    /**
     * Maps energy level to detailed context
     * @param {number} level 0-100
     * @returns {string} 'survival' | 'maintenance' | 'expansion'
     */
    static calculateContext(level) {
        // Sanity check
        if (typeof level !== 'number') return 'maintenance';

        // The "Elastic" Logic
        if (level <= 30) return 'survival';
        if (level >= 70) return 'expansion';
        return 'maintenance';
    }

    /**
     * Maps energy level to somatic sensations (Interoception Training)
     * @param {number} level 0-100
     * @returns {string} Descriptive somatic tags
     */
    static getSomaticLabel(level) {
        if (level <= 20) return "Cuerpo rígido • Niebla mental";
        if (level <= 40) return "Lentitud • Pesadez";
        if (level <= 60) return "Estable • Respiración normal";
        if (level <= 80) return "Alerta • Ligereza";
        return "Mente afilada • Ganas de reto";
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
