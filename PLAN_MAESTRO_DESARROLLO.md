# PLAN MAESTRO DE DESARROLLO: FLUX APP (MVP/PWA)

**Versión:** 1.0
**Objetivo:** Guía técnica exhaustiva para la generación de código del MVP de Flux.
**Arquitectura:** Vanilla JS (SPA) + CSS Variables + LocalStorage (No Frameworks).

---

## 1. Arquitectura de Archivos (Definitiva)

```text
/flux_app
├── index.html              # Entry Point (Single Page)
├── manifest.json           # PWA Configuration
├── assets/
│   ├── icon-192.png
│   └── icon-512.png
├── css/
│   ├── main.css            # Reset & Layout Base
│   ├── variables.css       # Design Tokens (Colors, Typography)
│   ├── components.css      # UI Components (Slider, Cards)
│   └── animations.css      # Keyframes (Bioluminescence)
└── js/
    ├── app.js              # Main Controller (Init & Routing)
    ├── store.js            # State Management (Proxy Pattern)
    ├── utils.js            # Helpers (Date, ID gen)
    ├── core/
    │   ├── EnergyEngine.js # Logic: Energy -> Difficulty Mapping
    │   └── HabitsDB.js     # Logic: Default Habits & CRUD
    └── ui/
        ├── EnergySlider.js # Component: Interactive Slider
        ├── HabitList.js    # Component: Render Daily Tasks
        └── FocusOverlay.js # Component: Execution Mode
```

---

## 2. Modelo de Datos (State Management)

El estado global se gestionará en `js/store.js` usando el patrón *Observer/Proxy* para reactividad simple.

### **Schema (`LocalStorage key: 'flux_state'`)**

```javascript
{
  "userProfile": {
    "name": "User",
    "onboardingCompleted": false
  },
  "today": {
    "date": "2025-12-28",
    "energyLevel": null, // 0-100 (null = check-in pending)
    "energyContext": null, // "survival" | "maintenance" | "expansion"
    "completedHabits": [] // Array of habit IDs
  },
  "habits": [
    {
      "id": "h_001",
      "title": "Actividad Física",
      "levels": {
        "survival": { "text": "Estirar 5 min", "duration": 5 },
        "maintenance": { "text": "Cardio 20 min", "duration": 20 },
        "expansion": { "text": "HIIT 45 min", "duration": 45 }
      }
    }
  ]
}
```

---

## 3. Lógica del Núcleo (Core Logic)

### **3.1. Motor de Energía (`js/core/EnergyEngine.js`)**

La función principal que determina el "Contexto" según el nivel de batería.

*   **Firma:** `calculateContext(level)`
*   **Reglas:**
    *   `0 - 35`: **SURVIVAL** (Modo Supervivencia) -> Priorizar adherencia mínima.
    *   `36 - 70`: **MAINTENANCE** (Modo Mantenimiento) -> Rutina estándar.
    *   `71 - 100`: **EXPANSION** (Modo Expansión) -> Retos adicionales.

### **3.2. Renderizado Reactivo**

Al cambiar `store.today.energyLevel`:
1.  El `Store` emite evento `stateChanged`.
2.  `app.js` detecta el evento.
3.  Llama a `HabitList.render()` pasándole el nuevo `energyContext`.
4.  `HabitList` filtra qué texto mostrar para cada hábito (ej. si es Survival, muestra "Estirar 5 min").

---

## 4. Especificaciones UI (Componentes)

### **4.1. Energy Slider (`js/ui/EnergySlider.js`)**
*   **Visual:** Slider vertical o circular.
*   **Interacción:** Arrastrar cambia el valor en tiempo real.
*   **Feedback:** Fondo cambia de color dinámicamente:
    *   Bajo: Azul Profundo (`#0a192f`)
    *   Medio: Violeta (`#7b2cbf`)
    *   Alto: Cian Neón (`#00f0ff`)

### **4.2. Habit Card (`js/ui/HabitList.js`)**
*   **Estado:** Pendiente / Completado.
*   **Animación:** Al completar, disparar "Confeti de Luz" (Canvas o CSS Particles).
*   **Texto Dinámico:** Muestra SOLO la versión correspondiente al nivel de energía del día.

---

## 5. Secuencia de Implementación (Paso a Paso)

Para el modelo generador de código, esta es la orden de ejecución:

1.  **Fase Infraestructura:**
    *   Crear `index.html` con estructura semántica vacía (`<main id="app">`).
    *   Crear `css/variables.css` con la paleta "Neuro-Bio" definida en el Landing.

2.  **Fase Lógica:**
    *   Implementar `js/store.js` con lectura/escritura a `localStorage`.
    *   Implementar `js/core/EnergyEngine.js`.

3.  **Fase Interfaz 1 (Check-in):**
    *   Crear `js/ui/EnergySlider.js`.
    *   Conectarlo al Store: Al soltar el slider -> `store.setEnergy(val)`.

4.  **Fase Interfaz 2 (Dashboard):**
    *   Crear `js/core/HabitsDB.js` con datos dummy.
    *   Crear `js/ui/HabitList.js` que lea el `currentContext` y renderice las cards.

---

**Nota para el Desarrollador (IA):**
Priorizar la suavidad de las animaciones (60fps) usando `transform` y `opacity`. Evitar repaints costosos. El diseño debe sentirse "líquido" y "orgánico".
