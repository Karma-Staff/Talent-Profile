'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getAuditLogs } from '@/lib/audit/logger';
import { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';
import { Shield, Search, ArrowLeft, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { canViewAuditLogs } from '@/lib/rbac';
import { redirect, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';

export default function AuditLogPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user as any;
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            getAuditLogs().then(data => {
                setLogs(data);
                setFilteredLogs(data);
                setLoading(false);
            });
        }
    }, [session]);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = logs.filter(log =>
            log.action.toLowerCase().includes(lowerSearch) ||
            log.userId.toLowerCase().includes(lowerSearch) ||
            log.resourceType.toLowerCase().includes(lowerSearch) ||
            log.resourceId.toLowerCase().includes(lowerSearch)
        );
        setFilteredLogs(filtered);
    }, [searchTerm, logs]);

    if (!session) return null;

    if (!canViewAuditLogs(user?.role)) {
        redirect('/dashboard');
    }

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            view_profile: 'Viewed Profile',
            download_resume: 'Downloaded Resume',
            schedule_meeting: 'Scheduled Meeting',
            create_candidate: 'Created Candidate',
            update_candidate: 'Updated Candidate',
            delete_candidate: 'Deleted Candidate',
            login: 'User Login',
        };
        return labels[action] || action.replace(/_/g, ' ');
    };

    const getResourceBadgeVariant = (type: string) => {
        const variants: Record<string, 'default' | 'success' | 'warning' | 'info' | 'destructive'> = {
            candidate: 'info',
            meeting: 'warning',
            user: 'default',
            system: 'destructive',
        };
        return variants[type] || 'default';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center">
                            <Shield className="w-8 h-8 mr-3 text-primary" />
                            System Audit Logs
                        </h1>
                        <p className="text-muted-foreground">
                            Complete history of system activities and security events
                        </p>
                    </div>
                </div>

                <Card>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground ml-auto">
                            Showing {filteredLogs.length} events
                        </div>
                    </div>

                    <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="p-4 w-[200px]">Timestamp</th>
                                    <th className="p-4 w-[150px]">User</th>
                                    <th className="p-4 w-[200px]">Action</th>
                                    <th className="p-4 w-[150px]">Resource</th>
                                    <th className="p-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            Loading audit logs...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No audit logs found matching your criteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="font-medium">{format(new Date(log.timestamp), 'MMM dd, yyyy')}</div>
                                                <div className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'hh:mm:ss a')}</div>
                                            </td>
                                            <td className="p-4 font-mono text-xs">{log.userId}</td>
                                            <td className="p-4">
                                                <div className="font-medium">{getActionLabel(log.action)}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={getResourceBadgeVariant(log.resourceType)}>
                                                    {log.resourceType}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[120px]" title={log.resourceId}>
                                                    {log.resourceId}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {log.details ? (
                                                    <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-w-[300px]">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                ) : (
                                                    <span className="text-muted-foreground italic">No details</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
