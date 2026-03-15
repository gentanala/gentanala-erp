import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@gentanala.com',
        password: 'admin123'
    });
    
    if (auth?.user) {
        console.log("Logged in. Testing stats fetch...");
        const { data, error } = await supabase
            .from('products')
            .select('id, current_stock, cost_price, sale_price, type, min_stock_threshold')
            .eq('is_active', true);
            
        console.log("Stats fetch err:", error);
        console.log("Stats fetch data length:", data?.length);
    }
}
check();
