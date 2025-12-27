/**
 * Dopamine Burst Effect (Lightweight Particle System)
 * Triggered when a user completes a habit.
 */
export function triggerBurst(x, y, color = '#00F0FF') {
    const particles = 15;
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
        const velocity = 50 + Math.random() * 100;

        p.style.position = 'absolute';
        p.style.width = '6px';
        p.style.height = '6px';
        p.style.background = color;
        p.style.borderRadius = '50%';
        p.style.boxShadow = `0 0 10px ${color}`;

        // Physics Animation
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600 + Math.random() * 200,
            easing: 'cubic-bezier(0, .9, .57, 1)',
        });

        container.appendChild(p);
    }

    // Cleanup
    setTimeout(() => {
        container.remove();
    }, 1000);
}
