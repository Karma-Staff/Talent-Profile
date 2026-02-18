import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Candidate } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const candidates: Candidate[] = await request.json();

        if (!Array.isArray(candidates)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Update sortOrder for each candidate based on its position in the array
        const reorderedCandidates = candidates.map((candidate, index) => ({
            ...candidate,
            sortOrder: index,
        }));

        db.saveCandidates(reorderedCandidates);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to reorder candidates' }, { status: 500 });
    }
}
