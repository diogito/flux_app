import { AnalyticsDB } from './AnalyticsDB.js';

export class WeeklyAnalysis {
    static generateReport() {
        const events = AnalyticsDB.getAll();

        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

        // Filter last 7 days
        const recentEvents = events.filter(e => e.timestamp >= oneWeekAgo);

        // 1. Energy Analysis
        const energyLogs = recentEvents.filter(e => e.type === 'ENERGY_CHECK_IN');
        const avgEnergy = energyLogs.length
            ? Math.round(energyLogs.reduce((acc, curr) => acc + curr.payload.level, 0) / energyLogs.length)
            : 0;

        // 2. Habit Analysis
        const completions = recentEvents.filter(e => e.type === 'HABIT_COMPLETED').length;

        // 3. Tag Correlation (Simple)
        const tagCounts = {};
        energyLogs.forEach(log => {
            if (log.payload.tags && Array.isArray(log.payload.tags)) {
                log.payload.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(e => e[0]);

        // 4. Insight Generation
        let insight = "No hay suficientes datos esta semana.";
        if (avgEnergy > 60) insight = "Semana de Alta Energía. ¡Buen momento para Sprint de Expansión!";
        else if (avgEnergy < 40) insight = "Semana de Recuperación. Tu cuerpo está pidiendo descanso.";
        else insight = "Semana Estable. La consistencia es clave.";

        if (topTags.length > 0) {
            insight += ` Tu tema recurrente fue: "${topTags[0]}".`;
        }

        return {
            period: 'Últimos 7 días',
            avgEnergy,
            completions,
            topTags,
            insight,
            logCount: recentEvents.length
        };
    }
}
