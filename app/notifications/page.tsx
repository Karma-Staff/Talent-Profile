'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Bell, Calendar, UserCheck, AlertCircle, Info, Check, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';

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

export default function NotificationsPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const [notifications, setNotifications] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user?.id]);

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id }),
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

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

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Bell className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Notifications</h1>
                            <p className="text-sm text-slate-400 mt-0.5">
                                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'unread', 'read'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === tab
                                ? 'bg-primary text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'unread' && unreadCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Notification list */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">Loading notifications…</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-16">
                            <Bell className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                            <p className="text-slate-400 text-lg font-medium">
                                {filter === 'all' ? 'No notifications yet' : filter === 'unread' ? 'No unread notifications' : 'No read notifications'}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                                {filter === 'all'
                                    ? 'Notifications will show up here when actions happen in the system.'
                                    : 'Try switching to a different filter.'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notif: any) => {
                            const NIcon = iconMap[notif.icon] || Bell;
                            const colors = colorMap[notif.color] || colorMap.sky;
                            return (
                                <Card
                                    key={notif.id}
                                    className={`transition-all hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 ${!notif.read ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-75 hover:opacity-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 p-4">
                                        <div className={`p-3 rounded-xl ${colors.bg} flex-shrink-0`}>
                                            <NIcon className={`w-5 h-5 ${colors.text}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className={`text-sm font-semibold leading-snug ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        {notif.createdAt ? formatTimeAgo(notif.createdAt) : ''}
                                                    </p>
                                                </div>

                                                {!notif.read && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                                {!notif.read && (
                                                    <button
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notif.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
