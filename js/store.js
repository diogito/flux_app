import { EnergyEngine } from './core/EnergyEngine.js';
import { DEFAULT_HABITS } from './core/HabitsDB.js';

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
            // Ensure habits exist. If empty array (and not intentionally empty), might want defaults.
            // But for now, if it's undefined or length 0, we re-seed defaults SO the user isn't stuck with empty list.
            if (!parsed.habits || parsed.habits.length === 0) {
                parsed.habits = DEFAULT_HABITS;
            }
            return { ...defaultState, ...parsed };
        }
        // First time load: Use Defaults
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
        this.save();
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
}

export const store = new Store();
