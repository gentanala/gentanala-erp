import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // We don't have this, but I can just use anon key and check error
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function attempt() {
    console.log("Checking sign up error specifically...");
    const { error: signUpError } = await supabase.auth.signUp({
        email: `test-trigger-${Date.now()}@gentanala.com`,
        password: 'password123',
    });
    console.log("Sign up response:", JSON.stringify(signUpError, null, 2));
}

attempt();
