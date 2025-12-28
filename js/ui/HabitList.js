import { triggerBurst } from './particles.js';
import { NeuralChain } from './NeuralChain.js';

export class HabitList {
    constructor(containerId, habits, context, onDelete) {
        this.container = document.getElementById(containerId);
        this.habits = habits; // Note: In a real app, we'd need reactive status here
        this.context = context || 'maintenance';
        this.onDelete = onDelete;
    }

    render() {
        if (!this.container) return;

        const html = this.habits.map(habit => {
            const variation = habit.levels[this.context] || habit.levels['maintenance'];
            const text = variation ? variation.text : habit.title;
            const duration = variation ? variation.duration : 0;
            // Determine dynamic color based on context for particles
            const particleColor = this.context === 'survival' ? '#06b6d4' : '#8b5cf6';

            return `
            <div class="habit-card card-${this.context} fade-in" data-id="${habit.id}" style="
                /* Removed inline styles that conflict with immersion.css */
                padding: 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                /* Transition handled by CSS class */
            ">
                <div class="habit-icon" style="
                    font-size: 2rem;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    /* BorderRadius handled by CSS class */
                ">${habit.icon || '✨'}</div>

                <div class="habit-info" style="flex: 1;">
                    <h3 style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.2rem;">${habit.title}</h3>
                    <p style="
                        font-family: var(--font-display);
                        font-size: 1.2rem; 
                        color: var(--text-primary);
                        font-weight: 500;
                    ">${text}</p>
                    
                    <!-- Neural Chain Container -->
                    <div id="chain-${habit.id}" class="neural-chain-container"></div>
                </div>

                <div class="habit-meta" style="text-align: right;">
                    <span style="
                        display: block; 
                        font-size: 0.8rem; 
                        color: var(--text-muted); 
                        margin-bottom: 0.5rem;
                    ">${duration} min</span>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                         <!-- Delete (Trash) -->
                         <button class="delete-btn" data-id="${habit.id}" style="
                            width: 32px; height: 32px; border-radius: 50%;
                            border: none; background: rgba(255,50,50,0.1); color: #ff5555;
                            cursor: pointer; display: flex; align-items: center; justify-content: center;
                        ">🗑</button>
                    
                        <button class="check-btn" data-color="${particleColor}" style="
                            width: 32px; 
                            height: 32px; 
                            border-radius: 50%;
                            border: 2px solid var(--text-muted);
                            background: transparent;
                            cursor: pointer;
                        "></button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        this.container.innerHTML = html;

        // Mount Neural Chains
        this.habits.forEach(habit => {
            const el = document.getElementById(`chain-${habit.id}`);
            if (el) {
                new NeuralChain(habit.id, el).render();
            }
        });

        this.attachEvents();
    }

    attachEvents() {
        // Event Delegation
        this.container.onclick = (e) => {
            // Delete Handle
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('¿Eliminar hábito?')) {
                    if (this.onDelete) this.onDelete(id);
                }
                return;
            }

            // Burst Handle
            const checkBtn = e.target.closest('.check-btn');
            if (checkBtn) {
                // Get click coordinates
                const rect = checkBtn.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                const color = checkBtn.dataset.color;

                // 1. Trigger Visuals
                triggerBurst(x, y, color);
                checkBtn.style.background = color;
                checkBtn.style.border = `2px solid ${color}`;
                checkBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;

                // 2. Trigger Logic (Store + Analytics)
                // We need the ID. The button is sibling to detail but inside the card which has data-id
                const card = checkBtn.closest('.habit-card');
                if (card) {
                    const id = card.dataset.id;
                    if (window.fluxStore) { // Assuming global expose or import
                        window.fluxStore.completeHabit(id);
                        // Re-render chain after slight delay or reactive update? 
                        // For now, let's just re-render this specific chain instance if we had access, 
                        // but simpler to let the store update trigger a full re-render eventually.
                        // But since we are here:
                        setTimeout(() => {
                            const chainContainer = document.getElementById(`chain-${id}`);
                            if (chainContainer) new NeuralChain(id, chainContainer).render();
                        }, 100);
                    }
                }
            }
        };
    }
}
