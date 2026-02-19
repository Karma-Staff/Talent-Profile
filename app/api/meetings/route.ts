import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Meeting } from '@/lib/types';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let meetings = await db.getMeetings();

    if (clientId) {
        meetings = meetings.filter(m => m.clientId === clientId);
    }

    return NextResponse.json(meetings);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.candidateId || !body.scheduledAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newMeeting: Meeting = {
            id: `meet-${Date.now()}`,
            candidateId: body.candidateId,
            clientId: body.clientId,
            scheduledAt: new Date(body.scheduledAt),
            status: body.status || 'scheduled',
            notes: body.notes || '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.saveMeeting(newMeeting);

        return NextResponse.json(newMeeting, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }
}
