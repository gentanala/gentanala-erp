import { createBrowserClient } from '@supabase/ssr';

const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

// Minimal stub that satisfies the SupabaseClient interface used in the app
// without ever making real network requests.
const noopUnsubscribe = { unsubscribe: () => { } };
const demoClient = {
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: noopUnsubscribe } }),
        signOut: async () => ({ error: null }),
    },
    from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
} as any;

export function createClient() {
    if (isDemo) return demoClient;
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}
