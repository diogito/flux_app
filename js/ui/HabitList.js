export class HabitList {
    constructor(containerId, habits, context) {
        this.container = document.getElementById(containerId);
        this.habits = habits;
        this.context = context || 'maintenance'; // Fallback
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = this.habits.map(habit => {
            const variation = habit.levels[this.context];
            const isCompleted = false; // TODO: Connect to Store completion status

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
                    ">${variation.text}</p>
                </div>

                <div class="habit-meta" style="text-align: right;">
                    <span style="
                        display: block; 
                        font-size: 0.8rem; 
                        color: var(--text-muted); 
                        margin-bottom: 0.5rem;
                    ">${variation.duration} min</span>
                    
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
            `;
        }).join('');
    }
}
