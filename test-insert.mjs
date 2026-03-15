import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@gentanala.com',
        password: 'admin123'
    });
    console.log("Login:", !!auth?.user, authErr?.message);
    
    if (auth?.user) {
        const insertData = {
            sku: 'TEST-' + Date.now(),
            name: 'Test Product',
            type: 'watch',
            sale_price: 150000,
            cost_price: 100000,
            current_stock: 5,
            min_stock_threshold: 2,
            image_urls: [],
            is_active: true,
            created_by: auth.user.id
        };
        const {data, error} = await supabase.from('products').insert(insertData).select().single();
        console.log("Insert result:", error ? JSON.stringify(error, null, 2) : "Success: " + data.sku);
    }
}
check();
