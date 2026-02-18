'use client';

import { CandidateForm } from '@/components/candidates/CandidateForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { canManageCandidates } from '@/lib/rbac';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function AddCandidatePage() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const router = useRouter();

    // Protect route
    if (session && !canManageCandidates(user?.role)) {
        redirect('/dashboard');
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                            <UserPlus className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Add Candidate</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">Fill in the details below to create a new candidate profile</p>
                        </div>
                    </div>
                </div>
                <CandidateForm mode="create" />
            </div>
        </DashboardLayout>
    );
}
