import prisma from './prisma';
import { Candidate, Meeting, ClientChatSession, User, ClientAssignment, UserRole } from './types';

export const db = {
    // Candidate methods
    getCandidates: async (): Promise<Candidate[]> => {
        try {
            const candidates = await prisma.candidate.findMany({
                orderBy: { sortOrder: 'asc' }
            });
            return candidates as unknown as Candidate[];
        } catch (error) {
            console.error('Error getting candidates:', error);
            return [];
        }
    },

    getCandidateById: async (id: string): Promise<Candidate | undefined> => {
        try {
            const candidate = await prisma.candidate.findUnique({
                where: { id }
            });
            return (candidate as unknown as Candidate) || undefined;
        } catch (error) {
            return undefined;
        }
    },

    saveCandidate: async (candidate: Candidate): Promise<void> => {
        try {
            const exists = await prisma.candidate.findUnique({
                where: { id: candidate.id }
            });

            if (exists) {
                await prisma.candidate.update({
                    where: { id: candidate.id },
                    data: {
                        name: candidate.name,
                        email: candidate.email,
                        phone: candidate.phone,
                        title: candidate.title,
                        experience: candidate.experience,
                        skills: candidate.skills,
                        bio: candidate.bio,
                        resumeUrl: candidate.resumeUrl,
                        location: candidate.location,
                        availability: candidate.availability,
                        joiningDate: candidate.joiningDate ? new Date(candidate.joiningDate) : null,
                        imageUrl: candidate.imageUrl,
                        hiringCompanyLogo: candidate.hiringCompanyLogo,
                        hobbies: candidate.hobbies,
                        sortOrder: candidate.sortOrder,
                        recordingUrl: candidate.recordingUrl,
                        rankings: candidate.rankings || {},
                    }
                });
            } else {
                const maxOrder = await prisma.candidate.aggregate({
                    _max: { sortOrder: true }
                });
                const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

                await prisma.candidate.create({
                    data: {
                        id: candidate.id,
                        name: candidate.name,
                        email: candidate.email,
                        phone: candidate.phone,
                        title: candidate.title,
                        experience: candidate.experience,
                        skills: candidate.skills,
                        bio: candidate.bio,
                        resumeUrl: candidate.resumeUrl,
                        location: candidate.location,
                        availability: candidate.availability,
                        joiningDate: candidate.joiningDate ? new Date(candidate.joiningDate) : null,
                        imageUrl: candidate.imageUrl,
                        hiringCompanyLogo: candidate.hiringCompanyLogo,
                        hobbies: candidate.hobbies,
                        sortOrder: candidate.sortOrder ?? nextOrder,
                        recordingUrl: candidate.recordingUrl,
                        rankings: candidate.rankings || {},
                    }
                });
            }
        } catch (error) {
            console.error('Error saving candidate:', error);
        }
    },

    saveCandidates: async (candidates: Candidate[]): Promise<void> => {
        // Simple sequential save for now
        for (const candidate of candidates) {
            await db.saveCandidate(candidate);
        }
    },

    deleteCandidate: async (id: string): Promise<void> => {
        try {
            await prisma.candidate.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting candidate:', error);
        }
    },

    // Meeting methods
    getMeetings: async (): Promise<Meeting[]> => {
        try {
            const meetings = await prisma.meeting.findMany();
            return meetings as unknown as Meeting[];
        } catch (error) {
            return [];
        }
    },

    saveMeeting: async (meeting: Meeting): Promise<void> => {
        try {
            const exists = await prisma.meeting.findUnique({
                where: { id: meeting.id }
            });

            const data = {
                candidateId: meeting.candidateId,
                clientId: meeting.clientId,
                scheduledAt: new Date(meeting.scheduledAt),
                status: meeting.status,
                notes: meeting.notes,
                meetingType: meeting.meetingType || 'standard',
                participants: meeting.participants || [],
            };

            if (exists) {
                await prisma.meeting.update({
                    where: { id: meeting.id },
                    data
                });
            } else {
                await prisma.meeting.create({
                    data: {
                        id: meeting.id,
                        ...data
                    }
                });
            }
        } catch (error) {
            console.error('Error saving meeting:', error);
        }
    },

    // Client Chat methods
    getClientChats: async (): Promise<ClientChatSession[]> => {
        try {
            const sessions = await prisma.clientChatSession.findMany({
                include: { messages: true }
            });
            return sessions as unknown as ClientChatSession[];
        } catch (error) {
            return [];
        }
    },

    saveClientChat: async (session: ClientChatSession): Promise<void> => {
        try {
            const exists = await prisma.clientChatSession.findUnique({
                where: { id: session.id }
            });

            if (exists) {
                // Update session info and add new messages
                await prisma.clientChatSession.update({
                    where: { id: session.id },
                    data: {
                        lastMessageAt: new Date(session.lastMessageAt),
                    }
                });

                // For messages, we might want to only add new ones or replace. 
                // Given the existing JSON logic replaced the whole array, we'll do something similar or just append.
                // Simple approach: delete all and recreated (not ideal for prod but matches existing logic)
                await prisma.clientChatMessage.deleteMany({
                    where: { sessionId: session.id }
                });

                await prisma.clientChatMessage.createMany({
                    data: session.messages.map((m: any) => ({
                        sessionId: session.id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.timestamp)
                    }))
                });
            } else {
                await prisma.clientChatSession.create({
                    data: {
                        id: session.id,
                        clientEmail: session.clientEmail,
                        clientName: session.clientName,
                        startedAt: new Date(session.startedAt),
                        lastMessageAt: new Date(session.lastMessageAt),
                        messages: {
                            create: session.messages.map((m: any) => ({
                                role: m.role,
                                content: m.content,
                                timestamp: new Date(m.timestamp)
                            }))
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error saving client chat:', error);
        }
    },

    getClientChatsByEmail: async (email: string): Promise<ClientChatSession[]> => {
        try {
            const sessions = await prisma.clientChatSession.findMany({
                where: { clientEmail: email },
                include: { messages: true }
            });
            return sessions as unknown as ClientChatSession[];
        } catch (error) {
            return [];
        }
    },

    // User methods
    getUsers: async (): Promise<User[]> => {
        try {
            const users = await prisma.user.findMany();
            return users as unknown as User[];
        } catch (error) {
            return [];
        }
    },

    getUserById: async (id: string): Promise<User | undefined> => {
        try {
            const user = await prisma.user.findUnique({
                where: { id }
            });
            return (user as unknown as User) || undefined;
        } catch (error) {
            return undefined;
        }
    },

    getUserByEmail: async (email: string): Promise<User | undefined> => {
        try {
            const user = await prisma.user.findUnique({
                where: { email }
            });
            return (user as unknown as User) || undefined;
        } catch (error) {
            return undefined;
        }
    },

    saveUser: async (user: User): Promise<void> => {
        try {
            const exists = await prisma.user.findUnique({
                where: { id: user.id }
            });

            const data = {
                email: user.email,
                name: user.name,
                role: user.role as UserRole,
                hiringNeeds: user.hiringNeeds,
                targetEmployee: user.targetEmployee,
                softwareStack: user.softwareStack,
            };

            if (exists) {
                await prisma.user.update({
                    where: { id: user.id },
                    data
                });
            } else {
                await prisma.user.create({
                    data: {
                        id: user.id,
                        ...data
                    }
                });
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    },

    deleteUser: async (id: string): Promise<void> => {
        try {
            await prisma.user.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    },

    // Assignment methods
    getAssignments: async (): Promise<ClientAssignment[]> => {
        try {
            const assignments = await prisma.clientAssignment.findMany({
                include: { candidates: { orderBy: { sortOrder: 'asc' } } }
            });
            return assignments.map((a: any) => ({
                clientId: a.clientId,
                candidateIds: a.candidates.map((c: any) => c.candidateId),
                updatedAt: a.updatedAt.toISOString(),
                updatedBy: a.updatedBy
            }));
        } catch (error) {
            return [];
        }
    },

    getAssignmentByClient: async (clientId: string): Promise<ClientAssignment | undefined> => {
        try {
            const assignment = await prisma.clientAssignment.findUnique({
                where: { clientId },
                include: { candidates: { orderBy: { sortOrder: 'asc' } } }
            });
            if (!assignment) return undefined;
            return {
                clientId: assignment.clientId,
                candidateIds: assignment.candidates.map((c: any) => c.candidateId),
                updatedAt: assignment.updatedAt.toISOString(),
                updatedBy: assignment.updatedBy
            };
        } catch (error) {
            return undefined;
        }
    },

    saveAssignment: async (assignment: ClientAssignment): Promise<void> => {
        try {
            const exists = await prisma.clientAssignment.findUnique({
                where: { clientId: assignment.clientId }
            });

            if (exists) {
                await prisma.clientAssignment.update({
                    where: { clientId: assignment.clientId },
                    data: {
                        updatedAt: new Date(assignment.updatedAt),
                        updatedBy: assignment.updatedBy,
                    }
                });

                // Update candidate associations
                await prisma.candidateAssignment.deleteMany({
                    where: { assignmentId: exists.id }
                });

                await prisma.candidateAssignment.createMany({
                    data: assignment.candidateIds.map((id, index) => ({
                        assignmentId: exists.id,
                        candidateId: id,
                        sortOrder: index
                    }))
                });
            } else {
                const newAssignment = await prisma.clientAssignment.create({
                    data: {
                        clientId: assignment.clientId,
                        updatedAt: new Date(assignment.updatedAt),
                        updatedBy: assignment.updatedBy,
                    }
                });

                await prisma.candidateAssignment.createMany({
                    data: assignment.candidateIds.map((id, index) => ({
                        assignmentId: newAssignment.id,
                        candidateId: id,
                        sortOrder: index
                    }))
                });
            }
        } catch (error) {
            console.error('Error saving assignment:', error);
        }
    },
};
