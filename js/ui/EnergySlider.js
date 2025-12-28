import { EnergyEngine } from '../core/EnergyEngine.js';

export class EnergySlider {
    constructor(containerId, onComplete) {
        this.container = document.getElementById(containerId);
        this.onComplete = onComplete;
        this.value = 50;
        this.step = 'slider'; // 'slider' | 'journal'
        this.note = '';
    }

    render() {
        if (!this.container) return;

        if (this.step === 'slider') {
            this.renderSlider();
        } else {
            this.renderJournal();
        }
    }

    renderSlider() {
        this.container.innerHTML = `
            <div class="energy-slider-wrapper fade-in">
                <h2>¿Cómo está tu batería?</h2>
                
                <div class="slider-display">
                    <span id="sliderValue" class="slider-value">${this.value}%</span>
                </div>
                
                <div id="somatic-label">Estable • Respiración normal</div>

                <input type="range" id="sliderInput" min="1" max="100" value="${this.value}" class="slider-input">
                
                <div class="slider-labels">
                    <span>Supervivencia</span>
                    <span>Expansión</span>
                </div>

                <button id="btnStart">Siguiente</button>
            </div>
        `;

        this.attachSliderEvents();
        // Initial visual update
        this.updateVisuals(this.value);
    }

    renderJournal() {
        this.container.innerHTML = `
            <div class="energy-slider-wrapper fade-in">
                <h2>Contexto (Opcional)</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">¿Qué define tu energía hoy?</p>

                <div class="journal-tags" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 2rem;">
                    ${['Mala noche', 'Estrés', 'Tranquilidad', 'Motivado', 'Enfermo', 'Resaca', 'Ejercicio'].map(tag =>
            `<button class="tag-btn" style="
                            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); 
                            padding: 8px 16px; border-radius: 20px; color: white; cursor: pointer; transition: all 0.2s;
                        ">${tag}</button>`
        ).join('')}
                </div>

                <textarea id="journalNote" placeholder="Escribe una nota breve..." style="
                    width: 100%; max-width: 300px; height: 100px; 
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
                    border-radius: 12px; color: white; padding: 1rem; font-family: sans-serif;
                    margin-bottom: 2rem;
                "></textarea>

                <button id="btnConfirmJournal">Iniciar Día</button>
            </div>
        `;

        // Journal Events
        this.container.querySelectorAll('.tag-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.target.classList.toggle('active');
                e.target.style.background = e.target.classList.contains('active') ? 'var(--accent-violet)' : 'rgba(255,255,255,0.1)';
            };
        });

        document.getElementById('btnConfirmJournal').onclick = () => {
            const noteText = document.getElementById('journalNote').value;
            const tags = Array.from(this.container.querySelectorAll('.tag-btn.active')).map(b => b.innerText);

            // Format for persistence: "[Tag1, Tag2] Note text" (Legacy support in store if needed, but we prefer structured)
            // Passing (value, tags, noteText)
            if (this.onComplete) this.onComplete(this.value, tags, noteText);
        };
    }

    attachSliderEvents() {
        const slider = document.getElementById('sliderInput');

        slider.oninput = (e) => {
            this.value = parseInt(e.target.value);
            this.updateVisuals(this.value);
        };

        document.getElementById('btnStart').onclick = () => {
            this.step = 'journal';
            this.render();
        };
    }

    updateVisuals(val) {
        const display = document.getElementById('sliderValue');
        const somatic = document.getElementById('somatic-label');
        const slider = document.getElementById('sliderInput');

        if (display) display.textContent = `${val}%`;

        // Dynamic Color Logic
        let color = '#fff';
        if (val <= 30) color = 'var(--accent-cyan)'; // Survival
        if (val >= 70) color = 'var(--accent-violet)'; // Expansion

        if (display) display.style.color = color;
        if (slider) {
            slider.style.setProperty('--thumb-color', color);
            slider.style.boxShadow = `0 0 20px ${color}33`;
        }

        // Somatic Update
        if (somatic) {
            const label = EnergyEngine.getSomaticLabel(val);
            if (somatic.textContent !== label) {
                somatic.textContent = label;
                somatic.style.color = color;
            }
        }
    }
}
