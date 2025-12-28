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

    // Step 0: Origin Selection
    let steps = [
        {
            id: 'origin',
            text: "Sistema Flux Conectado.",
            sub: "Elige tu camino.",
            type: 'select',
            options: [
                { val: 'new', label: 'Iniciar Nueva Consciencia' },
                { val: 'login', label: 'Restaurar Enlace (Login)' }
            ],
            field: 'origin'
        },
        {
            id: 'designation',
            text: "Identifique al Operador.",
            sub: "¿Quién eres?",
            placeholder: "Ej: Xavier",
            field: 'name'
        },
        {
            id: 'archetype',
            text: "Definiendo Parámetros.",
            sub: "¿Cuál es tu Arquetipo?",
            placeholder: "Ej: El Creador",
            field: 'archetype'
        },
        {
            id: 'chronotype',
            text: "Calibrando Ciclos.",
            sub: "¿Momento de mayor energía?",
            type: 'select',
            options: [
                { val: 'morning', label: 'Mañana' },
                { val: 'afternoon', label: 'Tarde' },
                { val: 'night', label: 'Noche' }
            ],
            field: 'chronotype'
        },
        {
            id: 'northstar',
            text: "Directiva Principal.",
            sub: "¿Cuál es tu gran objetivo?",
            placeholder: "Ej: Crear el futuro",
            field: 'northStar'
        },
        {
            id: 'auth',
            text: "Sincronización Neural.",
            sub: "Ingresa tu email para respaldo.",
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
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
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

        // Bind Events
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
        // Step 0: Branching Logic
        if (field === 'origin') {
            if (value === 'login') {
                // Switch to Login Flow
                steps = [
                    steps[0], // Keep origin history technically
                    {
                        id: 'login-email',
                        text: "Restaurar Enlace.",
                        sub: "Ingresa tu email registrado.",
                        placeholder: "email@ejemplo.com",
                        field: 'email_login'
                    }
                ];
                currentStep = 1; // Jump to email
                renderStep();
                return;
            }
            // Else 'new', just continue
        }

        if (value) tempProfile[field] = value;

        // Auth Logic (For both 'New' step 'auth' OR 'Login' step 'email_login')
        if ((field === 'email' || field === 'email_login') && value) {
            await handleAuth(value, field === 'email_login');
            return; // Stop rendering here, handleAuth takes over
        }

        currentStep++;
        if (currentStep < steps.length) {
            renderStep();
        } else {
            finish();
        }
    };

    const handleAuth = async (email, isLogin) => {
        const btn = document.getElementById('btn-next');
        const input = document.getElementById('genesis-input');

        if (btn) { btn.innerText = "Enviando Enlace..."; btn.disabled = true; }
        if (input) input.disabled = true;

        const { error } = await Supabase.signInWithOtp(email);

        if (error) {
            alert("Error: " + error.message);
            if (btn) { btn.innerText = "Reintentar"; btn.disabled = false; }
            if (input) input.disabled = false;
            return;
        }

        // Show Verification
        modal.innerHTML = `
            <div class="genesis-content">
                <div class="genesis-avatar-lg" style="animation: none; opacity: 1; border: 2px solid var(--accent-cyan);"></div>
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--accent-cyan);">Enlace Enviado</h2>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">
                    Revisa tu correo (${email}) y haz clic en el enlace mágico.
                    <br><small style="color: var(--accent-violet); margin-top: 8px; display: block;">Escuchando confirmación...</small>
                </p>
                <div style="margin-top: 2rem;">
                    <button id="btn-check-auth" class="genesis-btn">Ya verifiqué mi correo</button>
                    ${!isLogin ? `<button id="btn-skip-auth" style="background:none; border:none; color: #666; margin-top:10px; cursor: pointer;">Saltar por ahora</button>` : ''}
                </div>
            </div>
        `;

        // [NEW] Cross-Tab Sync Listener
        const { data: authListener } = Supabase.client.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                console.log("⚡ Auth Event Detected:", event);
                // Auto-advance
                handleLoginSuccess(session.user, isLogin);
            }
        });

        // Manual Check Button
        document.getElementById('btn-check-auth').onclick = async () => {
            const btnCheck = document.getElementById('btn-check-auth');
            btnCheck.innerText = "Sincronizando...";

            // Check Session
            const user = await Supabase.getUser();
            if (user) {
                authListener.subscription.unsubscribe(); // Cleanup
                handleLoginSuccess(user, isLogin);
            } else {
                alert("Aún no detectamos la sesión. Por favor usa el enlace del correo primero.");
                btnCheck.innerText = "Ya verifiqué mi correo";
            }
        };

        if (!isLogin) {
            document.getElementById('btn-skip-auth').onclick = () => {
                authListener.subscription.unsubscribe(); // Cleanup
                finish();
            };
        }
    };

    const handleLoginSuccess = async (user, isLogin) => {
        tempProfile.id = user.id;
        tempProfile.email = user.email;

        // If Login, Fetch Profile Data
        if (isLogin) {
            const profileData = await Supabase.getProfile(user.id);
            if (profileData) {
                Object.assign(tempProfile, profileData); // Merge cloud data

                // [FIX] Force Reset Context to ensure User Check-in
                store.state.today.energyLevel = null;
                store.state.today.energyContext = null;
                store.save();

                alert(`Bienvenido de vuelta, ${tempProfile.name || 'Viajero'}.`);
            } else {
                alert("Sesión iniciada, pero no encontramos datos previos. Creando nuevo perfil local.");
            }
        } else {
            alert("¡Identidad Confirmada!");
        }
        finish();
    };

    const finish = () => {
        tempProfile.onboardingCompleted = true;
        store.updateProfile(tempProfile);

        // Sync new profile to cloud if authenticated
        if (tempProfile.id) {
            Supabase.upsertProfile(tempProfile);
        }

        // Exit
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            if (onComplete) onComplete();
        }, 1000);
    };

    renderStep();
}
