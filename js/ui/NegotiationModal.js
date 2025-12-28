/**
 * NegotiationModal.js
 * The "Voice" of the AI. Appears when energy drops to Survival levels.
 * Explicitly compares the "Ideal Plan" vs the "Survival Plan".
 */

export function showNegotiationModal(habits, onConfirm, onOverride) {
    // 1. Create Modal Container
    const modal = document.createElement('div');
    modal.className = 'negotiation-modal confirm-animation';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; padding: 20px;
    `;

    // 2. Prepare Diff Content (Take top 2 habits as examples)
    const examples = habits.slice(0, 2).map(h => {
        const standard = h.levels['maintenance']?.text || h.title;
        const survival = h.levels['survival']?.text || "Mínimo viable";
        return `
            <div style="margin-bottom: 12px; font-size: 0.95rem; text-align: left;">
                <div style="color: var(--text-muted); text-decoration: line-through; margin-bottom: 4px;">❌ ${standard}</div>
                <div style="color: var(--accent-cyan); font-weight: bold;">✅ ${survival}</div>
            </div>
        `;
    }).join('');

    // 3. Inner HTML
    modal.innerHTML = `
        <div style="
            background: linear-gradient(145deg, #1a1a2e, #16213e);
            border: 1px solid var(--accent-cyan);
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.2);
            padding: 2rem; border-radius: 20px;
            max-width: 400px; width: 100%; text-align: center;
            color: #fff;
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔋📉</div>
            <h2 style="font-family: var(--font-display); margin-bottom: 0.5rem;">Batería Baja Detectada</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5;">
                Tu biología pide descanso. He negociado tus metas para mantener la cadena sin quemarte.
            </p>

            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 2rem;">
                ${examples}
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">+ Ajuste de todas las demás tareas</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="btn-accept" style="
                    background: var(--accent-cyan); color: #000; border: none;
                    padding: 14px; border-radius: 12px; font-weight: bold; font-size: 1rem;
                    cursor: pointer; transition: transform 0.2s;
                ">Aceptar Adaptación</button>
                
                <button id="btn-override" style="
                    background: transparent; color: var(--text-muted); border: 1px solid var(--text-muted);
                    padding: 12px; border-radius: 12px; font-size: 0.9rem;
                    cursor: pointer;
                ">No, puedo empujar (Forzar Mantenimiento)</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 4. Event Handlers
    document.getElementById('btn-accept').onclick = () => {
        modal.remove();
        onConfirm();
    };

    document.getElementById('btn-override').onclick = () => {
        modal.remove();
        onOverride();
    };
}
