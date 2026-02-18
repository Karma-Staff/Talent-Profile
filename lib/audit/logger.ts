import { AuditLog } from '@/lib/types';

export async function logAudit(
    userId: string,
    action: string,
    resourceType: 'candidate' | 'meeting' | 'user',
    resourceId: string,
    details?: Record<string, any>,
    ipAddress?: string
): Promise<void> {
    try {
        await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                action,
                resourceType,
                resourceId,
                details,
                ipAddress,
            }),
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
    }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    try {
        const res = await fetch('/api/audit');
        if (!res.ok) throw new Error('Failed to fetch logs');
        return await res.json();
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return [];
    }
}
