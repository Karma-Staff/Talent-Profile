'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Shield } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('client');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            if (isLogin) {
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
            } else {
                // Registration Flow
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Failed to register account');
                } else {
                    setSuccessMessage('Account created successfully! You can now sign in.');
                    setIsLogin(true); // Flip back to login
                    setPassword(''); // Clear password for safety
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
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
                    <p className="text-muted-foreground">{isLogin ? 'Secure login to access candidate profiles' : 'Create a new account'}</p>
                </div>

                <div className="glass p-8 rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        )}

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

                        {!isLogin && (
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium mb-2">
                                    Account Role
                                </label>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                    <option value="customer_service">Customer Service</option>
                                </select>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                                {successMessage}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (isLogin ? 'Signing in...' : 'Registering...') : (isLogin ? 'Sign In' : 'Create Account')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="text-primary hover:underline"
                        >
                            {isLogin ? "Don't have an account? Register directly" : "Already have an account? Sign in"}
                        </button>
                    </div>

                    {isLogin && (
                        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium mb-2">Demo Accounts (If Seeded):</p>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Admin: admin@restoration.com</li>
                                <li>• CS Team: cs@restoration.com</li>
                                <li>• Client: client1@gmail.com</li>
                                <li className="mt-2">Password: demo123</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
