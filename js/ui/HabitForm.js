export class HabitForm {
    constructor(modalId, onSubmit) {
        this.modalId = modalId;
        this.onSubmit = onSubmit;
    }

    render() {
        // Create modal if not exists
        let modal = document.getElementById(this.modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = this.modalId;
            modal.className = 'modal-overlay fade-in';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
                z-index: 1000; display: flex; justify-content: center; align-items: center;
            `;
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="
                background: var(--bg-card); padding: 2rem; border-radius: 20px;
                width: 90%; max-width: 400px; border: 1px solid var(--accent-violet);
                box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
            ">
                <h2 style="margin-bottom: 1.5rem; color: white;">Nuevo Hábito</h2>
                
                <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary)">¿Qué quieres lograr?</label>
                <input type="text" id="habitTitle" placeholder="Ej. Aprender Guitarra" style="
                    width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #333;
                    background: rgba(0,0,0,0.3); color: white; margin-bottom: 1.5rem;
                ">

                <div style="margin-bottom: 1rem; padding: 1rem; border-left: 2px solid var(--accent-blue); background: rgba(59, 130, 246, 0.1);">
                    <label style="font-size: 0.8rem; color: var(--accent-blue); text-transform: uppercase;">Modo Supervivencia (Mínimo)</label>
                    <input type="text" id="habitSurvival" placeholder="Ej. Tocar 1 acorde" style="
                        width: 100%; background: transparent; border: none; color: white; margin-top: 5px; border-bottom: 1px solid rgba(255,255,255,0.1);
                    ">
                </div>

                <div style="margin-bottom: 1.5rem; padding: 1rem; border-left: 2px solid var(--accent-cyan); background: rgba(6, 182, 212, 0.1);">
                    <label style="font-size: 0.8rem; color: var(--accent-cyan); text-transform: uppercase;">Modo Expansión (Ideal)</label>
                    <input type="text" id="habitExpansion" placeholder="Ej. Practicar 1 hora" style="
                        width: 100%; background: transparent; border: none; color: white; margin-top: 5px; border-bottom: 1px solid rgba(255,255,255,0.1);
                    ">
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button id="btnCancel" style="flex: 1; padding: 12px; background: transparent; border: 1px solid #333; color: #666; border-radius: 12px;">Cancelar</button>
                    <button id="btnSave" style="flex: 1; padding: 12px; background: var(--accent-violet); border: none; color: white; border-radius: 12px; font-weight: bold;">Crear</button>
                </div>
            </div>
        `;

        // Bind Events
        document.getElementById('btnCancel').addEventListener('click', () => this.close());
        document.getElementById('btnSave').addEventListener('click', () => this.save());
    }

    save() {
        const title = document.getElementById('habitTitle').value;
        const survival = document.getElementById('habitSurvival').value;
        const expansion = document.getElementById('habitExpansion').value;

        if (!title || !survival || !expansion) {
            alert("Por favor completa todos los campos para diseñar tu hábito.");
            return;
        }

        const newHabit = {
            id: `h_${Date.now()}`,
            title: title,
            category: 'custom',
            levels: {
                survival: { text: survival, duration: 5 }, // Default durations for now
                maintenance: { text: "Práctica Moderada", duration: 15 }, // Auto-fill middle
                expansion: { text: expansion, duration: 60 }
            }
        };

        this.onSubmit(newHabit);
        this.close();
    }

    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) modal.remove();
    }
}
