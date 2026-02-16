
import { createClient } from '@supabase/supabase-js';

// HARDCODED CREDENTIALS FOR TESTING (Bypassing .env issues)
const supabaseUrl = "https://sivgkdzoljtkqohmhhdq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdmdrZHpvbGp0a3FvaG1oaGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjM1MDIsImV4cCI6MjA4NjczOTUwMn0.s5K8_GE-Cw8Cfr1ZttYrTZC0R65rqTbpvtCuxuyU_yo";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase credentials missing even after hardcoding!');
} else {
    console.log('Supabase Client Initialized with Hardcoded Credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
