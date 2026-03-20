import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
    const { error: err } = await supabase.from('kanban_items').insert({ created_by: null });
    console.log("kanban_items created_by error:", err);
    
    const { error: err2 } = await supabase.from('production_logs').insert({ created_by: null });
    console.log("production_logs created_by error:", err2);
    
    const { error: err3 } = await supabase.from('kanban_items').insert({ user_id: null });
    console.log("kanban_items user_id error:", err3);
}
test()
