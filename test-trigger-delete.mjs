import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function attempt() {
    console.log("We can't delete users to reset without service object, asking user to drop the trigger then recreate...");
}

attempt();
