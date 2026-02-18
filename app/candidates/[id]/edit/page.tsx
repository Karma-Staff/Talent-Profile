'use client';

import { useEffect, useState } from 'react';
import { CandidateForm } from '@/components/candidates/CandidateForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { canManageCandidates } from '@/lib/rbac';
import { Candidate } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditCandidatePage() {
    const { data: session } = useSession();
    const params = useParams();
    const user = session?.user as any;
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);

    // Protect route
    if (session && !canManageCandidates(user?.role)) {
        redirect('/dashboard');
    }

    useEffect(() => {
        async function fetchCandidate() {
            try {
                const res = await fetch('/api/candidates');
                const candidates = await res.json();
                const found = candidates.find((c: Candidate) => c.id === params.id);
                setCandidate(found || null);
            } catch (error) {
                console.error('Failed to fetch candidate', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCandidate();
    }, [params.id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!candidate) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-red-400">Candidate not found</h2>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Edit Candidate</h1>
                    <p className="text-muted-foreground">Update profile for {candidate.name}</p>
                </div>
                <CandidateForm mode="edit" initialData={candidate} />
            </div>
        </DashboardLayout>
    );
}
