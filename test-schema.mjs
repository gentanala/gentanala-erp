import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
    // Try to insert an empty object to see which columns are required or what RLS says
    const { error } = await supabase.from('kanban_items').insert({}).select();
    console.log("Empty Insert Error:", error);

    const { error: error2 } = await supabase.from('production_logs').insert({}).select();
    console.log("Empty Log Insert Error:", error2);
}
test()
