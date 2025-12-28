import { store } from './store.js';
import { EnergySlider } from './ui/EnergySlider.js';
import { HabitsDB } from './core/HabitsDB.js';
import { HabitList } from './ui/HabitList.js';

// Expose for Components
window.fluxStore = store;

import { HabitForm } from './ui/HabitForm.js'; // Import the new Studio

console.log("Flux OS Booting...");

const app = document.getElementById('app');

function init() {
    render();
    store.subscribe(render);
}

function render(state) {
    const s = state || store.state;
    // We recreate DB on every render to ensure it has latest habits from store
    // This is not efficient for large apps but fine for MVP
    const db = new HabitsDB(s.habits);

    // Router Logic
    if (s.today.energyLevel === null) {
        if (!document.getElementById('energy-view')) {
            renderCheckIn();
        }
    } else {
        renderDashboard(s, db); // Pass DB to dashboard
    }
}

function renderCheckIn() {
    // Clean slate for Check-in
    app.innerHTML = '<div id="energy-view" class="view-center"></div>';

    const slider = new EnergySlider('energy-view', (val) => {
        store.setEnergy(val);
    });

    slider.render();
}

function renderDashboard(state, db) {
    // Basic innerHTML patch
    app.innerHTML = `
        <div class="view-dashboard fade-in">
            <header style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <span id="context-badge" style="
                        color: var(--accent-cyan); 
                        text-transform: uppercase; 
                        font-size: 0.7rem; 
                        letter-spacing: 2px;
                        border: 1px solid var(--accent-cyan);
                        padding: 4px 8px;
                        border-radius: 4px;
                        display: inline-block;
                        margin-bottom: 8px;
                    ">Modo ${state.today.energyContext}</span>
                    <h1>Hoy</h1>
                </div>
                <div class="battery-indicator" style="text-align: right;">
                    <span style="font-size: 1.5rem; font-weight: bold;">${state.today.energyLevel}%</span>
                    <br>
                    <small style="color: var(--text-muted);">Batería</small>
                </div>
            </header>

            <div id="habits-container"></div>
            
            <!-- STUDIO ACTION BUTTON (Floating) -->
            <button id="btnAddHabit" style="
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: var(--accent-violet);
                box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
            ">+</button>

            <button id="btnReset" style="
                margin-top: 3rem; 
                background: transparent; 
                border: 0; 
                color: var(--text-muted); 
                text-decoration: underline; 
                cursor: pointer;
                width: 100%;
                text-align: center;
                font-size: 0.8rem;
            ">Reiniciar Día (Demo)</button>
        </div>
    `;

    // Render Habits List
    if (!state.today.energyContext) return;

    // List Render with Delete Callback
    const list = new HabitList(
        'habits-container',
        db.getAll(),
        state.today.energyContext,
        (id) => {
            console.log("Removing habit:", id);
            store.removeHabit(id);
        }
    );
    list.render();

    // Bind Add Button (Opens Modal)
    document.getElementById('btnAddHabit').addEventListener('click', () => {
        const form = new HabitForm('habit-modal', (newHabit) => {
            console.log("Saving new habit:", newHabit);
            store.addHabit(newHabit);
        });
        form.render();
    });

    // Bind Reset
    document.getElementById('btnReset').addEventListener('click', () => {
        store.resetDay();
    });
}

// Start
init();
