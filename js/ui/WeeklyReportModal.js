import { WeeklyAnalysis } from '../core/WeeklyAnalysis.js';

export function showWeeklyReport() {
    const report = WeeklyAnalysis.generateReport();

    // Create Modal Element
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fade-in';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 2000;
    `;

    modal.innerHTML = `
        <div class="modal-card scale-in" style="
            background: rgba(20, 20, 30, 0.95);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 2rem;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            text-align: center;
        ">
            <h2 style="margin-bottom: 0.5rem;">📊 Pulso Semanal</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">${report.period}</p>

            <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--accent-violet);">${report.avgEnergy}%</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Energía Promedio</div>
                </div>
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--accent-cyan);">${report.completions}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Hábitos Completados</div>
                </div>
            </div>

            <div class="insight-box" style="
                text-align: left;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
                border-left: 3px solid var(--accent-violet);
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 2rem;
            ">
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 0.5rem;">Flux Insight</div>
                <p style="margin: 0; line-height: 1.5; font-size: 0.95rem;">${report.insight}</p>
            </div>

            <button id="btnCloseReport" style="
                width: 100%;
                padding: 1rem;
                background: white;
                color: black;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
            ">Cerrar</button>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnCloseReport').onclick = () => {
        modal.remove();
    };

    // Close on backdrop tap
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}
