export const CloudCoreService = {
    /**
     * Fallback Analysis via Cloud API
     * Used when WebGPU is not available.
     */
    async analyzeState(energyLevel, tags, note, historyContext = "") {
        console.log("☁️ CloudCore: Contacting Mother Ship...");

        try {
            const response = await fetch('/api/neural-bridge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer FLUX_DEMO_KEY'
                },
                body: JSON.stringify({
                    energy_level: energyLevel,
                    semantic_tags: tags,
                    journal_note: note,
                    history_context: historyContext, // [NEW] RAG
                    client_timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Cloud Error: ${response.status}`);
            }

            const data = await response.json();

            // Normalize response to match NeuralCore format
            return {
                context: data.analysis.context,
                reasoning: data.analysis.reasoning,
                actionable_tip: data.analysis.actionable_tip,
                source: "cloud" // Metadata
            };

        } catch (error) {
            console.error("☁️ CloudCore Failed:", error);
            throw error; // Re-throw to trigger Heuristic Fallback
        }
    }
};
