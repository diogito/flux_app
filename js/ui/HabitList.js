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

        // Get completed IDs from global store (source of truth)
        // Get completed IDs from global store (source of truth)
        const completedIds = window.fluxStore ? (window.fluxStore.state.today.completedHabits || []) : [];

        // -- ADAPTIVE SCHEDULING (Sprint 10) --
        const sortedHabits = [...this.habits].sort((a, b) => {
            const durA = (a.levels[this.context] || a.levels['maintenance']).duration;
            const durB = (b.levels[this.context] || b.levels['maintenance']).duration;

            // Survival: Shortest First (Momentum)
            if (this.context === 'survival') return durA - durB;
            // Expansion: Longest First (Impact)
            if (this.context === 'expansion') return durB - durA;

            return 0; // Default
        });

        const html = sortedHabits.map(habit => {
            const variation = habit.levels[this.context] || habit.levels['maintenance'];
            const text = variation ? variation.text : habit.title;
            const duration = variation ? variation.duration : 0;
            // Determine dynamic color based on context
            const particleColor = this.context === 'survival' ? '#06b6d4' : '#8b5cf6';

            // Check state
            const isCompleted = completedIds.includes(habit.id);
            const btnStyle = isCompleted
                ? `background: ${particleColor}; border: 2px solid ${particleColor};`
                : `background: transparent; border: 2px solid var(--text-muted);`;

            const btnIcon = isCompleted
                ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                : ``;

            // Card Opacity/Dimming if done
            const cardOpacity = isCompleted ? 'opacity: 0.6;' : '';

            return `
            <div class="habit-card card-${this.context} fade-in" data-id="${habit.id}" style="
                padding: 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                ${cardOpacity}
            ">
                <div class="habit-icon" style="
                    font-size: 2rem;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">${habit.icon || '✨'}</div>

                <div class="habit-info" style="flex: 1;">
                    <h3 style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.2rem;">${habit.title}</h3>
                    <p style="
                        font-family: var(--font-display);
                        font-size: 1.2rem; 
                        color: var(--text-primary);
                        font-weight: 500;
                        text-decoration: ${isCompleted ? 'line-through' : 'none'};
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
                            cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                            ${btnStyle}
                        ">${btnIcon}</button>
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

            // 2. Card Tap Handle (Anywhere on the card)
            const card = e.target.closest('.habit-card');

            // Ignore if clicking Delete button explicitly
            if (e.target.closest('.delete-btn')) return;

            if (card) {
                const checkBtn = card.querySelector('.check-btn');
                // Prevent double triggering if they clicked the exact button, 
                // but the event bubble will hit this anyway. 
                // We'll trust the logic below.

                if (checkBtn) {
                    // Get coordinates of the BUTTON, not the click (for consistent particle source)
                    const rect = checkBtn.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    const color = checkBtn.dataset.color;

                    // Don't re-animate if already done? Maybe fun to re-animate.
                    // Using simpler logic: Only complete if not completed? 
                    // For now, let's allow "checking" it.

                    triggerBurst(x, y, color);

                    // Optimistic UI Update immediately
                    checkBtn.style.background = color;
                    checkBtn.style.border = `2px solid ${color}`;
                    checkBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

                    // Store Update
                    const id = card.dataset.id;
                    if (window.fluxStore) {
                        window.fluxStore.completeHabit(id);
                        setTimeout(() => {
                            // Re-render only chain? No, store update triggers full render usually.
                            // But we'll force chain refresh just in case.
                            const chainContainer = document.getElementById(`chain-${id}`);
                            if (chainContainer) new NeuralChain(id, chainContainer).render();
                        }, 100);
                    }
                }
            }
        };
    }
}
