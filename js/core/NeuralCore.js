import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Using Phi-3-mini for a balance of speed and intelligence (~2.3GB download)
const MODEL_ID = "Phi-3.5-mini-instruct-q4f16_1-MLC";

export class NeuralCore {
    constructor() {
        this.engine = null;
        this.isReady = false;
        this.statusCallback = null;
    }

    async init(onProgress) {
        if (this.isReady) return;

        try {
            console.log("[NeuralCore] Initializing WebLLM...");
            this.engine = await CreateMLCEngine(
                MODEL_ID,
                {
                    initProgressCallback: (report) => {
                        console.log("[NeuralCore] Loading:", report.text);
                        if (onProgress) onProgress(report.text);
                    }
                }
            );
            this.isReady = true;
            console.log("[NeuralCore] Cortex Ready.");
        } catch (error) {
            console.error("[NeuralCore] Initialization Failed:", error);
            throw error;
        }
    }

    /**
     * The True AI Analysis
     * Replaces deterministic if/else with semantic reasoning.
     */
    async analyzeState(energyLevel, tags, note) {
        if (!this.engine) throw new Error("Cortex not initialized");

        const prompt = `
        You are Flux, an advanced behavioral psychologist AI. 
        Your goal is to decide the optimal "Operating Mode" for the user based on their biological and psychological state.

        DATA:
        - Energy Level (Physiological): ${energyLevel}/100
        - Reported Tags: ${tags.join(', ')}
        - User Note: "${note}"

        DEFINITIONS:
        - Survival Mode: User is exhausted, sick, or blocked. Goal: Minimal effort, easy wins.
        - Maintenance Mode: User is okay. Goal: Consistency, standard routine.
        - Expansion Mode: User is peak state. Goal: Challenges, deep work.

        INSTRUCTIONS:
        Analyze the conflict between the energy level and the note (e.g., low energy but high motivation, or high energy but sick).
        Prioritize safety and long-term consistency.
        
        OUTPUT JSON ONLY:
        {
            "context": "survival" | "maintenance" | "expansion",
            "reasoning": "Short explanation (1 sentence) directly to the user.",
            "actionable_tip": "One micro-action suggestion."
        }
        `;

        const messages = [
            { role: "system", content: "You are a helpful assistant that outputs only JSON." },
            { role: "user", content: prompt }
        ];

        const response = await this.engine.chat.completions.create({
            messages,
            response_format: { type: "json_object" } // Force JSON
        });

        try {
            return JSON.parse(response.choices[0].message.content);
        } catch (e) {
            console.error("AI Parsing Error", e);
            // Fallback to heuristic if AI hallucinates format
            return {
                context: energyLevel < 30 ? 'survival' : 'maintenance',
                reasoning: "Flux Core fallback logic active.",
                actionable_tip: "Just breathe."
            };
        }
    }
}

export const instance = new NeuralCore();
export { instance as NeuralCoreService };
