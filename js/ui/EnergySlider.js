export class EnergySlider {
    constructor(containerId, onCommit) {
        this.container = document.getElementById(containerId);
        this.onCommit = onCommit;
        this.value = 50;
    }

    render() {
        this.container.innerHTML = `
            <div class="energy-slider-container fade-in">
                <span id="energyDisplay" class="energy-value">50%</span>
                <input type="range" min="0" max="100" value="50" class="energy-slider" id="sliderInput">
                
                <p id="energyLabel" style="margin-top: 1rem; color: var(--text-secondary); height: 1.5rem;">Modo Mantenimiento</p>

                <button id="btnCommit" style="
                    margin-top: 3rem;
                    background: var(--bg-card);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 1rem 3rem;
                    border-radius: var(--radius-full);
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                ">Iniciar Día</button>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const slider = document.getElementById('sliderInput');
        const display = document.getElementById('energyDisplay');
        const label = document.getElementById('energyLabel');
        const btn = document.getElementById('btnCommit');

        // Initial Feedback
        this.updateFeedback(this.value, label, slider);

        // Real-time updates
        slider.addEventListener('input', (e) => {
            this.value = parseInt(e.target.value);
            display.textContent = `${this.value}%`;
            this.updateFeedback(this.value, label, slider);
        });

        // Commit logic
        btn.addEventListener('click', () => {
            this.onCommit(this.value);
        });
    }

    updateFeedback(val, labelNode, sliderNode) {
        // We could import EnergyEngine here, or keep it responsive/client-side only.
        // For 60fps smoothness during drag, keeping it self-contained is effective.

        let color, text;
        if (val <= 35) {
            color = 'var(--accent-blue)';
            text = "Modo Supervivencia 🛡️";
        } else if (val <= 70) {
            color = 'var(--accent-violet)';
            text = "Modo Mantenimiento ⚖️";
        } else {
            color = 'var(--accent-cyan)';
            text = "Modo Expansión 🚀";
        }

        labelNode.textContent = text;
        labelNode.style.color = color;
        sliderNode.style.boxShadow = `0 0 20px ${color}`;
    }
}
