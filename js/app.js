import { store } from './store.js';
import { EnergySlider } from './ui/EnergySlider.js';
import { HabitsDB } from './core/HabitsDB.js';
import { HabitList } from './ui/HabitList.js';

console.log("Flux OS Booting...");

const app = document.getElementById('app');
// Initialize DB with stored habits or defaults
const db = new HabitsDB(store.state.habits);

function init() {
    render();
    store.subscribe(render);
}

function render(state) {
    const s = state || store.state;

    // Router Logic
    if (s.today.energyLevel === null) {
        if (!document.getElementById('energy-view')) {
            renderCheckIn();
        }
    } else {
        renderDashboard(s);
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

function renderDashboard(state) {
    // Avoid full re-render if unnecessary (MVP: Always re-render)
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

    // Render Habits List Component
    // Security check: ensure db exists
    if (!state.today.energyContext) return; // Should not happen if level is set

    const list = new HabitList('habits-container', db.getAll(), state.today.energyContext);
    list.render();

    // Bind Reset
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            store.resetDay();
        });
    }
}

// Start
init();
