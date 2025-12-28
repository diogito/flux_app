import { store } from '../store.js';
import { Supabase } from '../core/SupabaseClient.js';

export function showGenesisModal(onComplete) {
    // Check if element exists, if not create
    let modal = document.getElementById('genesis-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'genesis-modal';
        modal.className = 'genesis-overlay';
        document.body.appendChild(modal);

        // Inject Styles
        const style = document.createElement('style');
        style.textContent = `
            .genesis-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #000;
                z-index: 10000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                color: var(--text-primary);
                font-family: 'Outfit', sans-serif;
                transition: opacity 1s ease;
            }
            .genesis-content {
                text-align: center;
                max-width: 600px;
                padding: 2rem;
                opacity: 0;
                animation: genesisFadeIn 2s forwards;
            }
            @keyframes genesisFadeIn { to { opacity: 1; } }
            
            .genesis-input {
                background: transparent;
                border: none;
                border-bottom: 2px solid var(--accent-violet);
                color: #fff;
                font-size: 1.5rem;
                text-align: center;
                width: 100%;
                margin-top: 1rem;
                outline: none;
                font-family: 'Inter', sans-serif;
            }
            .genesis-input::placeholder { color: rgba(255,255,255,0.2); }
            
            .genesis-btn {
                margin-top: 2rem;
                background: var(--glass-bg);
                border: 1px solid var(--accent-cyan);
                color: var(--accent-cyan);
                padding: 10px 30px;
                border-radius: 99px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Outfit', sans-serif;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .genesis-btn:hover {
                background: var(--accent-cyan);
                color: #000;
                box-shadow: 0 0 20px var(--accent-cyan);
            }

            .genesis-avatar-lg {
                width: 80px; height: 80px;
                background: radial-gradient(circle, var(--accent-violet) 0%, transparent 70%);
                border-radius: 50%;
                margin: 0 auto 2rem auto;
                box-shadow: 0 0 30px var(--accent-violet);
                animation: genesisPulse 3s infinite ease-in-out;
            }
            @keyframes genesisPulse {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    const steps = [
        {
            id: 'designation',
            text: "Sistema Flux Iniciado. Identifique al Operador.",
            sub: "¿Quién eres?",
            placeholder: "Ej: Xavier",
            field: 'name'
        },
        {
            id: 'archetype',
            text: "Definiendo Parámetros de Personalidad.",
            sub: "¿Cuál es tu Título o Arquetipo?",
            placeholder: "Ej: El Arquitecto, La Creadora",
            field: 'archetype'
        },
        {
            id: 'chronotype',
            text: "Calibrando Ciclos Biológicos.",
            sub: "¿Cuál es tu momento de mayor energía?",
            type: 'select',
            options: [
                { val: 'morning', label: 'Mañana (Alondra)' },
                { val: 'afternoon', label: 'Tarde (Normal)' },
                { val: 'night', label: 'Noche (Búho)' }
            ],
            field: 'chronotype'
        },
        {
            id: 'northstar',
            text: "Estableciendo Directiva Principal.",
            sub: "¿Cuál es tu gran objetivo actual?",
            placeholder: "Ej: Lanzar mi startup",
            field: 'northStar'
        },
        {
            id: 'auth',
            text: "Sincronización Neural (Opcional).",
            sub: "Ingresa tu email para respaldo en la nube.",
            placeholder: "email@ejemplo.com",
            field: 'email',
            skippable: true
        }
    ];

    let currentStep = 0;
    const tempProfile = {};

    const renderStep = () => {
        const step = steps[currentStep];

        let inputHTML = '';
        if (step.type === 'select') {
            inputHTML = `
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem;">
                    ${step.options.map(opt => `
                        <button class="genesis-btn" data-val="${opt.val}" style="border-color: var(--text-muted); color: var(--text-muted);">
                            ${opt.label}
                        </button>
                    `).join('')}
                </div>
            `;
        } else {
            inputHTML = `<input type="text" id="genesis-input" class="genesis-input" placeholder="${step.placeholder}" autocomplete="off" autofocus>`;
        }

        modal.innerHTML = `
            <div class="genesis-content">
                <div class="genesis-avatar-lg"></div>
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--accent-cyan);">${step.text}</h2>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">${step.sub}</p>
                
                ${inputHTML}
                
                <div style="margin-top: 2rem;">
                     ${step.skippable ? `<button id="btn-skip" style="background:none; border:none; color: #666; margin-right: 1rem; cursor: pointer;">Omitir</button>` : ''}
                    ${step.type !== 'select' ? `<button id="btn-next" class="genesis-btn">Confirmar</button>` : ''}
                </div>
            </div>
        `;

        // Logic
        if (step.type === 'select') {
            const btns = modal.querySelectorAll('button[data-val]');
            btns.forEach(b => b.onclick = () => next(step.field, b.getAttribute('data-val')));
        } else {
            const input = document.getElementById('genesis-input');
            const btn = document.getElementById('btn-next');
            const skip = document.getElementById('btn-skip');

            if (input) {
                input.focus();
                input.onkeypress = (e) => { if (e.key === 'Enter') next(step.field, input.value); };
            }
            if (btn) btn.onclick = () => next(step.field, input.value);
            if (skip) skip.onclick = () => next(step.field, null);
        }
    };

    const next = async (field, value) => {
        if (value) tempProfile[field] = value;

        // Special Logic for Auth
        if (field === 'email' && value) {
            const btn = document.getElementById('btn-next');
            const input = document.getElementById('genesis-input');

            if (btn) { btn.innerText = "Enviando Enlace..."; btn.disabled = true; }
            if (input) input.disabled = true;

            const { error } = await Supabase.signInWithOtp(value);

            if (error) {
                alert("Error de envío: " + error.message);
                if (btn) { btn.innerText = "Reintentar"; btn.disabled = false; }
                if (input) input.disabled = false;
                return;
            } else {
                // Show Verification State
                modal.innerHTML = `
                    <div class="genesis-content">
                        <div class="genesis-avatar-lg" style="animation: none; opacity: 1; border: 2px solid var(--accent-cyan);"></div>
                        <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--accent-cyan);">Enlace Enviado</h2>
                        <p style="color: var(--text-muted); margin-bottom: 1rem;">
                            Hemos enviado un enlace mágico a <strong>${value}</strong>.<br>
                            Revísalo en tu dispositivo para confirmar.
                        </p>
                        
                        <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 10px;">
                            <button id="btn-check-auth" class="genesis-btn">Ya verifiqué mi correo</button>
                            <button id="btn-skip-auth" style="background:none; border:none; color: #666; cursor: pointer; margin-top: 10px;">Entrar sin verificar por ahora</button>
                        </div>
                    </div>
                `;

                document.getElementById('btn-check-auth').onclick = async () => {
                    const btnCheck = document.getElementById('btn-check-auth');
                    btnCheck.innerText = "Verificando...";

                    // Check Session
                    const user = await Supabase.getUser();
                    if (user) {
                        tempProfile.id = user.id;
                        tempProfile.email = user.email; // Ensure correct email
                        alert("¡Identidad Confirmada!");
                        finish();
                    } else {
                        alert("Aún no detectamos la sesión. Asegúrate de hacer clic en el enlace del correo.");
                        btnCheck.innerText = "Ya verifiqué mi correo";
                    }
                };

                document.getElementById('btn-skip-auth').onclick = () => {
                    finish();
                };
                return; // Stop here, don't increment step
            }
        }

        currentStep++;
        if (currentStep < steps.length) {
            renderStep();
        } else {
            finish();
        }
    };

    const finish = () => {
        tempProfile.onboardingCompleted = true;
        store.updateProfile(tempProfile);

        // Sync to Cloud if we have email (even if not verified yet, we can try, but really we need session. 
        // Logic: Upsert requires ID. If we just did OTP, we don't have ID until they click link.
        // So we just save local for now.

        // Exit Animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            if (onComplete) onComplete();
        }, 1000);
    };

    renderStep();
}
