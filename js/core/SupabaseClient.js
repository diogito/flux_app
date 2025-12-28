import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

class SupabaseService {
    constructor() {
        this.client = null;
        this.ready = false;
        this.init();
    }

    init() {
        if (SUPABASE_URL === 'YOUR_URL_HERE' || !SUPABASE_URL) {
            console.warn("☁️ Supabase not configured. Please update js/config.js");
            return;
        }

        try {
            this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.ready = true;
            console.log("☁️ Supabase Client Initialized");
        } catch (e) {
            console.error("Supabase Init Failed", e);
        }
    }

    // -- HABITS --
    async getHabits() {
        if (!this.ready) return [];
        const { data, error } = await this.client.from('habits').select('*');
        if (error) throw error;
        return data;
    }

    async syncHabits(localHabits) {
        if (!this.ready) return;
        // Upsert logic (simplistic for now)
        const { error } = await this.client.from('habits').upsert(localHabits);
        if (error) console.error("Sync Habits Error", error);
    }

    // -- HISTORY (RAG) --
    async logEvent(event) {
        if (!this.ready) return;
        // Map AnalyticsDB event to SQL structure
        // Assuming table 'events' has JSONB 'data' column or flattened structure
        const { error } = await this.client.from('events').insert([
            {
                type: event.type,
                data: event.data, // JSONB
                timestamp: event.timestamp
            }
        ]);
        if (error) console.error("Log Event Error", error);
    }

    async getHistory(limit = 30) {
        if (!this.ready) return [];
        const { data, error } = await this.client
            .from('events')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("RAG Fetch Error", error);
            return [];
        }
        return data;
    }
}

export const Supabase = new SupabaseService();
