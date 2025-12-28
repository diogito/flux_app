export class SettingsModal {
    constructor(id, onExport, onReset) {
        this.id = id;
        this.onExport = onExport;
        this.onReset = onReset;
    }

    render() {
        // Create Modal Wrapper
        let modal = document.getElementById(this.id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = this.id;
            modal.className = 'modal-overlay hidden';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content glass-panel" style="max-width: 400px; text-align: center;">
                <h2 style="margin-bottom: 1.5rem; color: var(--text-primary);">Ajustes</h2>
                
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">📦 Tus Datos</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
                            Eres dueño de tu historia. Descarga una copia completa de tus registros.
                        </p>
                        <button id="btnExport" class="action-btn" style="width: 100%; background: var(--accent-cyan); color: #000;">
                            📥 Exportar JSON
                        </button>
                    </div>

                    <div style="background: rgba(255, 50, 50, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255, 50, 50, 0.2);">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: #fca5a5;">🔥 Zona de Peligro</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
                            Borra todo el progreso y reinicia la aplicación a estado de fábrica.
                        </p>
                        <button id="btnReset" class="action-btn" style="width: 100%; background: rgba(255, 50, 50, 0.2); color: #fca5a5; border: 1px solid #fca5a5;">
                            🗑️ Borrar Todo
                        </button>
                    </div>

                </div>

                <button id="btnCloseSettings" style="margin-top: 2rem; background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline;">
                    Cerrar
                </button>
            </div>
        `;

        // Bind Events
        modal.querySelector('#btnExport').onclick = () => {
            this.onExport();
            this.close();
        };

        modal.querySelector('#btnReset').onclick = () => {
            if (confirm("⚠️ ¿Estás seguro? Esto borrará TODOS tus hábitos y estadísticas para siempre.")) {
                this.onReset();
                this.close();
            }
        };

        modal.querySelector('#btnCloseSettings').onclick = () => this.close();
        modal.classList.remove('hidden');
    }

    close() {
        const modal = document.getElementById(this.id);
        if (modal) modal.classList.add('hidden');
    }
}

// Singleton helper
export function showSettings(onExport, onReset) {
    const modal = new SettingsModal('settings-modal', onExport, onReset);
    modal.render();
}
