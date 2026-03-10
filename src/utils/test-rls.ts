import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const userId = '9176f765-6b1d-45d4-9c65-4144918bc88a';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log('Testing insertion with Service Role...');
    console.log('URL:', supabaseUrl);

    // First, sync profile to be safe
    console.log('Syncing profile...');
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            email: 'test@example.com',
            full_name: 'Test Agent',
        });

    if (profileError) {
        console.error('Profile Sync Error:', profileError);
    } else {
        console.log('Profile synced.');
    }

    // Now try to insert career
    const { data, error } = await supabaseAdmin
        .from('carreras')
        .insert({
            nombre: 'CARRERA_TEST_' + Date.now(),
            created_by: userId
        })
        .select()
        .single();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

test();
