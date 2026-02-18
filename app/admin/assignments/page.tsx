'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { Users, UserPlus, X, GripVertical, Check, ArrowRight, Briefcase } from 'lucide-react';
import { redirect } from 'next/navigation';
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
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface Candidate {
    id: string;
    name: string;
    title: string;
    experience: number;
    skills: string[];
    imageUrl?: string;
}

interface Assignment {
    clientId: string;
    candidateIds: string[];
    updatedAt: string;
    updatedBy: string;
}

// Sortable candidate row
function SortableCandidate({ candidate, onRemove }: { candidate: Candidate; onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: candidate.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-card group transition-all ${isDragging ? 'opacity-50 shadow-xl scale-[1.02]' : 'hover:border-primary/30'}`}
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {candidate.imageUrl ? (
                    <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{candidate.name}</p>
                <p className="text-xs text-muted-foreground truncate">{candidate.title}</p>
            </div>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">{candidate.experience}yr</span>
            <button
                onClick={() => onRemove(candidate.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-400/10 transition-all"
                title="Remove"
            >
                <X className="w-4 h-4 text-red-400" />
            </button>
        </div>
    );
}

export default function AssignCandidatesPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const [clients, setClients] = useState<User[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [assignedIds, setAssignedIds] = useState<string[]>([]);
    const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        Promise.all([
            fetch('/api/users?role=client').then(r => r.json()),
            fetch('/api/candidates').then(r => r.json()),
        ]).then(([clientData, candData]) => {
            setClients(clientData);
            setCandidates(candData);
            setLoading(false);
        });
    }, []);

    // Load existing assignment when client changes
    useEffect(() => {
        if (!selectedClient) {
            setAssignedIds([]);
            return;
        }

        if (selectedClient === 'all_assignments') {
            fetch('/api/assignments')
                .then(r => r.json())
                .then(data => {
                    setAllAssignments(data);
                    setAssignedIds([]);
                });
            return;
        }

        fetch(`/api/assignments?clientId=${selectedClient}`)
            .then(r => r.json())
            .then(data => {
                setAssignedIds(data.candidateIds || []);
                setSaved(false);
            });
    }, [selectedClient]);

    // Must be AFTER all hooks
    if (!session) return null;
    if (user?.role !== 'admin' && user?.role !== 'customer_service') {
        redirect('/dashboard');
    }

    const assignedCandidates = assignedIds
        .map(id => candidates.find(c => c.id === id))
        .filter(Boolean) as Candidate[];

    const availableCandidates = candidates.filter(c => !assignedIds.includes(c.id));

    const addCandidate = (id: string) => {
        setAssignedIds(prev => [...prev, id]);
        setSaved(false);
    };

    const removeCandidate = (id: string) => {
        setAssignedIds(prev => prev.filter(i => i !== id));
        setSaved(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = assignedIds.indexOf(active.id as string);
            const newIndex = assignedIds.indexOf(over.id as string);
            setAssignedIds(arrayMove(assignedIds, oldIndex, newIndex));
            setSaved(false);
        }
    };

    const handleSave = async () => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClient,
                    candidateIds: assignedIds,
                    updatedBy: user?.id,
                }),
            });
            setSaved(true);
        } catch (err) {
            alert('Failed to save assignments');
        } finally {
            setSaving(false);
        }
    };

    const selectedClientName = clients.find(c => c.id === selectedClient)?.name;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20">
                            <UserPlus className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Assign Candidates</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                Choose and order candidates for each client
                            </p>
                        </div>
                    </div>
                    {selectedClient && (
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 transition-all ${saved
                                ? 'bg-green-600 hover:bg-green-600'
                                : 'bg-gradient-to-r from-primary to-primary/80'
                                }`}
                        >
                            {saved ? <Check className="w-4 h-4" /> : null}
                            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Assignment'}
                        </Button>
                    )}
                </div>

                {/* Client Selector */}
                <Card className="p-5">
                    <label className="text-sm font-medium mb-2 block">Select Client</label>
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">— Choose a client —</option>
                        <option value="all_assignments" className="font-medium bg-secondary/50">
                            Show All Assignments
                        </option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                    </select>
                </Card>

                {/* Content Grid */}
                {/* Content Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Available Candidates */}
                        {selectedClient !== 'all_assignments' && (
                            <div>
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    All Candidates
                                    <span className="text-xs text-muted-foreground ml-1">({availableCandidates.length})</span>
                                </h2>
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                    {availableCandidates.map(c => (
                                        <div
                                            key={c.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-card transition-all ${selectedClient
                                                ? 'cursor-pointer hover:border-green-400/40 group'
                                                : 'opacity-60 cursor-not-allowed'}`}
                                            onClick={() => selectedClient && addCandidate(c.id)}
                                        >
                                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                                {c.imageUrl ? (
                                                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                        {c.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{c.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">{c.experience}yr</span>
                                            {selectedClient && (
                                                <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-green-400/10 transition-all">
                                                    <ArrowRight className="w-4 h-4 text-green-400" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {availableCandidates.length === 0 && (
                                        <p className="text-muted-foreground text-sm text-center py-8">
                                            {selectedClient ? 'All candidates assigned' : 'No candidates found'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Right: Assigned Candidates OR All Assignments View */}
                        <div className={selectedClient === 'all_assignments' ? 'col-span-1 lg:col-span-2' : ''}>
                            {selectedClient === 'all_assignments' ? (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                        All Client Assignments
                                    </h2>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {clients.map(client => {
                                            const clientAssignment = allAssignments.find(a => a.clientId === client.id);
                                            const clientCandidates = (clientAssignment?.candidateIds || [])
                                                .map(id => candidates.find(c => c.id === id))
                                                .filter(Boolean) as Candidate[];

                                            return (
                                                <Card key={client.id} className="flex flex-col h-full bg-card/50 hover:bg-card transition-colors">
                                                    <div className="p-4 border-b border-border bg-secondary/30">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-medium text-foreground">{client.name}</h3>
                                                                <p className="text-xs text-muted-foreground">{client.email}</p>
                                                            </div>
                                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                                {clientCandidates.length} assigned
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 flex-1">
                                                        {clientCandidates.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {clientCandidates.map(c => (
                                                                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border/50">
                                                                        <div className="w-8 h-8 rounded bg-background flex-shrink-0 overflow-hidden">
                                                                            {c.imageUrl ? (
                                                                                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                                    {c.name.split(' ').map(n => n[0]).join('')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-medium truncate">{c.name}</p>
                                                                            <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                                <UserPlus className="w-8 h-8 opacity-20 mb-2" />
                                                                <p className="text-sm opacity-60">No candidates assigned</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3 border-t border-border bg-secondary/10">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="w-full text-xs"
                                                            onClick={() => setSelectedClient(client.id)}
                                                        >
                                                            Manage Assignments
                                                        </Button>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : selectedClient ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-green-400" />
                                        Assigned to {selectedClientName}
                                        <span className="text-xs text-muted-foreground ml-1">({assignedCandidates.length})</span>
                                    </h2>

                                    {assignedCandidates.length > 0 ? (
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={assignedIds} strategy={verticalListSortingStrategy}>
                                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                                                    {assignedCandidates.map((c, idx) => (
                                                        <div key={c.id} className="flex items-center gap-2">
                                                            <span className="text-xs font-mono text-muted-foreground w-5 text-right">{idx + 1}.</span>
                                                            <div className="flex-1">
                                                                <SortableCandidate candidate={c} onRemove={removeCandidate} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    ) : (
                                        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                                            <UserPlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="text-muted-foreground text-sm">
                                                Click candidates on the left to assign them
                                            </p>
                                            <p className="text-muted-foreground/60 text-xs mt-1">
                                                Drag to reorder after assigning
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-secondary/5 text-center min-h-[300px]">
                                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                                        <UserPlus className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Select a Client</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        Choose a client from the dropdown above to manage their assigned candidates.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
