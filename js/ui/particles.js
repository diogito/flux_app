/**
 * Dopamine Burst Effect (Lightweight Particle System)
 * Triggered when a user completes a habit.
 */
export function triggerBurst(x, y, color = '#00F0FF') {
    const particles = 30; // More particles
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < particles; i++) {
        const p = document.createElement('div');
        const angle = Math.random() * Math.PI * 2;
        const velocity = 60 + Math.random() * 120; // Faster explosion

        p.style.position = 'absolute';
        p.style.width = (Math.random() > 0.5 ? '8px' : '4px'); // Varied sizes
        p.style.height = p.style.width;
        p.style.background = color;
        p.style.borderRadius = '50%';
        p.style.boxShadow = `0 0 15px ${color}`; // Stronger glow for dark mode

        // Physics Animation
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800 + Math.random() * 300,
            easing: 'cubic-bezier(0, .9, .57, 1)',
        });

        container.appendChild(p);
    }

    // Cleanup
    setTimeout(() => {
        container.remove();
    }, 1000);
}
