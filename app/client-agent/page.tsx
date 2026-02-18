'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RecruiterChat } from '@/components/chat/RecruiterChat';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function ClientAgentPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    if (!session) return null;

    // Allow client and admin roles
    if (user?.role !== 'client' && user?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-400/10 border border-blue-500/20">
                        <MessageSquare className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            Find Your Perfect Hire
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                <Sparkles className="w-3 h-3" />
                                AI Powered
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Tell us what you need we&apos;ll match you with the right virtual team member
                        </p>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-6">
                    <RecruiterChat clientEmail={user?.email} clientName={user?.name} />
                </div>
            </div>
        </DashboardLayout>
    );
}
