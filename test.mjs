import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
    console.log("Testing Supabase connection...");
    
    // Test getProducts
    const { data: get_data, error: get_error } = await supabase.from('products').select('*').limit(5);
    if (get_error) {
        console.error('getProducts failed:', JSON.stringify(get_error, null, 2));
    } else {
        console.log('getProducts succeeded, got items:', get_data.length);
    }

    // Test insert
    const insertData = {
        sku: 'TEST-SKU-001-' + Date.now(),
        name: 'Test Product',
        type: 'watch',
        sale_price: 100,
        cost_price: 50,
        current_stock: 10,
        min_stock_threshold: 5,
        image_urls: [],
        is_active: true,
    };

    const { data: insert_data, error: insert_error } = await supabase.from('products').insert(insertData).select().single();
    
    if (insert_error) {
        console.error('Insert failed:', JSON.stringify(insert_error, null, 2));
    } else {
        console.log('Insert succeeded:', insert_data);
    }
}

testSupabase();
