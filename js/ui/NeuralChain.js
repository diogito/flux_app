/**
 * Neural Chain Component
 * Visualizes the history of a habit as a connected "synaptic" chain.
 * Color Coding:
 * - Cyan (Survival): You kept the habit alive on a hard day.
 * - Violet (Expansion): You pushed limits on a good day.
 * - Gray (Ghost): Missed day.
 */
import { AnalyticsDB } from '../core/AnalyticsDB.js';

export class NeuralChain {
    constructor(habitId, container) {
        this.habitId = habitId;
        this.container = container;
    }

    render() {
        const history = AnalyticsDB.getChainData(this.habitId, 7); // Last 7 days (mocked for now as just last 7 events)

        let html = '<div class="neural-chain" style="display: flex; align-items: center; gap: 4px; margin-top: 8px;">';

        // We'll reverse history to show Time -> Present
        const chronological = [...history].reverse();

        chronological.forEach((event, index) => {
            const context = event.payload.contextUsed || 'maintenance';
            let color = '#555'; // Ghost/Default

            if (context === 'survival') color = 'var(--accent-cyan)';
            if (context === 'expansion') color = 'var(--accent-violet)';
            if (context === 'maintenance') color = 'var(--text-muted)'; // or white

            const isLast = index === chronological.length - 1;
            const size = isLast ? '10px' : '6px';
            const opacity = isLast ? '1' : '0.6';
            const glow = isLast ? `box-shadow: 0 0 8px ${color};` : '';

            html += `
                <div class="node" title="${new Date(event.timestamp).toLocaleDateString()}" style="
                    width: ${size};
                    height: ${size};
                    border-radius: 50%;
                    background-color: ${color};
                    opacity: ${opacity};
                    ${glow}
                    transition: all 0.3s ease;
                "></div>
            `;

            // Link (Axon)
            if (!isLast) {
                html += `<div class="axon" style="width: 12px; height: 1px; background: rgba(255,255,255,0.1);"></div>`;
            }
        });

        html += '</div>';
        this.container.innerHTML = html;
    }
}
