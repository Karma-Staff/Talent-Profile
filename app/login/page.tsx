'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid credentials');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/dashboard" className="inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-white mb-4 overflow-hidden p-4 hover:opacity-80 transition-opacity">
                        <img src="/karma-staff-logo.png" alt="Karma Staff" className="w-full h-full object-contain" />
                    </Link>
                    <h1 className="text-3xl font-bold mb-2 text-white">Karma Staff</h1>
                    <p className="text-muted-foreground">Secure login to access candidate profiles</p>
                </div>

                <div className="glass p-8 rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium mb-2">Demo Accounts:</p>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• Admin: admin@restoration.com</li>
                            <li>• CS Team: cs@restoration.com</li>
                            <li>• Client: client1@gmail.com</li>
                            <li className="mt-2">Password: demo123</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
