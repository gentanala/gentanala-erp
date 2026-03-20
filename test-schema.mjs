import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
    const { data: cols, error: colErr } = await supabase.from('materials').select('*').limit(1);
    console.log("Cols materials:", cols?.[0]);
}
test()
