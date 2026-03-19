'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/database.types';

interface AuthContextType {
    profile: Profile | null;
    loading: boolean;
    isSuperAdmin: boolean;
    isWorkshopAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    profile: null,
    loading: true,
    isSuperAdmin: false,
    isWorkshopAdmin: false,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || !process.env.NEXT_PUBLIC_SUPABASE_URL;
                
                if (isDemo) {
                    const loggedOut = localStorage.getItem('demo_logged_out') === 'true';
                    if (!loggedOut && mounted) {
                        setProfile({
                            id: 'demo-user',
                            email: 'admin@gentanala.com',
                            full_name: 'Super Admin',
                            role: 'super_admin',
                            avatar_url: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    } else if (mounted) {
                        setProfile(null);
                    }
                    return;
                }

                // Real DB Logic: check current active session first
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error("Auth init error:", sessionError);
                }

                if (session?.user && mounted) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) {
                        console.error("Profile fetch error for user:", session.user.id, profileError.message);
                        if (mounted) setProfile(null);
                    } else if (mounted) {
                        setProfile(profile || null);
                    }
                } else if (mounted) {
                    setProfile(null);
                }
            } catch (err) {
                console.error("Fatal auth init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        // Safety timeout to ensure we don't hang forever
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth init timed out, forcing loading finished");
                setLoading(false);
            }
        }, 5000);

        initAuth();

        const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || !process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (isDemo) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
                if (event === 'SIGNED_OUT') {
                    if (mounted) setProfile(null);
                } else if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (mounted) setProfile(profile || null);
                }
                if (mounted) setLoading(false);
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            if (subscription) subscription.unsubscribe();
        };
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
        localStorage.setItem('demo_logged_out', 'true');
        setProfile(null);
        window.location.href = '/auth/login';
    };

    const isSuperAdmin = profile?.role === 'super_admin';
    const isWorkshopAdmin = profile?.role === 'workshop_admin';
    
    return (
        <AuthContext.Provider value={{ 
            profile, 
            loading, 
            isSuperAdmin, 
            isWorkshopAdmin, 
            signOut 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
