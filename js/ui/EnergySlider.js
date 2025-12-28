import { EnergyEngine } from '../core/EnergyEngine.js';

export class EnergySlider {
    constructor(containerId, onCommit) {
        this.container = document.getElementById(containerId);
        this.onChange = onCommit;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="energy-slider-wrapper fade-in">
                <h2>¿Cómo está tu batería?</h2>
                
                <div class="slider-display">
                    <span id="sliderValue" class="slider-value">50%</span>
                </div>
                
                <div id="somatic-label">Estable • Respiración normal</div>

                <input type="range" id="sliderInput" min="1" max="100" value="50" class="slider-input">
                
                <div class="slider-labels">
                    <span>Supervivencia</span>
                    <span>Expansión</span>
                </div>

                <!-- Guidance for user -->
                <p style="margin-top: 2rem; color: var(--text-muted); font-size: 0.8rem; max-width: 300px; margin-left: auto; margin-right: auto;">
                    Escucha a tu cuerpo. La IA ajustará tus hábitos según tu respuesta.
                </p>
                
                <button id="btnStart">Iniciar Día</button>
            </div>
        `;

        // Logic
        const slider = document.getElementById('sliderInput');
        const display = document.getElementById('sliderValue');
        const somatic = document.getElementById('somatic-label');
        const btn = document.getElementById('btnStart');

        // Initial State
        this.updateVisuals(slider.value, display, slider, somatic);

        // Event: Input (Drag)
        slider.addEventListener('input', (e) => {
            this.updateVisuals(e.target.value, display, slider, somatic);
        });

        // Event: Change (Release) - Commit value
        slider.addEventListener('change', (e) => {
            if (this.onChange) this.onChange(parseInt(e.target.value));
        });

        // Event: Button Click
        btn.addEventListener('click', () => {
            // Ensure final value is committed if not already
            if (this.onChange) this.onChange(parseInt(slider.value));
        });
    }

    updateVisuals(val, display, slider, somatic) {
        display.textContent = `${val}%`;

        // Dynamic Color Logic
        let color = '#fff';
        if (val <= 30) color = 'var(--accent-cyan)'; // Survival
        if (val >= 70) color = 'var(--accent-violet)'; // Expansion

        display.style.color = color;
        slider.style.setProperty('--thumb-color', color);
        slider.style.boxShadow = `0 0 20px ${color}33`; // Add glow with opacity

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
