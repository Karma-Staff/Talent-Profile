import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
        const assignment = await db.getAssignmentByClient(clientId);
        return NextResponse.json(assignment || { clientId, candidateIds: [] });
    }

    const assignments = await db.getAssignments();
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

        await db.saveAssignment(assignment);

        // Send notification to the client about assigned candidates
        try {
            const candidateNames: string[] = [];
            for (const cId of candidateIds) {
                const c = await db.getCandidateById(cId);
                if (c) candidateNames.push(c.name);
            }
            const nameList = candidateNames.length > 0
                ? candidateNames.join(', ')
                : `${candidateIds.length} candidate(s)`;

            await createNotification(
                clientId,
                'assignment',
                'New candidates assigned to you',
                `The following candidates have been assigned to your account: ${nameList}`,
                'user-check',
                'emerald',
                '/dashboard'
            );
        } catch (notifErr) {
            console.error('Failed to create assignment notification:', notifErr);
        }

        return NextResponse.json(assignment);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save assignment' }, { status: 500 });
    }
}

