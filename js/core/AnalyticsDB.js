import { Supabase } from './SupabaseClient.js';

const STORAGE_KEY = 'flux_analytics_v1';

export const AnalyticsDB = {
    // -- Core: Append Only Log --
    logEvent(type, payload) {
        const events = this._getAll();
        const event = {
            id: crypto.randomUUID(),
            type, // e.g., 'HABIT_COMPLETED'
            timestamp: Date.now(),
            payload // { habitId, energyLevel, contextUsed... }
        };
        events.push(event);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        console.log(`[Analytics] Logged: ${type}`, event);

        // [NEW] Cloud Sync (Fire and Forget)
        Supabase.logEvent({
            type: type,
            data: payload,
            timestamp: new Date(event.timestamp).toISOString()
        }).catch(err => console.warn("Cloud Log Failed", err));

        return event;
    },

    // -- Queries --

    // Get all events for a specific habit
    getHistory(habitId) {
        const events = this._getAll();
        return events
            .filter(e => e.type === 'HABIT_COMPLETED' && e.payload.habitId === habitId)
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    },

    // For Analysis Engines
    getAll() {
        return this._getAll();
    },

    // [NEW] Alias for clarity in Export
    getAllEvents() {
        return this._getAll();
    },

    // Get last N days of completions for visual chain
    // Returns array of objects compatible with Chain Viz
    getChainData(habitId, days = 7) {
        const history = this.getHistory(habitId);
        return history.slice(0, days);
    },

    // -- RAG: Context Retrieval --
    getRecentEnergyContext(days = 7) {
        const events = this._getAll();
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

        return events
            .filter(e =>
                (e.type === 'NEURAL_CHECK_IN' || e.type === 'ENERGY_CHECK_IN') &&
                e.timestamp > cutoff
            )
            .sort((a, b) => b.timestamp - a.timestamp) // Newest first
            .map(e => {
                const date = new Date(e.timestamp).toLocaleDateString('es-ES', { weekday: 'short' });
                const tags = e.payload.tags ? e.payload.tags.join(',') : '';
                return `[${date}] E:${e.payload.level}% (${tags}) Note: "${e.payload.note || ''}"`;
            })
            .join('\n'); // Return as a clean text block for the LLM
    },

    // -- Private --
    _getAll() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Debugging / Reset
    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
