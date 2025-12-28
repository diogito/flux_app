export class FocusSession {
    constructor(habit, onComplete) {
        this.habit = habit;
        this.onComplete = onComplete;
        this.duration = this.getDuration();
        this.elapsed = 0;
        this.timer = null;

        // Create DOM immediately
        this.overlay = document.createElement('div');
        this.overlay.className = 'focus-overlay';
        document.body.appendChild(this.overlay);
    }

    getDuration() {
        // Find current context duration or default to 0
        // We need the context from somewhere... assumes the habit object has context-specific levels already or we access store?
        // Actually, HabitList passed the *full* habit object.
        // Let's assume we want to show a generic timer or count-up if no duration.
        // For MVP, just count UP if 0, count DOWN if > 0.
        // But we don't know the *current* context here easily unless passed.
        // Let's just track Elapsed Time for simplicity (Zen Mode).
        return 0;
    }

    start() {
        this.render();
        // Trigger reflow
        this.overlay.offsetHeight;
        this.overlay.classList.add('active');

        this.startTime = Date.now();
        this.timer = setInterval(() => this.tick(), 1000);
    }

    tick() {
        this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const timerDisplay = this.overlay.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.innerText = this.formatTime(this.elapsed);
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    close() {
        clearInterval(this.timer);
        this.overlay.classList.remove('active');
        setTimeout(() => {
            this.overlay.remove();
        }, 500);
    }

    render() {
        this.overlay.innerHTML = `
            <button class="btn-zen-exit">×</button>
            
            <div style="text-align: center; margin-bottom: 2rem; color: #fff;">
                <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: #888;">Focus Mode</div>
                <h1 style="font-weight: 300; margin: 0.5rem 0;">${this.habit.title}</h1>
            </div>

            <div class="breathing-circle">
                <span class="timer-display">00:00</span>
            </div>

            <div class="focus-actions">
                <button class="btn-zen-complete">Hecho</button>
            </div>
        `;

        // Bindings
        this.overlay.querySelector('.btn-zen-exit').onclick = () => this.close();
        this.overlay.querySelector('.btn-zen-complete').onclick = () => {
            if (navigator.vibrate) navigator.vibrate(50); // Haptic click
            this.close();
            this.onComplete(this.habit.id);
        };
    }
}
