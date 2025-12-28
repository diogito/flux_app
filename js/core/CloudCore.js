export const API_BASE = 'http://localhost:8000/api';

export class CloudCoreService {

    static async analyzeState(energyLevel, tags, note, history = []) {
        console.log("☁️ Calling Cloud Synapse...");

        try {
            const response = await fetch(`${API_BASE}/neural-bridge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer FLUX_DEMO_KEY' // Mock Auth
                },
                body: JSON.stringify({
                    type: 'analysis',
                    energy_level: energyLevel,
                    tags: tags,
                    note: note,
                    history: history,
                    format: 'json'
                })
            });

            if (!response.ok) {
                throw new Error(`Cloud Error: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error("Cloud Bridge Failed:", error);
            throw error; // Propagate to trigger manual fallback
        }
    }

    static async generateMicroCoaching(habitName, energyLevel) {
        try {
            const response = await fetch(`${API_BASE}/neural-bridge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'micro_coaching', // Signal to server to use coaching prompt
                    habitName,
                    energyLevel
                })
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.message;
        } catch (e) {
            console.warn("Cloud Coach Failed:", e);
            return null;
        }
    }

    static async generateDailySummary(profile, dayData, history) {
        try {
            const response = await fetch(`${API_BASE}/neural-bridge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'daily_summary',
                    profile,
                    dayData,
                    history
                })
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.message;
        } catch (e) {
            console.warn("Cloud Summary Failed:", e);
            return null;
        }
    }
}
