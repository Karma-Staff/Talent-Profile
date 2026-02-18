'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { logAudit } from '@/lib/audit/logger';

export default function ScheduleMeetingPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        }>
            <ScheduleMeetingContent />
        </Suspense>
    );
}

function ScheduleMeetingContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const user = session?.user as any;

    const convertTimeTo24 = (time12h: string) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
        }
        return `${hours}:${minutes}`;
    };

    const candidateId = searchParams.get('candidateId') || '';
    const [candidate, setCandidate] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [meetingType, setMeetingType] = useState<'standard' | 'teams'>('teams');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [staffUsers, setStaffUsers] = useState<any[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

    useEffect(() => {
        // Fetch staff users for participants
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setStaffUsers(data))
            .catch(err => console.error('Error fetching staff:', err));

        if (candidateId) {
            fetch('/api/candidates')
                .then(res => res.json())
                .then(data => {
                    const found = data.find((c: any) => c.id === candidateId);
                    setCandidate(found);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [candidateId]);

    if (!session) return null;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!candidate) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-4">Candidate Not Found</h2>
                    <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
                </div>
            </DashboardLayout>
        );
    }

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const scheduledAt = new Date(`${selectedDate}T${convertTimeTo24(selectedTime)}`);

            // Save the meeting via API
            const response = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate.id,
                    clientId: user.id,
                    scheduledAt: scheduledAt.toISOString(),
                    notes: notes,
                    meetingType: meetingType,
                    participants: selectedParticipants
                }),
            });

            if (!response.ok) throw new Error('Failed to save meeting');

            // Log the scheduling action
            await logAudit(
                user.id,
                'schedule_meeting',
                'meeting',
                `meeting-${Date.now()}`,
                {
                    candidateId: candidate.id,
                    candidateName: candidate.name,
                    scheduledDate: selectedDate,
                    scheduledTime: selectedTime,
                    meetingType: meetingType,
                    participants: selectedParticipants,
                    notes: notes
                }
            );

            // Construct Teams Link with required attendees
            if (meetingType === 'teams') {
                const subject = `Meeting with ${candidate.name}`;
                const content = `Interview with ${candidate.name} for ${candidate.title} position.\n\nNotes: ${notes}`;
                const startTime = scheduledAt.toISOString();
                const endDate = new Date(scheduledAt.getTime() + 60 * 60 * 1000).toISOString();
                const requiredAttendees = ['service@karmastaff.com', 'Noida@karmastaff.com', 'sales@karmastaff.com'];
                const attendees = requiredAttendees.join(',');

                const teamsLink = `https://teams.microsoft.com/l/meeting/new?subject=${encodeURIComponent(subject)}&startTime=${startTime}&endTime=${endDate}&content=${encodeURIComponent(content)}&attendees=${attendees}`;

                // Open Teams link in new tab
                window.open(teamsLink, '_blank');
            }

            alert(`Meeting scheduled with ${candidate.name} on ${selectedDate} at ${selectedTime}`);
            router.push('/meetings');
        } catch (error) {
            alert('Failed to schedule meeting');
        } finally {
            setLoading(false);
        }
    };

    const toggleParticipant = (userId: string) => {
        setSelectedParticipants(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const timeSlots = [
        '09:00 AM',
        '10:00 AM',
        '11:00 AM',
        '12:00 PM',
        '01:00 PM',
        '02:00 PM',
        '03:00 PM',
        '04:00 PM',
    ];

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Schedule Meeting</h1>
                <p className="text-muted-foreground mb-8">
                    Book a meeting with {candidate.name}
                </p>

                <Card className="overflow-hidden">
                    <form onSubmit={handleSchedule} className="space-y-6">
                        {/* Candidate Info */}
                        <div className="p-6 border-b border-border bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Candidate</p>
                            <h3 className="text-2xl font-bold text-primary">{candidate.name}</h3>
                            <p className="text-muted-foreground">{candidate.title}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Meeting Method */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Meeting Method</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setMeetingType('standard')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${meetingType === 'standard'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-secondary/50 hover:bg-secondary'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meetingType === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <User className="w-5 h-5 text-current" />
                                        </div>
                                        <span className="font-medium text-sm">Standard</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMeetingType('teams')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${meetingType === 'teams'
                                            ? 'border-[#464775] bg-[#464775]/5'
                                            : 'border-border bg-secondary/50 hover:bg-secondary'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meetingType === 'teams' ? 'bg-[#464775] text-white' : 'bg-muted text-muted-foreground'}`}>
                                            <div className="font-bold">T</div>
                                        </div>
                                        <span className="font-medium text-sm">MS Teams</span>
                                    </button>
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="flex items-center text-sm font-medium">
                                        <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center text-sm font-medium">
                                        <Clock className="w-4 h-4 mr-2 text-primary" />
                                        Select Time
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setSelectedTime(time)}
                                                className={`px-4 py-2 rounded-lg text-[10px] transition-all ${selectedTime === time
                                                    ? 'bg-primary text-primary-foreground font-bold'
                                                    : 'bg-secondary hover:bg-secondary/80 border border-border'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium block">Team Participants</label>
                                <div className="flex flex-wrap gap-2">
                                    {staffUsers.map((staff) => (
                                        <button
                                            key={staff.id}
                                            type="button"
                                            onClick={() => toggleParticipant(staff.id)}
                                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${selectedParticipants.includes(staff.id)
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                }`}
                                        >
                                            {staff.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium block">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Topics for discussion..."
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-4 pt-4">
                                <Button type="submit" size="lg" className="w-full" disabled={loading || !selectedDate || !selectedTime}>
                                    {loading ? 'Scheduling...' : 'Confirm Meeting'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>

                                {selectedDate && selectedTime && meetingType === 'teams' && (
                                    <div className="p-4 rounded-xl border border-[#464775]/20 bg-[#464775]/5 animate-in fade-in duration-300">
                                        <Button
                                            type="button"
                                            className="w-full bg-[#464775] hover:bg-[#464775]/90 text-white"
                                            onClick={() => {
                                                const subject = `Meeting with ${candidate.name}`;
                                                const content = `Interview with ${candidate.name} for ${candidate.title} position.\n\nNotes: ${notes}`;
                                                const startTime = new Date(`${selectedDate}T${convertTimeTo24(selectedTime)}`).toISOString();
                                                const endDate = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
                                                const requiredAttendees = ['service@karmastaff.com', 'Noida@karmastaff.com', 'sales@karmastaff.com'];
                                                const attendees = requiredAttendees.join(',');

                                                const teamsLink = `https://teams.microsoft.com/l/meeting/new?subject=${encodeURIComponent(subject)}&startTime=${startTime}&endTime=${endDate}&content=${encodeURIComponent(content)}&attendees=${attendees}`;
                                                window.open(teamsLink, '_blank');
                                            }}
                                        >
                                            <div className="mr-2 h-5 w-5 bg-white rounded-sm flex items-center justify-center text-[10px] text-[#464775] font-extrabold">T</div>
                                            Generate Teams Link
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout >
    );
}
