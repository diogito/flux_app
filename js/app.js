import { store } from './store.js';
import { EnergySlider } from './ui/EnergySlider.js';
import { HabitsDB } from './core/HabitsDB.js';
import { HabitList } from './ui/HabitList.js';
import { showNegotiationModal } from './ui/NegotiationModal.js';
import { showWeeklyReport } from './ui/WeeklyReportModal.js';
import { InsightEngine } from './core/InsightEngine.js';
import { NeuralCoreService } from './core/NeuralCore.js';
import { CloudCoreService } from './core/CloudCore.js'; // [NEW] Cloud Bridge
import { AnalyticsDB } from './core/AnalyticsDB.js'; // [FIX] Missing Import

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
    const db = new HabitsDB(s.habits);

    // View Transition API (Native Chrome/Edge)
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            updateDOM(s, db);
        });
    } else {
        updateDOM(s, db);
    }
}

function updateDOM(s, db) {
    // Router Logic
    if (s.today.energyLevel === null) {
        if (!document.getElementById('energy-view')) {
            renderCheckIn();
        }
    } else {
        renderDashboard(s, db); // Pass DB to dashboard
        // Re-inject Synapse if coming from neural loading? 
        // No, overlay handles itself.
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
                justify-content: center;
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
        // Fallback Check: If AI crashed before, don't try again this session
        if (window.fluxDisableNeural) {
            console.log("Neural Core disabled due to previous error. Using fallback.");
            store.setEnergy(val, tags, note);
            return;
        }

        // 1. Show Neural Interface
        const overlay = document.getElementById('neural-status');
        const progress = document.getElementById('neural-progress');
        const title = document.getElementById('neural-title'); // Assuming this exists in index.html now
        const core = document.querySelector('.synapse-core');

        if (overlay) overlay.classList.remove('hidden');
        if (progress) {
            progress.innerText = "Conectando córtex...";
            progress.style.color = 'var(--text-muted)';
        }
        if (core) core.classList.remove('thinking');

        try {
            // Allow UI to paint the overlay before freezing the thread
            setTimeout(async () => {
                try {
                    // 2. Wake up the Brain (Lazy Load)
                    await NeuralCoreService.init((msg) => {
                        // Humanize the technical logs
                        let friendlyMsg = "Conectando...";
                        if (msg.includes("Fetching")) friendlyMsg = "Descargando conocimiento... (Solo la 1ª vez)";
                        if (msg.includes("Loading")) {
                            friendlyMsg = "Cargando modelo neuronal (Llama 3)...";
                            if (core) core.classList.add('thinking');
                        }
                        if (msg.includes("completed")) friendlyMsg = "Córtex listo.";

                        // Keep percentage if present
                        const percent = msg.match(/\[.*?\]/);
                        if (percent) friendlyMsg += ` ${percent[0]}`;

                        if (progress) progress.innerText = friendlyMsg;
                    });

                    await proceedWithAnalysis();
                } catch (e) { handleAiError(e); }
            }, 50);

            // Split logic to avoid nesting hell
            const proceedWithAnalysis = async () => {
                if (progress) progress.innerText = "Analizando psicometría...";
                if (title) title.innerText = "Procesando";
                if (core) core.classList.add('thinking');

                // 3. Ask the AI (Edge First) + RAG (Memory)
                const history = AnalyticsDB.getRecentEnergyContext(5); // Last 5 days
                console.log("📜 RAG Context:", history);

                const analysis = await NeuralCoreService.analyzeState(val, tags, note, history);
                console.log("🧠 Neural Decision:", analysis);

                // 4. Commit to Store
                store.setNeuralState(val, analysis, tags, note);
                if (overlay) overlay.classList.add('hidden');
            };

            const handleAiError = async (err) => {
                console.warn("⚠️ Neural Core Failed. Attempting Cloud Bridge...", err);

                // -- CLOUD BRIDGE PROTOCOL --
                if (title) title.innerText = "Enlace Remoto";
                if (progress) {
                    progress.innerText = "⚠️ Error Local. Conectando Nube...";
                    progress.style.color = 'var(--accent-cyan)'; // Blue for Cloud
                }
                if (core) core.classList.add('thinking');

                try {
                    // 3b. Ask the Cloud (Plan B)
                    const history = AnalyticsDB.getRecentEnergyContext(5);
                    const cloudAnalysis = await CloudCoreService.analyzeState(val, tags, note, history);
                    console.log("☁️ Cloud Decision:", cloudAnalysis);

                    store.setNeuralState(val, cloudAnalysis, tags, note);
                    if (overlay) overlay.classList.add('hidden');

                } catch (cloudErr) {
                    console.error("🔥 Total Failure (Edge + Cloud):", cloudErr);

                    // -- TOTAL FALLBACK (Heuristic) --
                    if (progress) {
                        progress.style.color = 'var(--text-warning, #fca5a5)';
                        progress.innerText = "⚠️ Sin conexión. Activando Modo Manual...";
                    }
                    if (core) core.classList.remove('thinking');

                    window.fluxDisableNeural = true; // Stop trying

                    setTimeout(() => {
                        store.setEnergy(val, tags, note);
                        if (overlay) overlay.classList.add('hidden');
                    }, 1500);
                }
            };

        } catch (err) {
            // This catch block might not catch async errors inside setTimeout, handled by handleAiError
            console.error("Unexpected error in slider callback:", err);
        }
    });

    slider.render();

    // Post-render Injection of Forecast
    if (forecastHtml) {
        const container = document.getElementById('energy-view');
        const wrapper = container.querySelector('.energy-slider-wrapper');
        if (wrapper) {
            const temp = document.createElement('div');
            temp.innerHTML = forecastHtml;
            wrapper.insertBefore(temp.firstElementChild, wrapper.querySelector('h2').nextElementSibling);
        }
    }
}

function renderDashboard(state, db) {
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
        },
        async (id) => {
            console.log("Completing habit:", id);

            // 1. Get Habit Info BEFORE completing (so we have title)
            const habit = db.getAll().find(h => h.id === id);

            // 2. Optimistic Update
            store.completeHabit(id);

            // 3. AI Coach Trigger (Hybrid: Local -> Cloud)
            if (habit) {
                try {
                    const energy = state.today.energyLevel;
                    console.log(`🧠 AI Coach: Analyzing "${habit.title}" at ${energy}% energy...`);

                    // A. Try Local Cortex
                    let encouragement = await NeuralCoreService.generateMicroCoaching(habit.title, energy);

                    // B. Fallback to Cloud Bridge
                    if (!encouragement) {
                        console.log("⚠️ Local Coach unavailable. Calling Mothership...");
                        encouragement = await CloudCoreService.generateMicroCoaching(habit.title, energy);
                    }

                    if (encouragement) {
                        showToast(encouragement);
                    }
                } catch (err) {
                    console.warn("AI Coach failed:", err);
                }
            }
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

// --- UI Utilities ---
function showToast(msg) {
    let toast = document.querySelector('.flux-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'flux-toast';
        document.body.appendChild(toast);
    }

    toast.innerText = msg;

    // Animation Frame to ensure transition
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}
