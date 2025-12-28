import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Using Qwen2-1.5B for maximum mobile compatibility (~1GB VRAM, High Speed)
const MODEL_ID = "Qwen2-1.5B-Instruct-q4f16_1-MLC";

export class NeuralCore {
    constructor() {
        this.engine = null;
        this.isReady = false; // [NEW] Flag to prevent calls to broken engine
        this.statusCallback = null;
    }

    async init(onProgress) {
        if (this.isReady) return;

        try {
            console.log("[NeuralCore] Initializing WebLLM...");

            const initProgressCallback = (report) => {
                console.log("[NeuralCore] Loading:", report.text);
                if (onProgress) onProgress(report.text);
            };

            this.engine = await CreateMLCEngine(
                MODEL_ID,
                { initProgressCallback }
            );

            this.isReady = true; // [NEW] Mark as healthy
            console.log("[NeuralCore] Cortex Ready.");
        } catch (error) {
            console.error("[NeuralCore] Initialization Failed:", error);
            this.isReady = false;
            // Don't throw, just let it be broken so we can fallback
        }
    }

    /**
     * The True AI Analysis
     */
    async analyzeState(energyLevel, tags, note, historyContext = "") {
        // [FIX] Fail fast if engine is broken (prevent hang)
        if (!this.isReady || !this.engine) {
            throw new Error("Neural Engine not ready");
        }

        const systemPrompt = `You are an AI Biometric Analyst. Determine 'Energy Context'.
        Modes: 
        - survival (<30% energy)
        - maintenance (30-70%) 
        - expansion (>70%)
        
        Output JSON: { "context": "string", "reasoning": "string", "actionable_tip": "string" }
        `;

        const userPrompt = `Energy: ${energyLevel}%. Tags: ${tags.join(',')}. Note: ${note}. History: ${historyContext}`;

        const response = await this.engine.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    }

    /**
     * Generates a short, encouraging message when a habit is completed.
     */
    async generateMicroCoaching(habitName, energyLevel) {
        // [FIX] Fail fast to allow Cloud Fallback
        if (!this.isReady || !this.engine) return null;

        const systemPrompt = "You are a motivational coach. Output a single short sentence (max 10 words) in SPANISH.";
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
                max_tokens: 50
            });

            const data = JSON.parse(response.choices[0].message.content);
            return data.message;
        } catch (e) {
            console.warn("Micro-Coaching Failed", e);
            return null;
        }
    }
}

export const instance = new NeuralCore();
export { instance as NeuralCoreService };
