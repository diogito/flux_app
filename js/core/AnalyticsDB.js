/**
 * AnalyticsDB - The Memory of the AI
 * Stores immutable events to track user behavior contextually.
 */

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

    // Get last N days of completions for visual chain
    // Returns array of objects compatible with Chain Viz
    getChainData(habitId, days = 7) {
        const history = this.getHistory(habitId);
        // In a real app, we'd fill in missing dates with "missed" status.
        // For MVP, we just return the raw completions to map.
        return history.slice(0, days);
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
