import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Candidate } from '@/lib/types';

export async function GET() {
    const candidates = await db.getCandidates();
    return NextResponse.json(candidates);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields (basic validation)
        if (!body.name || !body.email || !body.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newCandidate: Candidate = {
            ...body,
            id: body.id || `cand-${Date.now()}`, // Generate ID if not provided
            skills: body.skills || [],
        };

        await db.saveCandidate(newCandidate);

        return NextResponse.json(newCandidate, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 });
        }

        const existing = await db.getCandidateById(body.id);
        if (!existing) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }

        const updatedCandidate = { ...existing, ...body };
        await db.saveCandidate(updatedCandidate);

        return NextResponse.json(updatedCandidate);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 });
        }

        await db.deleteCandidate(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
    }
}
