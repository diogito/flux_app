import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Using Qwen2-1.5B for maximum mobile compatibility (~1GB VRAM, High Speed)
const MODEL_ID = "Qwen2-1.5B-Instruct-q4f16_1-MLC";

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
    async analyzeState(energyLevel, tags, note, historyContext = "") {
        if (!this.engine) throw new Error("Brain not initialized");

        // Construct the prompt with RAG Context
        const userPrompt = `
        Current State:
        - Energy: ${energyLevel}%
        - Tags: ${tags.join(', ')}
        - User Note: "${note}"

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
    /**
     * Generates a short, encouraging message when a habit is completed.
     * Uses extremely short context / output to be fast.
     */
    async generateMicroCoaching(habitName, energyLevel) {
        if (!this.engine) return null;

        const systemPrompt = "You are a motivational coach. Output a single short sentence (max 10 words).";
        const userPrompt = `User completed habit: "${habitName}". Current Energy: ${energyLevel}%. 
        If energy is low (<30), praise resilience. 
        If energy is high (>70), praise flow/momentum. 
        Otherwise, give generic reinforcement.
        JSON Output: { "message": "string" }`;

        try {
            const response = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 50 // Keep it very fast
            });

            const data = JSON.parse(response.choices[0].message.content);
            return data.message;
        } catch (e) {
            console.warn("Micro-Coaching Failed", e);
            return null; // Silent fail is fine here
        }
    }
}

export const instance = new NeuralCore();
export { instance as NeuralCoreService };
