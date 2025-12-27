export class HabitList {
    constructor(containerId, habits, context, onDelete) {
        this.container = document.getElementById(containerId);
        this.habits = habits;
        this.context = context || 'maintenance';
        this.onDelete = onDelete; // Callback for deletion
    }

    render() {
        if (!this.container) return;

        const html = this.habits.map(habit => {
            const variation = habit.levels[this.context] || habit.levels['maintenance'];
            // Safety check for variation existence
            const text = variation ? variation.text : habit.title;
            const duration = variation ? variation.duration : 0;

            return `
            <div class="habit-card fade-in" data-id="${habit.id}" style="
                background: var(--bg-card);
                padding: 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                border-radius: var(--radius-md);
                border: 1px solid rgba(255,255,255,0.05);
                transition: transform 0.2s;
            ">
                <div class="habit-icon" style="
                    font-size: 2rem;
                    background: rgba(255,255,255,0.05);
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
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
                    
                        <button class="check-btn" style="
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
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('¿Eliminar hábito?')) {
                    if (this.onDelete) this.onDelete(id);
                }
            }
        };
    }
}
