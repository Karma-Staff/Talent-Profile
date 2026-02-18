'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getAuditLogs } from '@/lib/audit/logger';
import { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';
import { Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { canViewAuditLogs } from '@/lib/rbac';
import { redirect } from 'next/navigation';

export default function AdminPage() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const [logs, setLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        if (session) {
            getAuditLogs().then(setLogs);
        }
    }, [session]);

    if (!session) {
        return null;
    }

    if (!canViewAuditLogs(user?.role)) {
        redirect('/dashboard');
    }

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            view_profile: 'Viewed Profile',
            download_resume: 'Downloaded Resume',
            schedule_meeting: 'Scheduled Meeting',
        };
        return labels[action] || action;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 flex items-center">
                        <Shield className="w-10 h-10 mr-3 text-primary" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor system activity and audit logs
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card hover={false}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Total Audit Logs</p>
                                <p className="text-3xl font-bold">{logs.length}</p>
                            </div>
                            <Activity className="w-10 h-10 text-primary/50" />
                        </div>
                    </Card>
                </div>

                {/* Audit Logs */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Activity</h2>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/audit'}>
                            View All Activity
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {logs.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No audit logs yet</p>
                        ) : (
                            logs.slice(0, 20).map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{getActionLabel(log.action)}</span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                    {log.resourceType}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                User: {log.userId} • Resource: {log.resourceId}
                                            </p>
                                            {log.details && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {JSON.stringify(log.details, null, 2).substring(0, 100)}...
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <p>{format(new Date(log.timestamp), 'MMM dd, yyyy')}</p>
                                            <p>{format(new Date(log.timestamp), 'hh:mm a')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
