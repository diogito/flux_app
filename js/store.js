import { EnergyEngine } from './core/EnergyEngine.js';

const STORAGE_KEY = 'flux_state_v1';

const defaultState = {
    userProfile: {
        name: "Viajero",
        onboardingCompleted: false
    },
    today: {
        date: new Date().toISOString().split('T')[0],
        energyLevel: null, // 0-100
        energyContext: null, // 'survival', 'maintenance', 'expansion'
        completedHabits: []
    },
    // Seed Data (Temporary)
    // We leave this empty so HabitsDB uses its internal defaults.
    // In a real app, we would load persistence here.
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
            return { ...defaultState, ...parsed }; // Merge
        }
        return defaultState;
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

        // Use the Engine!
        this.state.today.energyContext = EnergyEngine.calculateContext(level);

        this.save();
    }

    resetDay() {
        this.state.today = {
            date: new Date().toISOString().split('T')[0],
            energyLevel: null,
            energyContext: null,
            completedHabits: []
        };
        // Also clear habits to trigger DB defaults again if needed, 
        // though usually we keep user habits. For Demo, this is fine.
        this.save();
    }
}

export const store = new Store();
