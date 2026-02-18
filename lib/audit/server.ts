import fs from 'fs';
import path from 'path';
import { AuditLog } from '../types';

const AUDIT_PATH = path.join(process.cwd(), 'data', 'audit.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(AUDIT_PATH))) {
    fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
}

export async function logAuditServer(
    userId: string,
    action: string,
    resourceType: 'candidate' | 'meeting' | 'user',
    resourceId: string,
    details?: Record<string, any>,
    ipAddress?: string
): Promise<void> {
    const log: AuditLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action,
        resourceType,
        resourceId,
        timestamp: new Date(),
        ipAddress,
        details,
    };

    try {
        const logs = await getAuditLogsServer();
        logs.push(log);
        fs.writeFileSync(AUDIT_PATH, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Failed to save audit log:', error);
    }
}

export async function getAuditLogsServer(): Promise<AuditLog[]> {
    if (!fs.existsSync(AUDIT_PATH)) return [];
    try {
        const data = fs.readFileSync(AUDIT_PATH, 'utf8');
        const logs = JSON.parse(data);
        return logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
        }));
    } catch (error) {
        return [];
    }
}
