import { AnalyticsDB } from './AnalyticsDB.js';

export const InsightEngine = {
    /**
     * Analyzes history to predict today's likely energy state.
     * @returns {Object|null} Forecast object or null if insufficient data.
     */
    generateForecast() {
        const history = AnalyticsDB._getAll();
        if (history.length < 5) return null; // Need baseline data

        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...

        // 1. Filter events for this specific day of week
        const sameDayEvents = history.filter(event => {
            const date = new Date(event.timestamp);
            return date.getDay() === dayOfWeek && event.type === 'ENERGY_CHECK_IN';
        });

        if (sameDayEvents.length === 0) return null;

        // 2. Calculate Average Energy for this day
        const totalEnergy = sameDayEvents.reduce((sum, e) => sum + (e.payload.level || 0), 0);
        const avgEnergy = Math.round(totalEnergy / sameDayEvents.length);

        // 3. Generate Insight
        let message = '';
        let type = 'neutral';

        if (avgEnergy <= 30) {
            type = 'warning';
            message = `Tu historial dice que los ${this._getDayName(dayOfWeek)} suelen ser difíciles (${avgEnergy}% de energía promedio).`;
        } else if (avgEnergy >= 70) {
            type = 'opportunity';
            message = `¡Sueles brillar los ${this._getDayName(dayOfWeek)}! Promedio histórico alto (${avgEnergy}%).`;
        } else {
            // Neutral forecast, maybe don't show anything to avoid noise
            return null;
        }

        return {
            avgEnergy,
            message,
            type, // 'warning' | 'opportunity'
            confidence: Math.min((sameDayEvents.length * 10), 100) // Rough confidence score based on sample size
        };
    },

    _getDayName(index) {
        const days = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
        return days[index];
    }
};
