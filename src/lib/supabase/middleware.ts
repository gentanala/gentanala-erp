import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    // Skip all Supabase auth in demo mode (placeholder credentials)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Race getUser against a 3s timeout to avoid edge runtime hanging
    let user = null;
    try {
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('MIDDLEWARE_TIMEOUT')), 3000)
        );
        const result = await Promise.race([getUserPromise, timeoutPromise]) as any;
        user = result?.data?.user ?? null;
    } catch {
        // Timeout or error — treat as unauthenticated
        user = null;
    }

    // Protected routes - redirect to login if not authenticated
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

