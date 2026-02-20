'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Calendar, LogOut, Shield, Bot, MessageSquare, Menu, X, UserPlus, User as IconUser, Settings, Bell, UserCheck, AlertCircle, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';

// Helper to format timestamps as relative time
function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const user = session?.user as any;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Icon mapping for API notification icon strings
    const iconMap: Record<string, any> = {
        'user-check': UserCheck,
        'calendar': Calendar,
        'alert-circle': AlertCircle,
        'info': Info,
        'bell': Bell,
    };

    // Color mapping for API notification color strings
    const colorMap: Record<string, { text: string; bg: string }> = {
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        blue: { text: 'text-blue-400', bg: 'bg-blue-400/10' },
        amber: { text: 'text-amber-400', bg: 'bg-amber-400/10' },
        sky: { text: 'text-sky-400', bg: 'bg-sky-400/10' },
        red: { text: 'text-red-400', bg: 'bg-red-400/10' },
    };

    const [notifications, setNotifications] = useState<any[]>([]);
    const [localAvatar, setLocalAvatar] = useState<string | null>(null);

    // Sync avatar from localStorage (bypass NextAuth cookie size limits)
    useEffect(() => {
        const syncAvatar = () => {
            if (user?.id) {
                const stored = localStorage.getItem(`avatar_${user.id}`);
                setLocalAvatar(stored);
            }
        };

        syncAvatar();
        window.addEventListener('profile-sync', syncAvatar);
        window.addEventListener('storage', (e) => {
            if (e.key === `avatar_${user?.id}`) syncAvatar();
        });

        return () => {
            window.removeEventListener('profile-sync', syncAvatar);
        };
    }, [user?.id]);

    // Fetch notifications from API
    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    // Fetch on mount and poll every 30 seconds
    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    const markAllRead = async () => {
        if (!user?.id) return;
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, markAll: true }),
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

                    <div className="flex items-center space-x-3">
                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative p-2 rounded-full hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5 text-slate-300 hover:text-white transition-colors" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[#0f172a] animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1e293b] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100]">
                                    {/* Arrow */}
                                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#1e293b] border-t border-l border-white/10 rotate-45" />

                                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5 rounded-t-2xl">
                                        <h3 className="font-semibold text-sm text-white">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>


                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-5 py-8 text-center">
                                                <Bell className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                                                <p className="text-sm text-slate-400">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 5).map((notif: any) => {
                                                const NIcon = iconMap[notif.icon] || Bell;
                                                const colors = colorMap[notif.color] || colorMap.sky;
                                                const timeAgo = notif.createdAt
                                                    ? formatTimeAgo(notif.createdAt)
                                                    : '';
                                                return (
                                                    <div
                                                        key={notif.id}
                                                        onClick={async () => {
                                                            // Mark as read via API
                                                            if (!notif.read) {
                                                                try {
                                                                    await fetch('/api/notifications', {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ notificationId: notif.id }),
                                                                    });
                                                                    setNotifications(prev =>
                                                                        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                                                                    );
                                                                } catch (err) {
                                                                    console.error('Failed to mark read:', err);
                                                                }
                                                            }
                                                            // Navigate to linked page
                                                            setNotifOpen(false);
                                                            if (notif.link) {
                                                                router.push(notif.link);
                                                            }
                                                        }}
                                                        className={`flex items-start gap-3 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-b-0 ${!notif.read ? 'bg-primary/5' : ''
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0 mt-0.5`}>
                                                            <NIcon className={`w-4 h-4 ${colors.text}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm leading-snug ${!notif.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                                                                {notif.title}
                                                            </p>
                                                            {notif.message && (
                                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                                                    {notif.message}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-xs text-slate-500">{timeAgo}</span>
                                                                {!notif.read && (
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            try {
                                                                                await fetch('/api/notifications', {
                                                                                    method: 'PUT',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ notificationId: notif.id }),
                                                                                });
                                                                                setNotifications(prev =>
                                                                                    prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                                                                                );
                                                                            } catch (err) {
                                                                                console.error('Failed to mark read:', err);
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                        Mark read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!notif.read && (
                                                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="px-5 py-3 border-t border-white/5 bg-white/5 rounded-b-2xl">
                                        <button
                                            onClick={() => {
                                                setNotifOpen(false);
                                                router.push('/notifications');
                                            }}
                                            className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative group">
                            <button className="flex items-center space-x-3 p-1 rounded-full hover:bg-secondary transition-colors">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                                    <img
                                        src={localAvatar || user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random`}
                                        alt={user?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </button>

                            {/* Profile Dropdown */}
                            <div className="absolute right-0 mt-3 w-72 bg-[#1e293b] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100]">
                                {/* Arrow/Caret */}
                                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#1e293b] border-t border-l border-white/10 rotate-45"></div>

                                <div className="px-5 py-4 border-b border-white/5 bg-white/5 rounded-t-2xl mb-2 relative">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30 ring-4 ring-primary/10 bg-slate-800 flex items-center justify-center">
                                            {localAvatar || user?.avatarUrl ? (
                                                <img
                                                    src={localAvatar || user.avatarUrl}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-white">
                                                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-base truncate text-white">{user?.name}</p>
                                            <p className="text-xs text-primary font-medium tracking-wide uppercase">{user?.role?.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-2 space-y-1">
                                    <Link
                                        href="/profile"
                                        className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/10 transition-all group/item"
                                    >
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                                            <IconUser className="w-4 h-4" />
                                        </div>
                                        <span className="text-slate-300 group-hover/item:text-white">View Profile</span>
                                    </Link>
                                    <div className="pt-2 mt-2 border-t border-white/5">
                                        <button
                                            onClick={() => signOut({ callbackUrl: '/login' })}
                                            className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-red-500/10 transition-all group/item w-full text-left"
                                        >
                                            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover/item:bg-red-500 group-hover/item:text-white transition-colors">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            <span className="text-slate-300 group-hover/item:text-red-400">Log Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                    <div className="py-3 px-3 mb-1 sm:hidden flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
                            <img
                                src={localAvatar || user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random`}
                                alt={user?.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
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

