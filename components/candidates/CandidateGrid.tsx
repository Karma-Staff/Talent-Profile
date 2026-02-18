'use client';

import { useState, useMemo, useEffect } from 'react';
import { Candidate } from '@/lib/types';
import { Search, SlidersHorizontal } from 'lucide-react';
import { UserRole } from '@/lib/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCandidateCard } from './SortableCandidateCard';

interface CandidateGridProps {
    candidates: Candidate[];
    userRole: UserRole;
}

export function CandidateGrid({ candidates: initialCandidates, userRole }: CandidateGridProps) {
    // Local state for candidates to support reordering
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
    const [searchTerm, setSearchTerm] = useState('');
    const [experienceFilter, setExperienceFilter] = useState<string>('all');
    const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

    // Update local state when props change
    useEffect(() => {
        setCandidates(initialCandidates);
    }, [initialCandidates]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = candidates.findIndex((item) => item.id === active.id);
            const newIndex = candidates.findIndex((item) => item.id === over.id);

            const newCandidates = arrayMove(candidates, oldIndex, newIndex);
            setCandidates(newCandidates);

            // Persist the new order
            try {
                const res = await fetch('/api/candidates/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCandidates),
                });

                if (!res.ok) throw new Error('Failed to persist order');
            } catch (error) {
                console.error('Error saving candidates order:', error);
                // Optionally revert local state or show alert
            }
        }
    }

    const filteredCandidates = useMemo(() => {
        // Filter based on the *current ordered* candidates state
        return candidates.filter((candidate) => {
            const matchesSearch =
                candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.skills.some((skill) =>
                    skill.toLowerCase().includes(searchTerm.toLowerCase())
                );

            const matchesExperience =
                experienceFilter === 'all' ||
                (experienceFilter === '0-3' && candidate.experience <= 3) ||
                (experienceFilter === '4-7' && candidate.experience >= 4 && candidate.experience <= 7) ||
                (experienceFilter === '8+' && candidate.experience >= 8);

            const matchesAvailability =
                availabilityFilter === 'all' || candidate.availability === availabilityFilter;

            return matchesSearch && matchesExperience && matchesAvailability;
        });
    }, [candidates, searchTerm, experienceFilter, availabilityFilter]);

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="glass p-6 rounded-lg space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, title, or skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                        <label className="text-sm font-medium">Experience:</label>
                        <select
                            value={experienceFilter}
                            onChange={(e) => setExperienceFilter(e.target.value)}
                            className="px-3 py-1 rounded-lg bg-secondary border border-border text-sm"
                        >
                            <option value="all">All</option>
                            <option value="0-3">0-3 years</option>
                            <option value="4-7">4-7 years</option>
                            <option value="8+">8+ years</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Availability:</label>
                        <select
                            value={availabilityFilter}
                            onChange={(e) => setAvailabilityFilter(e.target.value)}
                            className="px-3 py-1 rounded-lg bg-secondary border border-border text-sm"
                        >
                            <option value="all">All</option>
                            <option value="immediate">Immediate</option>
                            <option value="two_weeks">Two Weeks</option>
                            <option value="negotiable">Negotiable</option>
                        </select>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Showing {filteredCandidates.length} of {candidates.length} candidates
                </p>
            </div>

            {/* Candidate Grid with Drag and Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={filteredCandidates.map(c => c.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCandidates.map((candidate) => (
                            <SortableCandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                userRole={userRole}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {filteredCandidates.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No candidates found matching your criteria</p>
                </div>
            )}
        </div>
    );
}
