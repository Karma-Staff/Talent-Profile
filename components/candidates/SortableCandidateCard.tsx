'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CandidateCard } from './CandidateCard';
import { Candidate, UserRole } from '@/lib/types';

interface SortableCandidateCardProps {
    candidate: Candidate;
    userRole: UserRole;
}

export function SortableCandidateCard({ candidate, userRole }: SortableCandidateCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: candidate.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <CandidateCard candidate={candidate} userRole={userRole} />
        </div>
    );
}
