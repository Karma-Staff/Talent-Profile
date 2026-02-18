'use client';

import { Candidate } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Briefcase, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { canViewPII } from '@/lib/rbac';
import { UserRole } from '@/lib/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CandidateCardProps {
    candidate: Candidate;
    userRole: UserRole;
}

export function CandidateCard({ candidate, userRole }: CandidateCardProps) {
    const showPII = canViewPII(userRole);
    const [showPreview, setShowPreview] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getAvailabilityBadge = (candidate: Candidate) => {
        if (candidate.availability === 'hired') {
            return (
                <div className="flex flex-col items-end gap-2">
                    <Badge variant="destructive-solid" className="text-md py-1 px-3 font-bold animate-pulse">
                        HIRED
                    </Badge>
                    {candidate.hiringCompanyLogo && (
                        <div className="w-12 h-12 rounded-lg bg-white border border-border p-1 shadow-sm flex items-center justify-center animate-in zoom-in duration-300">
                            <img src={candidate.hiringCompanyLogo} alt="Hired by" className="max-w-full max-h-full object-contain" />
                        </div>
                    )}
                </div>
            );
        }

        if (candidate.availability === 'specific_date' && candidate.joiningDate) {
            return (
                <Badge variant="info-solid" className="text-sm py-1 px-3 font-semibold shadow-sm">
                    Available: {new Date(candidate.joiningDate).toLocaleDateString()}
                </Badge>
            );
        }

        const labels: Record<string, string> = {
            immediate: 'Immediate Hire',
            two_weeks: '2 Weeks Notice (7-15 Days)',
            negotiable: 'Negotiable',
            specific_date: 'Specific Date',
        };

        const variantMap: Record<string, any> = {
            immediate: 'success',
            two_weeks: 'warning',
            negotiable: 'info',
            specific_date: 'default',
        };

        return (
            <Badge variant={variantMap[candidate.availability] || 'secondary'}>
                {labels[candidate.availability] || candidate.availability.replace('_', ' ')}
            </Badge>
        );
    };

    const handleImageClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation(); // Prevent drag start if applicable
        if (candidate.imageUrl) {
            setShowPreview(true);
        }
    };

    const closePreview = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPreview(false);
    };

    return (
        <>
            <Link href={`/candidates/${candidate.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start gap-4 mb-4">
                        {/* Profile Image */}
                        <div
                            className="w-16 h-16 rounded-full overflow-hidden bg-primary/20 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleImageClick}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {candidate.imageUrl ? (
                                <img
                                    src={candidate.imageUrl}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xl">
                                    {candidate.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">{candidate.name}</h3>
                                    <p className="text-muted-foreground">{candidate.title}</p>
                                </div>
                                {getAvailabilityBadge(candidate)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-4 mt-2">{candidate.bio}</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2" />
                            {candidate.location}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Briefcase className="w-4 h-4 mr-2" />
                            {candidate.experience} years experience
                        </div>
                        {showPII && (
                            <div className="flex items-center text-sm text-primary">
                                <Calendar className="w-4 h-4 mr-2" />
                                {candidate.email}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="default">
                                {skill}
                            </Badge>
                        ))}
                        {candidate.skills.length > 3 && (
                            <Badge variant="default">+{candidate.skills.length - 3} more</Badge>
                        )}
                    </div>
                </Card>
            </Link>

            {/* Image Preview Modal */}
            {mounted && showPreview && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={closePreview}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent dnd-kit from capturing events
                >
                    <button
                        onClick={closePreview}
                        className="fixed top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 z-[10000]"
                    >
                        <X className="w-10 h-10" />
                    </button>
                    <div className="relative max-w-7xl max-h-[95vh] w-full flex items-center justify-center">
                        <img
                            src={candidate.imageUrl}
                            alt={candidate.name}
                            className="w-auto h-auto max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
                            onClick={closePreview}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
