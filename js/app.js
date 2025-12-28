import { store } from './store.js';
import { EnergySlider } from './ui/EnergySlider.js';
import { HabitsDB } from './core/HabitsDB.js';
import { HabitList } from './ui/HabitList.js';
import { showNegotiationModal } from './ui/NegotiationModal.js';
import { showWeeklyReport } from './ui/WeeklyReportModal.js';
import { showSettings } from './ui/SettingsModal.js';
import { showDailySummary } from './ui/DailySummaryModal.js'; // [NEW] Summary UI
import { InsightEngine } from './core/InsightEngine.js';
import { NeuralCoreService } from './core/NeuralCore.js';
import { CloudCoreService } from './core/CloudCore.js';
import { AnalyticsDB } from './core/AnalyticsDB.js';
import { HabitForm } from './ui/HabitForm.js';
import { Supabase } from './core/SupabaseClient.js'; // [NEW] RAG Source

// Expose for Components
window.fluxStore = store;

console.log("Flux OS Booting...");

const app = document.getElementById('app');

function init() {
    // [SPRINT 25] Genesis Protocol
    if (!store.state.userProfile || !store.state.userProfile.onboardingCompleted) {
        console.log("🌌 Initiating Genesis Protocol...");
        import('./ui/GenesisModal.js').then(m => {
            m.showGenesisModal(() => {
                render();
                store.subscribe(render);
            });
        });
    } else {
        render();
        store.subscribe(render);
    }
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
                z-index: 10;
                position: relative;
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

                if (core) core.classList.add('thinking');

                // 3. Ask the AI (Edge First) + RAG (Memory)
                let history;
                try {
                    // [RAG] Try Cloud Memory first (20 items)
                    const cloudHistory = await Supabase.getHistory(20);
                    if (cloudHistory && cloudHistory.length > 0) {
                        history = cloudHistory.map(e => {
                            const date = new Date(e.timestamp).toLocaleDateString();
                            const p = e.data || {};
                            return `[${date}] Type: ${e.type} | Info: ${JSON.stringify(p)}`;
                        }).join('\n');
                        console.log("📜 RAG Context (Cloud):", history.length + " events");
                    } else {
                        throw new Error("No cloud history");
                    }
                } catch (ragErr) {
                    // [Fallback] Local Memory (5 items)
                    history = AnalyticsDB.getRecentEnergyContext(5);
                    console.log("📜 RAG Context (Local Fallback):", history);
                }

                // Helper to normalize analysis data
                const normalizeAnalysis = (raw) => {
                    // Check if it's nested (Cloud format)
                    if (raw && raw.analysis) return raw.analysis;
                    return raw;
                };

                const safeAnalysis = normalizeAnalysis(analysis);
                console.log("🧠 Normalized Decision:", safeAnalysis);

                // 4. THE NEGOTIATION (Sprint 24)
                if (val <= 35) { // Threshold for Survival
                    const db = new HabitsDB(window.fluxStore.state.habits);

                    showNegotiationModal(
                        db.getAll(),
                        async () => {
                            console.log("🤝 User accepted Survival Plan.");
                            store.setNeuralState(val, safeAnalysis, tags, note);
                            if (overlay) overlay.classList.add('hidden');
                            triggerVoiceWelcome(safeAnalysis.context);
                        },
                        async () => {
                            console.log("💪 User forced Maintenance Mode.");
                            store.setContextOverride('maintenance');
                            store.setNeuralState(val, { ...safeAnalysis, context: 'maintenance' }, tags, note);
                            if (overlay) overlay.classList.add('hidden');
                        }
                    );
                } else {
                    store.setNeuralState(val, safeAnalysis, tags, note);
                    if (overlay) overlay.classList.add('hidden');
                }
            };

            const handleAiError = async (err) => {
                console.warn("⚠️ Neural Core Failed. Attempting Cloud Bridge...", err);

                // -- CLOUD BRIDGE PROTOCOL --
                if (title) title.innerText = "Enlace Remoto";
                if (progress) {
                    progress.innerText = "⚠️ Error Local. Conectando Nube...";
                    progress.style.color = 'var(--accent-cyan)';
                }
                if (core) core.classList.add('thinking');

                try {
                    const cloudResponse = await CloudCoreService.analyzeState(val, tags, note, history);
                    console.log("☁️ Cloud Decision Raw:", cloudResponse);

                    // Unpack Cloud Response
                    const cloudAnalysis = cloudResponse.analysis || cloudResponse;
                    console.log("☁️ Cloud Analysis Unpacked:", cloudAnalysis);

                    if (val <= 35) {
                        const db = new HabitsDB(window.fluxStore.state.habits);
                        showNegotiationModal(db.getAll(),
                            () => {
                                store.setNeuralState(val, cloudAnalysis, tags, note);
                                if (overlay) overlay.classList.add('hidden');
                                triggerVoiceWelcome(cloudAnalysis.context);
                            },
                            () => {
                                store.setNeuralState(val, { ...cloudAnalysis, context: 'maintenance' }, tags, note);
                                if (overlay) overlay.classList.add('hidden');
                            }
                        );
                    } else {
                        store.setNeuralState(val, cloudAnalysis, tags, note);
                        if (overlay) overlay.classList.add('hidden');
                    }

                } catch (cloudErr) {
                    console.error("🔥 Total Failure (Edge + Cloud):", cloudErr);

                    if (progress) {
                        progress.style.color = 'var(--text-warning, #fca5a5)';
                        progress.innerText = "⚠️ Sin conexión. Activando Modo Manual...";
                    }
                    if (core) core.classList.remove('thinking');

                    window.fluxDisableNeural = true;

                    if (val <= 35) {
                        const db = new HabitsDB(window.fluxStore.state.habits);
                        showNegotiationModal(db.getAll(),
                            () => {
                                store.setEnergy(val, tags, note);
                                if (overlay) overlay.classList.add('hidden');
                                triggerVoiceWelcome('survival');
                            },
                            () => {
                                store.setContextOverride('maintenance');
                                store.setEnergy(val, tags, note);
                                if (overlay) overlay.classList.add('hidden');
                            }
                        );
                    } else {
                        setTimeout(() => {
                            store.setEnergy(val, tags, note);
                            if (overlay) overlay.classList.add('hidden');
                        }, 1500);
                    }
                }
            };

            // Voice Helper
            const triggerVoiceWelcome = (context) => {
                if (context === 'survival') {
                    setTimeout(() => {
                        const spoken = sessionStorage.getItem('flux_survival_spoken');
                        if (!spoken) {
                            // Visual Feedback
                            const avatar = document.getElementById('neural-avatar');
                            if (avatar) avatar.classList.add('speaking');

                            const msg = new SpeechSynthesisUtterance("Modo Supervivencia Activado. Solo lo esencial.");
                            msg.lang = 'es-ES';
                            msg.onend = () => {
                                if (avatar) avatar.classList.remove('speaking');
                            };
                            window.speechSynthesis.speak(msg);
                            sessionStorage.setItem('flux_survival_spoken', 'true');
                        }
                    }, 500);
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
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span id="context-badge" style="
                            color: var(--accent-cyan); 
                            text-transform: uppercase; 
                            font-size: 0.7rem; 
                            letter-spacing: 2px;
                            border: 1px solid var(--accent-cyan);
                            padding: 4px 8px;
                            border-radius: 4px;
                            display: inline-block;
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
                        <!-- Settings Gear -->
                        <button id="btnSettings" style="
                            background: none; 
                            border: none; 
                            color: var(--text-muted); 
                            cursor: pointer; 
                            opacity: 0.6;
                            padding: 0;
                            margin-bottom: 8px; 
                            font-size: 1rem;
                        ">⚙️</button>
                    </div>
                    <!-- [SPRINT 24] Dynamic Insight Header -->
                    <div style="display: flex; align-items: center;">
                        <div id="neural-avatar" class="mini-avatar"></div>
                        <h1 class="fade-in" style="font-size: 2rem; line-height: 1.1;">
                            ${(() => {
            const h = new Date().getHours();
            const c = state.today.energyContext;

            if (c === 'survival') return "Modo Refugio";
            if (c === 'expansion') return "A Conquistar";
            if (c === 'maintenance') return "Ritmo Constante";

            const name = state.userProfile.name || "Viajero";

            if (h < 12) return `Buenos Días, ${name}`;
            if (h < 20) return `Buenas Tardes, ${name}`;
            return `Buenas Noches, ${name}`;
        })()}
                        </h1>
                    </div>
                </div>
                <div class="battery-indicator" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <!-- [NEW] End of Day Button -->
                        <button id="btnEndDay" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.7;" title="Cerrar el día">🌙</button>

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
                        // [SPRINT 24] Voice Activation
                        NeuralCoreService.speak(encouragement);
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

    // Bind Settings Button
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            showSettings(
                // Export
                () => {
                    const data = {
                        profile: store.state.userProfile,
                        habits: store.state.habits,
                        history: AnalyticsDB.getAllEvents()
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `flux_data_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    showToast("✅ Datos exportados correctamente");
                },
                // Reset
                () => {
                    localStorage.clear();
                    window.location.reload();
                }
            );
        });
    }

    // [NEW] Bind End of Day - COMPLETE LOGIC
    const btnEndDay = document.getElementById('btnEndDay');
    if (btnEndDay) {
        btnEndDay.addEventListener('click', async () => {
            if (!confirm("¿Cerrar el día? Esto generará tu resumen y reiniciará tu energía para mañana.")) return;

            showToast("🌙 Generando resumen del día...");

            // Gather Data
            const profile = store.state.userProfile;
            const history = AnalyticsDB.getRecentEnergyContext(5);

            // [FIX] Correctly identify completed habits by checking ID against store
            const completedIds = store.state.today.completedHabits || [];
            const allHabits = db.getAll();
            const completedHabitsList = allHabits.filter(h => completedIds.includes(h.id));

            const dayData = {
                energyLevel: state.today.energyLevel,
                energyContext: state.today.energyContext,
                totalHabits: allHabits.length,
                completedHabits: completedHabitsList,
                note: state.today.note
            };

            // Call AI
            let message = "Descansa bien para mañana. Buen trabajo."; // Fallback
            try {
                // Try Local
                const localMsg = await NeuralCoreService.generateDailySummary(profile, dayData, history);
                if (localMsg) message = localMsg;

                // Try Cloud if Local failed
                if (!localMsg) {
                    const cloudMsg = await CloudCoreService.generateDailySummary(profile, dayData, history);
                    if (cloudMsg) message = cloudMsg;
                }
            } catch (e) { console.error("Summary error", e); }

            // Show Modal
            showDailySummary({
                message: message,
                stats: {
                    completed: dayData.completedHabits.length,
                    total: dayData.totalHabits,
                    energy: dayData.energyLevel
                }
            }, () => {
                // On Close/Reset:
                store.state.today.energyLevel = null;
                store.state.today.energyContext = null;
                store.state.habits.forEach(h => h.completed = false);

                store.save();
                window.location.reload();
            });
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
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}
