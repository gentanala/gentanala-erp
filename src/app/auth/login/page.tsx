'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanPassword = password.trim();

            // For demo purposes, allow bypass if using demo credentials
            if (cleanEmail === 'admin@gentanala.com' || cleanEmail === 'workshop@gentanala.com') {
                if (cleanPassword === 'admin123') {
                    localStorage.removeItem('demo_logged_out');
                    router.push('/dashboard');
                    router.refresh();
                    return;
                }
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
            });

            if (error) {
                setError(error.message);
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setError('Connection Error: Web server cannot reach Supabase. Please use demo credentials or check your connection.');
            } else {
                setError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                        G
                    </div>
                    <CardTitle className="text-2xl">Welcome to Gentanala</CardTitle>
                    <CardDescription>Sign in to access your Mini ERP dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>Demo Credentials:</p>
                        <p className="mt-1">
                            <strong>Super Admin:</strong> admin@gentanala.com
                        </p>
                        <p>
                            <strong>Workshop:</strong> workshop@gentanala.com
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
