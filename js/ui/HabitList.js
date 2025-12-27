import { triggerBurst } from './particles.js';

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

                triggerBurst(x, y, color);

                // Toggle Visual State (Mockup)
                checkBtn.style.background = color;
                checkBtn.style.border = `2px solid ${color}`;
            }
        };
    }
}
