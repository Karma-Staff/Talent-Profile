'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

import { useSession } from 'next-auth/react';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    MapPin,
    Briefcase,
    Mail,
    Phone,
    Download,
    Calendar,
    Clock,
    FileText,
    Edit,
    Trash2,
    CheckCircle,
    X,
    Video,
    Star,
    Shield
} from 'lucide-react';
import { canViewPII, canScheduleMeetings, canManageCandidates } from '@/lib/rbac';
import { logAudit } from '@/lib/audit/logger';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

export default function CandidateProfilePage() {
    const params = useParams();
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user as any;
    const [candidate, setCandidate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [showResumePreview, setShowResumePreview] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (params?.id) {
            fetch('/api/candidates')
                .then(res => res.json())
                .then(data => {
                    const found = data.find((c: any) => c.id === params.id);
                    if (found) setCandidate(found);
                    else notFound();
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [params]);

    // Log profile view
    useEffect(() => {
        if (user?.id && candidate?.id) {
            logAudit(
                user.id,
                'view_profile',
                'candidate',
                candidate.id,
                { candidateName: candidate.name }
            ).catch((err: any) => console.error('Audit log failed:', err));
        }
    }, [user?.id, candidate?.id, candidate?.name]);



    if (!session) return null;

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </DashboardLayout>
    );

    if (!candidate) return notFound();

    const showPII = canViewPII(user?.role);
    const canSchedule = canScheduleMeetings(user?.role);
    const canEdit = canManageCandidates(user?.role);

    const handleDownloadResume = async () => {
        await logAudit(
            user.id,
            'download_resume',
            'candidate',
            candidate.id,
            { candidateName: candidate.name }
        );
        alert('Resume download initiated (demo)');
    };

    const handleScheduleMeeting = () => {
        router.push(`/meetings/schedule?candidateId=${candidate.id}`);
    };





    const handleSaveRanking = async (category: string, value: number) => {
        if (!candidate) return;

        const newRankings = {
            ...(candidate.rankings || {}),
            [category]: value
        };

        // Optimistic update
        setCandidate({ ...candidate, rankings: newRankings });

        try {
            await fetch('/api/candidates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: candidate.id,
                    rankings: newRankings
                })
            });
            // Optional: Show success toast
        } catch (error) {
            console.error('Failed to save ranking:', error);
            // Revert on error would be ideal here
        }
    };

    const StarRating = ({ value, onChange, label }: { value: number, onChange: (val: number) => void, label: string }) => (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onChange(star)}
                        className={`transition-all hover:scale-110 focus:outline-none ${star <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                    >
                        <Star className={`w-5 h-5 ${star <= (value || 0) ? 'fill-current' : ''}`} />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <Card>
                    <div className="flex items-start gap-6 mb-6">
                        {/* Profile Image */}
                        <div
                            className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex-shrink-0 border-2 border-border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => candidate.imageUrl && setShowPreview(true)}
                        >
                            {candidate.imageUrl ? (
                                <img
                                    src={candidate.imageUrl}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-2xl">
                                    {candidate.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{candidate.name}</h1>
                                    <p className="text-xl text-muted-foreground mb-2">{candidate.title}</p>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {candidate.location}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            {candidate.experience} years experience
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {(() => {
                                        if (candidate.availability === 'hired') {
                                            return (
                                                <div className="flex flex-col items-end gap-3">
                                                    <Badge variant="destructive-solid" className="text-lg py-1.5 px-4 font-bold uppercase tracking-wide animate-pulse">
                                                        HIRED
                                                    </Badge>
                                                    {candidate.hiringCompanyLogo && (
                                                        <div className="w-20 h-20 rounded-xl bg-white border border-border p-2 shadow-md flex items-center justify-center animate-in zoom-in duration-500">
                                                            <img src={candidate.hiringCompanyLogo} alt="Hired by" className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        if (candidate.availability === 'specific_date' && candidate.joiningDate) {
                                            return (
                                                <Badge variant="info-solid" className="text-lg py-1 px-4 font-semibold">
                                                    Available: {new Date(candidate.joiningDate).toLocaleDateString()}
                                                </Badge>
                                            );
                                        }
                                        const labels: Record<string, string> = {
                                            immediate: 'Immediate Hire',
                                            two_weeks: '2 Weeks Notice (7-15 Days)',
                                            negotiable: 'Negotiable',
                                            specific_date: 'Specific Date'
                                        };
                                        const variantMap: Record<string, any> = {
                                            immediate: 'success',
                                            two_weeks: 'warning',
                                            negotiable: 'info',
                                            specific_date: 'secondary'
                                        };
                                        return (
                                            <Badge variant={variantMap[candidate.availability] || 'success'} className="text-lg py-1 px-3">
                                                {labels[candidate.availability] || candidate.availability.replace('_', ' ')}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                        {canSchedule && (
                            <Button onClick={handleScheduleMeeting}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Meeting
                            </Button>
                        )}
                        {showPII && (
                            <Button variant="secondary" onClick={handleDownloadResume}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Profile
                            </Button>
                        )}
                        {candidate.resumeUrl && (
                            <Button variant="outline" onClick={() => setShowResumePreview(true)}>
                                <FileText className="w-4 h-4 mr-2" />
                                View Resume
                            </Button>
                        )}
                        {canEdit && (
                            <>
                                <Button variant="outline" onClick={() => router.push(`/candidates/${candidate.id}/edit`)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this candidate?')) {
                                            // Log the deletion
                                            await logAudit(
                                                user.id,
                                                'delete_candidate',
                                                'candidate',
                                                candidate.id,
                                                { candidateName: candidate.name }
                                            );

                                            await fetch(`/api/candidates?id=${candidate.id}`, { method: 'DELETE' });
                                            router.push('/dashboard');
                                            router.refresh();
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                                {candidate.availability !== 'hired' && (
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={async () => {
                                            if (confirm('Mark this candidate as HIRED?')) {
                                                // Log the action
                                                await logAudit(
                                                    user.id,
                                                    'update_candidate',
                                                    'candidate',
                                                    candidate.id,
                                                    { action: 'mark_hired', name: candidate.name }
                                                );

                                                await fetch('/api/candidates', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: candidate.id, availability: 'hired' })
                                                });
                                                window.location.reload();
                                            }
                                        }}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Hired
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                {/* Contact Info (PII) */}
                {showPII && (
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Mail className="w-5 h-5 mr-3 text-primary" />
                                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                                    {candidate.email}
                                </a>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-5 h-5 mr-3 text-primary" />
                                <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                                    {candidate.phone}
                                </a>
                            </div>
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm text-accent">
                            🔒 This information is confidential and logged for compliance
                        </div>
                    </Card>
                )}

                {/* Resume Preview Modal */}
                {mounted && showResumePreview && createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                        onClick={() => setShowResumePreview(false)}
                    >
                        <button
                            onClick={() => setShowResumePreview(false)}
                            className="fixed top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 z-[10000]"
                        >
                            <X className="w-10 h-10" />
                        </button>
                        <div
                            className="relative w-full max-w-5xl h-[85vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold text-lg">Resume Preview</h3>
                                <a
                                    href={candidate.resumeUrl}
                                    download
                                    className="text-primary hover:underline text-sm flex items-center"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download File
                                </a>
                            </div>
                            <iframe
                                src={candidate.resumeUrl}
                                className="w-full flex-1 bg-gray-100"
                                title="Resume Preview"
                            />
                        </div>
                    </div>,
                    document.body
                )}

                {/* Image Preview Modal */}
                {mounted && showPreview && createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                        onClick={() => setShowPreview(false)}
                    >
                        <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <img
                                src={candidate.imageUrl}
                                alt={candidate.name}
                                className="w-full h-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                            />
                        </div>
                    </div>,
                    document.body
                )}

                {/* Internal Grading - Admin & CS Only */}
                {(user?.role === 'admin' || user?.role === 'customer_service') && (
                    <Card className="border-t-4 border-t-purple-500">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-purple-600" />
                            <h2 className="text-xl font-semibold">Internal Candidate Grading</h2>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Internal Use Only</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StarRating
                                label="Personality"
                                value={candidate.rankings?.personality || 0}
                                onChange={(val) => handleSaveRanking('personality', val)}
                            />
                            <StarRating
                                label="Accent / Clarity"
                                value={candidate.rankings?.accent || 0}
                                onChange={(val) => handleSaveRanking('accent', val)}
                            />
                            <StarRating
                                label="Professionalism"
                                value={candidate.rankings?.professionalism || 0}
                                onChange={(val) => handleSaveRanking('professionalism', val)}
                            />
                            <StarRating
                                label="Technical Skills"
                                value={candidate.rankings?.technical || 0}
                                onChange={(val) => handleSaveRanking('technical', val)}
                            />
                            <StarRating
                                label="Likeability"
                                value={candidate.rankings?.likeability || 0}
                                onChange={(val) => handleSaveRanking('likeability', val)}
                            />
                        </div>
                    </Card>
                )}

                {/* About */}
                <Card>
                    <h2 className="text-xl font-semibold mb-4">About</h2>
                    <p className="text-muted-foreground leading-relaxed">{candidate.bio}</p>
                </Card>

                {/* Recording — Admin/CS always see section, Clients only if recording exists */}
                {(canEdit || candidate.recordingUrl) && (
                    <Card>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Video className="w-5 h-5 text-primary" />
                            Candidate Recording
                        </h2>
                        {candidate.recordingUrl ? (
                            <video
                                src={candidate.recordingUrl}
                                controls
                                className="w-full rounded-lg max-h-[400px] bg-black"
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Video className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No recording uploaded yet</p>
                                <p className="text-xs mt-1 opacity-60">Add a recording via the Edit page</p>
                            </div>
                        )}
                    </Card>
                )}

                {/* Skills */}
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Skills & Certifications</h2>
                    <div className="flex flex-wrap gap-2">
                        {candidate.skills?.map((skill: string) => (
                            <Badge key={skill} variant="info">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </Card>

                {/* Hobbies */}
                {candidate.hobbies && candidate.hobbies.length > 0 && (
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Hobbies & Interests</h2>
                        <div className="flex flex-wrap gap-2">
                            {candidate.hobbies.map((hobby: string) => (
                                <Badge key={hobby} variant="default">
                                    {hobby}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
