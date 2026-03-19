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
    const getEnrichedProfile = (baseProfile: Profile | null, userEmail: string | undefined): Profile | null => {
        if (!userEmail) return baseProfile;
        
        const email = userEmail.toLowerCase();
        let role = baseProfile?.role || null;
        
        // Hardcoded fallbacks for critical accounts if DB is acting up or profile is missing
        if (!role) {
            if (email === 'admin@gentanala.com') role = 'super_admin';
            else if (email === 'workshop@gentanala.com') role = 'workshop_admin';
        }
        
        if (baseProfile) return { ...baseProfile, role } as Profile;
        
        // Synthesize a profile if one doesn't exist in DB yet
        return {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            email: email,
            full_name: email.split('@')[0],
            role: role || 'workshop_admin', // Default to workshop if unknown but logged in
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as Profile;
    };

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || !process.env.NEXT_PUBLIC_SUPABASE_URL;
                
                if (isDemo) {
                    const loggedOut = localStorage.getItem('demo_logged_out') === 'true';
                    if (!loggedOut && mounted) {
                        setProfile(getEnrichedProfile({
                            id: 'demo-user',
                            email: 'admin@gentanala.com',
                            full_name: 'Super Admin',
                            role: 'super_admin',
                            avatar_url: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }, 'admin@gentanala.com'));
                    } else if (mounted) {
                        setProfile(null);
                    }
                    setLoading(false);
                    return;
                }

                // Real DB Logic
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user && mounted) {
                    const { data: profileRecord } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (mounted) {
                        setProfile(getEnrichedProfile(profileRecord || null, session.user.email));
                    }
                } else if (mounted) {
                    setProfile(null);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        initAuth();

        const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || !process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (isDemo) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
                if (event === 'SIGNED_OUT') {
                    if (mounted) setProfile(null);
                } else if (session?.user) {
                    const { data: profileRecord } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (mounted) {
                        setProfile(getEnrichedProfile(profileRecord || null, session.user.email));
                    }
                }
                if (mounted) setLoading(false);
            }
        );

        return () => {
            mounted = false;
            if (subscription) subscription.unsubscribe();
        };
    }, [supabase]);

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
