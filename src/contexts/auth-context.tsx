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

    // Helper to synthesize/fallback profile roles
    const getEnrichedProfile = (baseProfile: Profile | null, user: any): Profile | null => {
        if (!user) return baseProfile;
        
        const email = user.email?.toLowerCase() || '';
        let role = baseProfile?.role || null;
        
        // Hardcoded fallbacks for critical accounts
        if (!role) {
            if (email === 'admin@gentanala.com') role = 'super_admin';
            else if (email === 'workshop@gentanala.com') role = 'workshop_admin';
        }
        
        if (baseProfile) return { ...baseProfile, role } as Profile;
        
        return {
            id: user.id || 'unknown',
            email: email,
            full_name: email.split('@')[0] || 'User',
            role: role || 'workshop_admin',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as Profile;
    };

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                console.log('[AuthContext] Initializing...');
                const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || !process.env.NEXT_PUBLIC_SUPABASE_URL;
                
                if (isDemo) {
                    console.log('[AuthContext] Demo mode detected');
                    const loggedOut = localStorage.getItem('demo_logged_out') === 'true';
                    if (!loggedOut && mounted) {
                        setProfile(getEnrichedProfile(null, { id: 'demo-user', email: 'admin@gentanala.com' }));
                    }
                    setLoading(false);
                    return;
                }

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) console.error('[AuthContext] Session error:', sessionError);
                
                if (session?.user && mounted) {
                    console.log('[AuthContext] Session found for:', session.user.id);
                    const { data: profileRecord, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profileError) console.error('[AuthContext] Profile error:', profileError);

                    if (mounted) {
                        const enriched = getEnrichedProfile(profileRecord || null, session.user);
                        console.log('[AuthContext] Profile loaded:', enriched?.role);
                        setProfile(enriched);
                    }
                } else if (mounted) {
                    console.log('[AuthContext] No session found');
                    setProfile(null);
                }
            } catch (err) {
                console.error("[AuthContext] Fatal init error:", err);
            } finally {
                if (mounted) {
                    console.log('[AuthContext] Loading finished');
                    setLoading(false);
                }
            }
        }

        // Safety timeout to ensure we don't hang forever
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn("[AuthContext] Init timed out (5s), forcing loading finished");
                setLoading(false);
            }
        }, 5000);

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
                console.log('[AuthContext] Auth state change:', event);
                if (event === 'SIGNED_OUT') {
                    if (mounted) {
                        setProfile(null);
                        setLoading(false);
                    }
                } else if (session?.user) {
                    const { data: profileRecord } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (mounted) {
                        setProfile(getEnrichedProfile(profileRecord || null, session.user));
                        setLoading(false);
                    }
                } else if (mounted) {
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("SignOut error:", err);
        }
        if (typeof window !== 'undefined') {
            localStorage.clear();
            window.location.href = '/auth/login';
        }
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
