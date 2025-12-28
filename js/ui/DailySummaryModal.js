export class DailySummaryModal {
    constructor(id, summaryData, onClose) {
        this.id = id;
        this.data = summaryData;
        this.onClose = onClose;
    }

    render() {
        let modal = document.getElementById(this.id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = this.id;
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }

        const { message, stats } = this.data;

        // Calculate completion rate
        const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const color = rate >= 80 ? 'var(--accent-cyan)' : (rate >= 50 ? 'var(--accent-violet)' : '#fca5a5');

        modal.innerHTML = `
            <div class="modal-content glass-panel" style="max-width: 450px; text-align: center; position: relative; overflow: hidden;">
                <!-- Decorative Glow -->
                <div style="position: absolute; top: -50px; left: 0; width: 100%; height: 100px; background: radial-gradient(circle, ${color} 0%, transparent 70%); opacity: 0.2;"></div>

                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🌙</div>
                <h2 style="margin-bottom: 0.5rem; color: #fff;">Resumen del Día</h2>
                <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 2rem;">
                    Cierre de Ciclo
                </div>
                
                <!-- The AI Message -->
                <div style="
                    background: rgba(255,255,255,0.05); 
                    padding: 1.5rem; 
                    border-radius: 16px; 
                    border-left: 4px solid ${color};
                    text-align: left;
                    margin-bottom: 2rem;
                ">
                    <p style="font-size: 1.1rem; line-height: 1.6; color: #ececf1; font-style: italic;">
                        "${message}"
                    </p>
                </div>

                <!-- Mini Stats -->
                <div style="display: flex; justify-content: space-around; margin-bottom: 2rem; padding: 0 1rem;">
                    <div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${color};">${stats.completed}/${stats.total}</div>
                        <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted);">Hábitos</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #fff;">${stats.energy}%</div>
                        <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted);">Energía Inicial</div>
                    </div>
                </div>

                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2rem;">
                    Tu energía se reiniciará mañana. ¡Descansa!
                </p>

                <button id="btnCloseSummary" class="action-btn" style="width: 100%; background: #fff; color: #000; font-weight: bold;">
                    Cerrar el Día (Reset)
                </button>
            </div>
        `;

        // Bind Events
        modal.querySelector('#btnCloseSummary').onclick = () => {
            // Trigger fade out
            modal.style.opacity = '0';
            setTimeout(() => {
                this.onClose();
                this.close();
            }, 300);
        };

        // Show
        modal.classList.remove('hidden');
        // Trigger reflow for transition
        modal.offsetHeight;
        modal.style.opacity = '1';
    }

    close() {
        const modal = document.getElementById(this.id);
        if (modal) modal.remove();
    }
}

export function showDailySummary(data, onClose) {
    const modal = new DailySummaryModal('summary-modal', data, onClose);
    modal.render();
}
