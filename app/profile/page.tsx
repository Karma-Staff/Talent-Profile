'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ActivityTimeline } from '@/components/profile/ActivityTimeline';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { useState, useEffect } from 'react';
import { User, UserActivity } from '@/lib/types';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const user = session?.user as any;
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [localUser, setLocalUser] = useState<User | null>(null);

    useEffect(() => {
        if (user?.id) {
            setLocalUser({
                ...user,
                role: user.role || 'client',
                memberSince: user.memberSince || '2024',
                avatarUrl: user.avatarUrl,
            });
            // Mock fetching activities
            const dummyActivities: UserActivity[] = [
                {
                    id: 'act-1',
                    type: 'login',
                    action: 'Logged into the system',
                    timestamp: 'Today, 10:30 AM',
                },
                {
                    id: 'act-2',
                    type: 'time_log',
                    action: 'Started working session',
                    timestamp: 'Today, 10:32 AM',
                    status: 'working',
                    timeRange: '10:32 AM - 12:45 PM',
                    duration: '2h 13m',
                },
                {
                    id: 'act-3',
                    type: 'time_log',
                    action: 'Took a break',
                    timestamp: 'Today, 12:45 PM',
                    status: 'away',
                    timeRange: '12:45 PM - 1:15 PM',
                    duration: '30m',
                },
                {
                    id: 'act-4',
                    type: 'login',
                    action: 'Updated profile settings',
                    timestamp: 'Yesterday, 4:20 PM',
                },
            ];
            setActivities(dummyActivities);
        }
    }, [user?.id, user?.avatarUrl, user?.name, user?.role]);

    const handleProfileSave = async (updatedFields: Partial<User>) => {
        if (localUser) {
            const newUser = { ...localUser, ...updatedFields };
            setLocalUser(newUser);

            // Save large avatar to localStorage to avoid session bloat/crashes
            if (updatedFields.avatarUrl) {
                localStorage.setItem(`avatar_${localUser.id}`, updatedFields.avatarUrl);
                // Dispatch event so other components (Navbar) can sync instantly
                window.dispatchEvent(new Event('profile-sync'));
            } else if (updatedFields.avatarUrl === null) {
                localStorage.removeItem(`avatar_${localUser.id}`);
                window.dispatchEvent(new Event('profile-sync'));
            }

            // Update the global session to sync name/role WITHOUT the large image data
            const sessionUpdate: any = { ...updatedFields };
            delete sessionUpdate.avatarUrl; // Remove to prevent [CLIENT_FETCH_ERROR]

            try {
                await update({
                    ...sessionUpdate,
                    name: updatedFields.name || localUser.name,
                });
            } catch (err) {
                console.error('Session update failed, but local profile refreshed:', err);
            }
        }
    };

    if (!session || !user || !localUser) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-primary mb-2">My Profile</h1>
                        <p className="text-muted-foreground">Manage your account information and view recent activity</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1 space-y-8">
                        <ProfileCard user={localUser} />
                    </div>

                    {/* Right Column - Activities & Settings */}
                    <div className="lg:col-span-2 space-y-8">
                        <AccountSettings user={localUser} onSave={handleProfileSave} />
                        <ActivityTimeline activities={activities} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
