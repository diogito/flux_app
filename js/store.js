import { EnergyEngine } from './core/EnergyEngine.js';
import { DEFAULT_HABITS } from './core/HabitsDB.js';
import { AnalyticsDB } from './core/AnalyticsDB.js';

const STORAGE_KEY = 'flux_state_v1';

const defaultState = {
    userProfile: {
        name: "Viajero",
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
            if (!parsed.habits || parsed.habits.length === 0) {
                parsed.habits = DEFAULT_HABITS;
            }
            return { ...defaultState, ...parsed };
        }
        return { ...defaultState, habits: DEFAULT_HABITS };
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
    setEnergy(level) {
        this.state.today.energyLevel = level;
        this.state.today.energyContext = EnergyEngine.calculateContext(level);

        // Log to Analytics (The Brain)
        AnalyticsDB.logEvent('ENERGY_CHECK_IN', {
            level,
            context: this.state.today.energyContext
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
