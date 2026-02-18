'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AgentChat } from '@/components/chat/AgentChat';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Bot, Shield } from 'lucide-react';

export default function AgentPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    if (!session) return null;

    if (user?.role !== 'admin' && user?.role !== 'customer_service') {
        redirect('/dashboard');
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
                        <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            AI Talent Agent
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-accent/15 text-accent border border-accent/20">
                                <Shield className="w-3 h-3" />
                                Admin Only
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Analyze candidates, evaluate fit, and get structured intelligence reports
                        </p>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-6">
                    <AgentChat />
                </div>
            </div>
        </DashboardLayout>
    );
}
