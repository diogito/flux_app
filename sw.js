const CACHE_NAME = 'flux-os-v3';
const ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './css/components.css',
    './css/immersion.css',
    './js/app.js',
    './js/store.js',
    './js/config.js',
    './js/core/AnalyticsDB.js',
    './js/core/CloudCore.js',
    './js/core/HabitsDB.js',
    './js/core/InsightEngine.js',
    './js/core/NeuralCore.js',
    './js/core/SupabaseClient.js',
    './js/ui/DailySummaryModal.js',
    './js/ui/EnergySlider.js',
    './js/ui/FocusSession.js',
    './js/ui/HabitForm.js',
    './js/ui/HabitList.js',
    './js/ui/NegotiationModal.js',
    './js/ui/SettingsModal.js',
    './js/ui/WeeklyReportModal.js',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// Install: Cache everything
self.addEventListener('install', (e) => {
    console.log('[SW] Installing Flux OS...');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate: Clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Fetch: Network First, Fallback to Cache (Ensures fresh data if online)
// For a static app, "Stale-While-Revalidate" is often better, but let's stick to simple Cache Fallback
self.addEventListener('fetch', (e) => {
    // Skip cross-origin requests (e.g. Supabase, WebLLM CDN)
    if (!e.request.url.startsWith(location.origin)) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Return cache if found
            if (cachedResponse) return cachedResponse;

            // Otherwise fetch network
            return fetch(e.request);
        })
    );
});
