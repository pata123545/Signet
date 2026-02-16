
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './src/supabaseClient.js';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log("Checking 'profiles' table schema...");

    // Try to insert a dummy row with just ID to see what happens, or just select 
    // We can't easily "describe" table via JS client without admin api usually, 
    // but we can try to select * limit 1 and see keys.

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting from profiles:", error);
    } else {
        console.log("Success. Rows found:", data.length);
        if (data.length > 0) {
            console.log("Columns present in first row:", Object.keys(data[0]));
        } else {
            console.log("No rows to inspect keys. Trying to insert with all fields to see if it fails.");
            // We can't really validly insert without a valid auth user usually due to RLS.
            // But we can check if the client throws immediate check error if we knew definitions.
        }
    }
}

// Also check environment
console.log("Supabase URL:", supabaseUrl);
checkSchema();
