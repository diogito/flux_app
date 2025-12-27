/**
 * HabitsDB - Core Logic for Habit Management
 * Handles structure validation and level generation.
 */

export const DEFAULT_HABITS = [
    {
        id: "h_seed_01",
        title: "Movimiento",
        category: "health",
        icon: "🏃‍♂️",
        levels: {
            survival: { text: "Estirar 3 min", duration: 3 },
            maintenance: { text: "Caminata 20 min", duration: 20 },
            expansion: { text: "Entreno 45 min", duration: 45 }
        }
    },
    {
        id: "h_seed_02",
        title: "Lectura",
        category: "mind",
        icon: "📚",
        levels: {
            survival: { text: "Leer 1 página", duration: 2 },
            maintenance: { text: "Leer 15 min", duration: 15 },
            expansion: { text: "Leer 1 capítulo", duration: 30 }
        }
    },
    {
        id: "h_seed_03",
        title: "Meditación",
        category: "spirit",
        icon: "🧘",
        levels: {
            survival: { text: "3 Respiraciones", duration: 1 },
            maintenance: { text: "Mindfulness 10m", duration: 10 },
            expansion: { text: "Meditación 20m", duration: 20 }
        }
    }
];

export class HabitsDB {
    constructor(initialData = []) {
        this.habits = initialData.length > 0 ? initialData : DEFAULT_HABITS;
    }

    getAll() {
        return this.habits;
    }

    getById(id) {
        return this.habits.find(h => h.id === id);
    }

    add(habit) {
        // Validation logic would go here
        this.habits.push(habit);
    }
}
