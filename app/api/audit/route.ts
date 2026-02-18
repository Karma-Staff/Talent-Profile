import { NextRequest, NextResponse } from 'next/server';
import { logAuditServer, getAuditLogsServer } from '@/lib/audit/server';

export async function GET() {
    try {
        const logs = await getAuditLogsServer();
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        await logAuditServer(
            body.userId,
            body.action,
            body.resourceType,
            body.resourceId,
            body.details,
            body.ipAddress
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to log action' }, { status: 500 });
    }
}
