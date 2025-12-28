import { Supabase } from './SupabaseClient.js';
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
     * The True AI Analysis (RAG Enabled)
     */
    async analyzeState(energyLevel, tags, note, localHistory = "") {
        // [FIX] Fail fast if engine is broken (prevent hang)
        if (!this.isReady || !this.engine) {
            throw new Error("Neural Engine not ready");
        }

        // 1. Fetch Long-Term Memory (RAG)
        let longTermContext = "";
        try {
            console.log("🧠 NeuralCore: Fetching RAG from Supabase...");
            const dbHistory = await Supabase.getHistory(20); // Get last 20 events
            if (dbHistory && dbHistory.length > 0) {
                longTermContext = dbHistory.map(e => {
                    const date = new Date(e.timestamp).toLocaleDateString();
                    // Handle variable payload structures
                    const p = e.data || {};
                    return `[${date}] Type: ${e.type} | Info: ${JSON.stringify(p)}`;
                }).join('\n');
            } else {
                longTermContext = "No long-term history available.";
            }
        } catch (e) {
            console.warn("RAG Fetch Failed, using local context:", e);
            longTermContext = localHistory; // Fallback
        }

        const systemPrompt = `You are an AI Biometric Analyst. Determine 'Energy Context'.
        Modes: 
        - survival (<30% energy)
        - maintenance (30-70%) 
        - expansion (>70%)
        
        Output JSON: { "context": "string", "reasoning": "string", "actionable_tip": "string" }
        
        LONG TERM MEMORY (Patterns):
        ${longTermContext}`;

        const userPrompt = `Energy: ${energyLevel}%. Tags: ${tags.join(',')}. Note: ${note}.`;

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

    /**
     * Generates an End-of-Day Summary based on energy and habits.
     */
    async generateDailySummary(profile, dayData, history) {
        if (!this.isReady || !this.engine) return null;

        const systemPrompt = "You are a wise mentor. Summarize the user's day in ONE insightful sentence (Spanish). Focus on the relationship between Energy and Action.";
        const userPrompt = `
            Profile: ${profile.name} (Chronotype: ${profile.chronotype || 'Unknown'}).
            Start Energy: ${dayData.energyLevel}% (${dayData.energyContext}).
            Habits Completed: ${dayData.completedHabits.length} / ${dayData.totalHabits}.
            Notes: "${dayData.note || 'None'}".
            History Context: ${history.length} recent events.
            
            Synthesize a brief, encouraging conclusion (max 20 words).
            JSON Output: { "message": "string" }
        `;

        try {
            const response = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 100
            });

            const data = JSON.parse(response.choices[0].message.content);
            return data.message;
        } catch (e) {
            console.warn("Daily Summary Failed", e);
            return null;
        }
    }

    /**
     * [SPRINT 26] The Architect
     * Generates personalized habits based on profile.
     */
    async generateHabits(profile) {
        if (!this.isReady || !this.engine) return null;

        const systemPrompt = `You are The Architect. Design 3 powerful daily micro-habits based on the user's Archetype and North Star.
        Constraint: Each habit title must be VERY short (max 4 words). in Spanish.
        Output JSON: { "habits": [ { "title": "string", "id": "string", "icon": "emoji" } ] }`;

        const userPrompt = `
            User: ${profile.name}
            Archetype: ${profile.archetype}
            North Star: ${profile.northStar}
            Chronotype: ${profile.chronotype}
        `;

        try {
            const response = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.8,
                max_tokens: 150
            });

            const data = JSON.parse(response.choices[0].message.content);
            // Ensure unique IDs
            return data.habits.map((h, i) => ({ ...h, id: `auto_${Date.now()}_${i}` }));
        } catch (e) {
            console.warn("Habit Generation Failed", e);
            return null;
        }
    }
}

export const instance = new NeuralCore();
export { instance as NeuralCoreService };
