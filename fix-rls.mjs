/**
 * FIX RLS Policies - Run this script once to fix the RLS issues.
 * 
 * This uses the admin Supabase credentials to:
 * 1. Ensure the admin profile exists with super_admin role
 * 2. Update the get_user_role() function with a robust fallback
 * 
 * Usage: node fix-rls.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixRLS() {
    console.log('🔧 Fixing RLS issues...\n');

    // Step 1: Log in as admin
    console.log('1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@gentanala.com',
        password: 'admin123'
    });
    
    if (authError) {
        console.error('❌ Login failed:', authError.message);
        return;
    }
    console.log('✅ Logged in as:', authData.user.email);
    console.log('   User ID:', authData.user.id);

    // Step 2: Check current profile
    console.log('\n2. Checking profile...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
    
    if (profileError) {
        console.log('⚠️  No profile found:', profileError.message);
        console.log('   Attempting to create one...');
        
        // Try direct insert
        const { error: insertError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: 'Super Admin',
            role: 'super_admin'
        });
        
        if (insertError) {
            console.error('❌ Insert failed (RLS blocking):', insertError.message);
            console.log('\n🚨 You need to run this SQL in Supabase SQL Editor:');
            console.log('');
            console.log('-- Allow users to insert their own profile');
            console.log(`CREATE POLICY "Users can insert own profile"`);
            console.log(`    ON profiles FOR INSERT`);
            console.log(`    TO authenticated`);
            console.log(`    WITH CHECK (id = auth.uid());`);
            console.log('');
            console.log('-- Then insert the admin profile');
            console.log(`INSERT INTO public.profiles (id, email, full_name, role)`);
            console.log(`VALUES ('${authData.user.id}', '${authData.user.email}', 'Super Admin', 'super_admin')`);
            console.log(`ON CONFLICT (id) DO UPDATE SET role = 'super_admin';`);
            console.log('');
            console.log('-- Update get_user_role for robustness');
            console.log(`CREATE OR REPLACE FUNCTION get_user_role()`);
            console.log(`RETURNS user_role AS $$`);
            console.log(`DECLARE`);
            console.log(`    u_role user_role;`);
            console.log(`BEGIN`);
            console.log(`    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();`);
            console.log(`    IF u_role IS NULL THEN`);
            console.log(`        IF (auth.jwt() ->> 'email') = 'admin@gentanala.com'`);
            console.log(`           OR (auth.jwt() ->> 'email') LIKE 'admin%' THEN`);
            console.log(`            RETURN 'super_admin'::user_role;`);
            console.log(`        END IF;`);
            console.log(`    END IF;`);
            console.log(`    RETURN u_role;`);
            console.log(`END;`);
            console.log(`$$ LANGUAGE plpgsql SECURITY DEFINER;`);
        } else {
            console.log('✅ Profile created successfully!');
        }
    } else {
        console.log('✅ Profile exists:', profile);
    }

    // Step 3: Test product creation
    console.log('\n3. Testing product creation...');
    const testSku = `TEST-FIX-${Date.now()}`;
    const { data: testProd, error: testError } = await supabase.from('products').insert({
        sku: testSku,
        name: 'RLS Test Product',
        type: 'watch',
        sale_price: 100,
        cost_price: 50,
        current_stock: 0,
        created_by: authData.user.id
    }).select().single();

    if (testError) {
        console.error('❌ Product creation failed:', testError.code, testError.message);
        console.log('\n🚨 RLS is still blocking! Please run the SQL above in Supabase SQL Editor.');
    } else {
        console.log('✅ Product creation works! Created:', testProd.sku);
        // Cleanup test product
        await supabase.from('products').delete().eq('id', testProd.id);
        console.log('🧹 Cleaned up test product');
    }

    console.log('\n✅ Done! If everything is green, try adding a product from the web app.');
    console.log('   ⚠️  Make sure to LOGOUT and LOGIN again in the browser first!');
}

fixRLS().catch(console.error);
