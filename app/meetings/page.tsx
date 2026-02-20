'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MeetingsPage() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const [candidates, setCandidates] = useState<any[]>([]);
    const [userMeetings, setUserMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [allStaff, setAllStaff] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setAllStaff(data))
            .catch(err => console.error(err));

        if (session && user) {
            Promise.all([
                fetch('/api/candidates').then(res => res.json()),
                fetch(`/api/meetings${user.role !== 'admin' && user.role !== 'customer_service' ? `?clientId=${user.id}` : ''}`).then(res => res.json())
            ]).then(([candidatesData, meetingsData]) => {
                setCandidates(candidatesData);
                setUserMeetings(meetingsData);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [session, user?.id, user?.role]);

    if (!session) {
        return null;
    }

    const getCandidate = (id: string) => candidates.find(c => c.id === id);
    const getStaffName = (id: string) => allStaff.find(s => s.id === id)?.name || id;


    const handleDelete = async (meetingId: string) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return;
        try {
            await fetch(`/api/meetings?id=${meetingId}`, { method: 'DELETE' });
            setUserMeetings(prev => prev.filter(m => m.id !== meetingId));
        } catch (err) {
            console.error('Failed to delete meeting:', err);
        }
    };

    const statusColors: Record<string, 'success' | 'warning' | 'info'> = {
        scheduled: 'info',
        completed: 'success',
        cancelled: 'warning',
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2 text-primary">Meetings</h1>
                    <p className="text-muted-foreground">
                        View and manage your scheduled meetings
                    </p>
                </div>

                {userMeetings.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-lg">No meetings scheduled yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Schedule a meeting with a candidate to get started
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {userMeetings.map((meeting) => {
                            const candidate = getCandidate(meeting.candidateId);
                            if (!candidate) return null;

                            return (
                                <Card key={meeting.id} hover={false} className="border-l-4 border-l-primary">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold">{candidate.name}</h3>
                                                <Badge variant={statusColors[meeting.status]}>
                                                    {meeting.status}
                                                </Badge>
                                                {meeting.meetingType === 'teams' && (
                                                    <Badge className="bg-[#464775] hover:bg-[#464775] text-white flex gap-1 items-center">
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        Teams
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="text-muted-foreground mb-4 text-sm font-medium">{candidate.title}</p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center text-muted-foreground">
                                                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                                                    {format(new Date(meeting.scheduledAt), 'MMMM dd, yyyy')}
                                                </div>
                                                <div className="flex items-center text-muted-foreground">
                                                    <Clock className="w-4 h-4 mr-2 text-primary" />
                                                    {format(new Date(meeting.scheduledAt), 'hh:mm a')}
                                                </div>
                                            </div>

                                            {meeting.participants && meeting.participants.length > 0 && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-primary" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {meeting.participants.map((pid: string) => (
                                                            <Badge key={pid} variant="outline" className="text-[10px] py-0">
                                                                {getStaffName(pid)}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {meeting.notes && (
                                                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
                                                    <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Notes:</p>
                                                    <p className="text-foreground/80">{meeting.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(meeting.id)}
                                            className="flex-shrink-0 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all"
                                            title="Delete meeting"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
