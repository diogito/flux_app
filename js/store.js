import { EnergyEngine } from './core/EnergyEngine.js';
import { DEFAULT_HABITS } from './core/HabitsDB.js';
import { AnalyticsDB } from './core/AnalyticsDB.js';

const STORAGE_KEY = 'flux_state_v1';

const defaultState = {
    userProfile: {
        name: null,         // "Xavier"
        archetype: null,    // "Creator"
        chronotype: null,   // "morning" | "afternoon" | "evening"
        northStar: null,    // "Build the future"
        email: null,        // For Auth
        id: null,           // Supabase UUID
        onboardingCompleted: false
    },
    today: {
        date: new Date().toISOString().split('T')[0],
        energyLevel: null,
        energyContext: null,
        completedHabits: []
    },
    habits: []
};

class Store {
    constructor() {
        this.state = this.load();
        this.listeners = [];
        console.log("Flux Store Initialized", this.state);
    }

    // -- Persistence --
    load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // [SPRINT 26] Dynamic Habits: 
            // Only inject defaults if WE DO NOT HAVE A PROFILE yet. 
            // If we have a profile but no habits, it might be because we haven't generated them yet.
            // But for backwards compatibility/safety:
            if ((!parsed.habits || parsed.habits.length === 0) && !parsed.userProfile.onboardingCompleted) {
                parsed.habits = DEFAULT_HABITS;
            }
            return { ...defaultState, ...parsed };
        }
        return { ...defaultState, habits: DEFAULT_HABITS }; // Truly fresh start does get defaults (Genesis clears them anyway if needed)
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
    }

    // -- Reactivity --
    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.state));
    }

    // -- Actions --
    // -- Deterministic Heuristic Fallback --
    setEnergy(level, tags = [], note = '') {
        this.setNeuralState(level, {
            context: EnergyEngine.calculateContext(level, tags),
            reasoning: "Heuristic Fallback (Neural Core Offline)",
            actionable_tip: "Escucha a tu cuerpo."
        }, tags, note);
    }

    // -- Identity Actions (Sprint 25) --
    updateProfile(data) {
        this.state.userProfile = { ...this.state.userProfile, ...data };
        this.save();
        AnalyticsDB.logEvent('PROFILE_UPDATE', data);
    }

    linkIdentity(authData) {
        this.state.userProfile.email = authData.email;
        this.state.userProfile.id = authData.id;
        this.save();
    }

    // -- True AI State Setter --
    setNeuralState(level, aiAnalysis, tags = [], note = '') {
        this.state.today.energyLevel = level;
        this.state.today.energyContext = aiAnalysis.context; // The LLM decided this!
        this.state.today.aiReasoning = aiAnalysis.reasoning; // Store the "Why"

        AnalyticsDB.logEvent('NEURAL_CHECK_IN', {
            level,
            context: aiAnalysis.context,
            reasoning: aiAnalysis.reasoning,
            tip: aiAnalysis.actionable_tip,
            tags,
            note,
            model: "Phi-3-Mini-WebGPU"
        });

        this.save();
    }

    // Force a specific context regardless of energy (The "Override")
    setContextOverride(context) {
        this.state.today.energyContext = context;
        this.save();

        AnalyticsDB.logEvent('CONTEXT_OVERRIDE', {
            forcedContext: context,
            energyLevel: this.state.today.energyLevel
        });
    }

    resetDay() {
        this.state.today = {
            date: new Date().toISOString().split('T')[0],
            energyLevel: null,
            energyContext: null,
            completedHabits: []
        };
        this.save();
    }

    addHabit(habit) {
        if (!this.state.habits) this.state.habits = [];
        this.state.habits.push(habit);
        this.save();
    }

    removeHabit(habitId) {
        if (!this.state.habits) return;
        this.state.habits = this.state.habits.filter(h => h.id !== habitId);
        this.save();
    }

    completeHabit(habitId) {
        // Init if missing
        if (!this.state.today.completedHabits) this.state.today.completedHabits = [];

        // 1. Update State (Simple View)
        if (!this.state.today.completedHabits.includes(habitId)) {
            this.state.today.completedHabits.push(habitId);
            this.save();

            // 2. Log Rich Analytics (The Brain)
            AnalyticsDB.logEvent('HABIT_COMPLETED', {
                habitId,
                energyLevel: this.state.today.energyLevel,
                contextUsed: this.state.today.energyContext || 'maintenance'
            });
        }
    }
}

export const store = new Store();
