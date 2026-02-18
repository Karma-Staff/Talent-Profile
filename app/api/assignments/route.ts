import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
        const assignment = db.getAssignmentByClient(clientId);
        return NextResponse.json(assignment || { clientId, candidateIds: [] });
    }

    const assignments = db.getAssignments();
    return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { clientId, candidateIds, updatedBy } = body;

        if (!clientId || !Array.isArray(candidateIds)) {
            return NextResponse.json({ error: 'clientId and candidateIds are required' }, { status: 400 });
        }

        const assignment = {
            clientId,
            candidateIds,
            updatedAt: new Date().toISOString(),
            updatedBy: updatedBy || 'unknown',
        };

        db.saveAssignment(assignment);
        return NextResponse.json(assignment);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save assignment' }, { status: 500 });
    }
}
