import { store } from './store.js';
import { EnergySlider } from './ui/EnergySlider.js';
import { HabitsDB } from './core/HabitsDB.js';
import { HabitList } from './ui/HabitList.js';
import { showNegotiationModal } from './ui/NegotiationModal.js';
import { showWeeklyReport } from './ui/WeeklyReportModal.js';
import { InsightEngine } from './core/InsightEngine.js';
import { NeuralCoreService } from './core/NeuralCore.js';

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

    // 0. AI Forecast Check
    const forecast = InsightEngine.generateForecast();
    let forecastHtml = '';

    if (forecast) {
        const color = forecast.type === 'warning' ? 'var(--accent-orange, #f97316)' : 'var(--accent-violet)';
        const icon = forecast.type === 'warning' ? '🛡️' : '🚀';

        forecastHtml = `
            <div class="fade-in-up" style="
                margin-bottom: 2rem; 
                background: rgba(255,255,255,0.05); 
                border-left: 3px solid ${color};
                padding: 1rem; 
                border-radius: 8px;
                text-align: left;
                width: 100%;
                display: flex;
                gap: 12px;
                align-items: center;
            ">
                <span style="font-size: 1.5rem;">${icon}</span>
                <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px;">Flux Insight</div>
                    <div style="font-size: 0.9rem; color: #fff; line-height: 1.4;">${forecast.message}</div>
                </div>
            </div>
        `;
    }

    const slider = new EnergySlider('energy-view', async (val, tags, note) => {
        // 1. Show Neural Interface
        const overlay = document.getElementById('neural-status');
        const progress = document.getElementById('neural-progress');
        overlay.style.display = 'flex';

        try {
            // 2. Wake up the Brain (Lazy Load)
            await NeuralCoreService.init((msg) => {
                // Humanize the technical logs
                let friendlyMsg = "Conectando...";
                if (msg.includes("Fetching")) friendlyMsg = "Descargando conocimiento... (Solo la 1ª vez)";
                if (msg.includes("Loading")) friendlyMsg = "Cargando modelo neuronal...";
                if (msg.includes("completed")) friendlyMsg = "Córtex listo.";

                // Keep percentage if present
                const percent = msg.match(/\[.*?\]/);
                if (percent) friendlyMsg += ` ${percent[0]}`;

                progress.innerText = friendlyMsg;
            });

            progress.innerText = "Analizando psicometría...";

            // 3. Ask the AI
            const analysis = await NeuralCoreService.analyzeState(val, tags, note);
            console.log("🧠 Neural Decision:", analysis);

            // 4. Commit to Store
            // We pass the AI's decision directly, bypassing the rigid EnergyEngine rules
            store.setNeuralState(val, analysis);

        } catch (err) {
            console.error("Neural Failure:", err);
            // Show specific error for debugging (e.g. "WebGPU not supported")
            alert(`Error de Córtex: ${err.message || err}. Usando modo manual.`);
            store.setEnergy(val, tags, note); // Fallback to heuristic
        } finally {
            overlay.style.display = 'none';
        }
    });

    slider.render();

    // Post-render Injection of Forecast
    if (forecastHtml) {
        const container = document.getElementById('energy-view');
        // We inject it into the wrapper created by EnergySlider
        const wrapper = container.querySelector('.energy-slider-wrapper');
        if (wrapper) {
            const temp = document.createElement('div');
            temp.innerHTML = forecastHtml;
            // Insert after the H2
            wrapper.insertBefore(temp.firstElementChild, wrapper.querySelector('h2').nextElementSibling);
        }
    }
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
                <div class="battery-indicator" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button id="btnWeeklyReport" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.8;">📊</button>
                        <span style="font-size: 1.5rem; font-weight: bold;">${state.today.energyLevel}%</span>
                    </div>
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

    // Bind Weekly Report
    const btnReport = document.getElementById('btnWeeklyReport');
    if (btnReport) {
        btnReport.addEventListener('click', () => {
            showWeeklyReport();
        });
    }
}

// Start
init();
