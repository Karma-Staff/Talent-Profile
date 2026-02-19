'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, LogOut, Shield, Bot, MessageSquare, Menu, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const user = session?.user as any;
    const [mobileOpen, setMobileOpen] = useState(false);

    const navigation = [
        { name: 'Candidates', href: '/dashboard', icon: Users, roles: ['admin', 'customer_service', 'client'] },
        { name: 'Meetings', href: '/meetings', icon: Calendar, roles: ['admin', 'customer_service', 'client'] },
        { name: 'Recruiter AI', href: '/client-agent', icon: MessageSquare, roles: ['client'] },
        { name: 'Admin', href: '/admin', icon: Shield, roles: ['admin', 'customer_service'] },
        { name: 'Assign', href: '/admin/assignments', icon: UserPlus, roles: ['admin', 'customer_service'] },
        { name: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
        { name: 'AI Agent', href: '/admin/agent', icon: Bot, roles: ['admin', 'customer_service'] },
    ];

    const visibleNav = navigation.filter((item) => item.roles.includes(user?.role));

    return (
        <nav className="glass border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                                <img src="/karma-staff-logo.png" alt="Karma Staff" className="w-full h-full object-contain p-1" />
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="font-bold text-lg leading-tight">Karma Staff</span>
                            </div>
                        </Link>

                        <div className="hidden md:flex space-x-1">
                            {visibleNav.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-secondary'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="hidden md:inline-flex"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>

                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-4 pb-4 space-y-1 border-t border-border/50">
                    {/* User info on mobile */}
                    <div className="py-3 px-3 mb-1 sm:hidden">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>

                    {visibleNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-secondary'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors w-full text-left text-red-400"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

