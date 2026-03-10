import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase client for general use (follows RLS)
 */
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);

/**
 * Supabase admin client for administrative tasks (bypasses RLS)
 */
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});
