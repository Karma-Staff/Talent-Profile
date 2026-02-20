import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/db';
import { Meeting } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { emailService } from '@/lib/email/service';

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
            meetingType: body.meetingType || 'standard',
            participants: body.participants || [],
        };

        await db.saveMeeting(newMeeting);

        // Fetch attendee details for notifications
        const [client, candidate] = await Promise.all([
            db.getUserById(body.clientId),
            db.getCandidateById(body.candidateId)
        ]);

        if (client && candidate) {
            const meetingDate = new Date(body.scheduledAt).toLocaleDateString();
            const meetingTime = new Date(body.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // 1. Notify Client
            await emailService.sendMeetingInvite({
                to: client.email,
                recipientName: client.name,
                candidateName: candidate.name,
                clientName: client.name,
                date: meetingDate,
                time: meetingTime,
                type: body.meetingType,
                notes: body.notes
            });

            // 2. Notify Candidate
            await emailService.sendMeetingInvite({
                to: candidate.email,
                recipientName: candidate.name,
                candidateName: candidate.name,
                clientName: client.name,
                date: meetingDate,
                time: meetingTime,
                type: body.meetingType,
                notes: body.notes
            });

            // 3. Notify Team Participants
            if (body.participants && body.participants.length > 0) {
                const participants = await Promise.all(
                    body.participants.map((id: string) => db.getUserById(id))
                );

                for (const participant of participants) {
                    if (participant) {
                        await emailService.sendMeetingInvite({
                            to: participant.email,
                            recipientName: participant.name,
                            candidateName: candidate.name,
                            clientName: client.name,
                            date: meetingDate,
                            time: meetingTime,
                            type: body.meetingType,
                            notes: body.notes
                        });
                    }
                }
            }

            // In-app notifications
            try {
                // Notify the client
                await createNotification(
                    body.clientId,
                    'meeting',
                    'New meeting scheduled',
                    `A meeting with ${candidate.name} has been scheduled on ${meetingDate} at ${meetingTime}.`,
                    'calendar',
                    'blue',
                    '/meetings'
                );

                // Notify each team participant
                if (body.participants && body.participants.length > 0) {
                    for (const pId of body.participants) {
                        await createNotification(
                            pId,
                            'meeting',
                            'You have been added to a meeting',
                            `A meeting with ${candidate.name} (client: ${client.name}) is scheduled on ${meetingDate} at ${meetingTime}.`,
                            'calendar',
                            'blue',
                            '/meetings'
                        );
                    }
                }
            } catch (notifErr) {
                console.error('Failed to create meeting notifications:', notifErr);
            }
        }

        return NextResponse.json(newMeeting, { status: 201 });
    } catch (error) {
        console.error('API Meeting Error:', error);
        return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
        }

        await db.deleteMeeting(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Meeting Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
    }
}
