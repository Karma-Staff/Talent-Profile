'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateGrid } from '@/components/candidates/CandidateGrid';
import { WelcomeOverlay } from '@/components/ui/WelcomeOverlay';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Plus, PartyPopper, UserPlus } from 'lucide-react';
import { canManageCandidates } from '@/lib/rbac';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user as any;
    const isClient = user?.role === 'client';
    const [candidates, setCandidates] = useState([]);

    useEffect(() => {
        if (!user?.id) return;

        if (isClient) {
            // Client: fetch all candidates + their assignment, then filter and order
            Promise.all([
                fetch('/api/candidates').then(r => r.json()),
                fetch(`/api/assignments?clientId=${user.id}`).then(r => r.json()),
            ]).then(([allCandidates, assignment]) => {
                if (assignment?.candidateIds?.length > 0) {
                    // Show only assigned candidates in the admin-chosen order
                    const ordered = assignment.candidateIds
                        .map((id: string) => allCandidates.find((c: any) => c.id === id))
                        .filter(Boolean);
                    setCandidates(ordered);
                } else {
                    // No assignments yet — show empty list (only assigned candidates are visible)
                    setCandidates([]);
                }
            }).catch(err => console.error(err));
        } else {
            // Admin/CS: show all candidates
            fetch('/api/candidates')
                .then(res => res.json())
                .then(data => setCandidates(data))
                .catch(err => console.error(err));
        }
    }, [user?.id, isClient]);

    const canAdd = canManageCandidates(user?.role);

    const handleCelebrate = () => {
        const karmaColors = ['#0052cc', '#ff9900', '#ffffff', '#22c55e'];

        // 1. Center Burst (The Main "Pop")
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: karmaColors,
        });

        // 2. Left Side Cannon (Delayed slightly)
        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: karmaColors,
            });
        }, 200);

        // 3. Right Side Cannon (Delayed slightly)
        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: karmaColors,
            });
        }, 400);
    };

    return (
        <DashboardLayout>
            {isClient && <WelcomeOverlay userName={user?.name} userId={user?.id} />}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Restore with Us</h1>
                        <p className="text-muted-foreground">
                            Browse and connect with top restoration talent
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleCelebrate}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-200 rounded-xl px-5 py-3 font-semibold flex items-center gap-2"
                        >
                            <PartyPopper className="w-5 h-5" />
                            Celebrate
                        </Button>
                        {canAdd && (
                            <Button
                                onClick={() => router.push('/dashboard/add')}
                                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200 rounded-xl px-6 py-3 font-semibold flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Candidate
                            </Button>
                        )}
                    </div>
                </div>

                {isClient && candidates.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                            <UserPlus className="w-10 h-10 text-primary/60" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">No Candidates Assigned Yet</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Your account manager will assign candidates tailored to your needs. Please check back soon or contact your account manager.
                        </p>
                    </div>
                ) : (
                    <CandidateGrid candidates={candidates} userRole={user?.role} />
                )}
            </div>
        </DashboardLayout>
    );
}
