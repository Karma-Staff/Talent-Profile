import prisma from './prisma';
import { Candidate, Meeting, ClientChatSession, User, ClientAssignment, UserRole } from './types';
import { mockCandidates, mockMeetings, mockUsers } from './data';
import fs from 'fs';
import path from 'path';

const PERSISTENCE_PATH = path.join(process.cwd(), 'data', 'persistence.json');
const NOTIFICATIONS_PATH = path.join(process.cwd(), 'data', 'notifications.json');
const ASSIGNMENTS_PATH = path.join(process.cwd(), 'data', 'assignments.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(PERSISTENCE_PATH))) {
    fs.mkdirSync(path.dirname(PERSISTENCE_PATH), { recursive: true });
}

// Notification types
export interface AppNotification {
    id: string;
    userId: string;
    type: 'assignment' | 'meeting' | 'system' | 'info';
    title: string;
    message: string;
    icon: string;
    color: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

// Read notifications from file
function getNotificationsData(): AppNotification[] {
    if (!fs.existsSync(NOTIFICATIONS_PATH)) return [];
    try {
        const data = fs.readFileSync(NOTIFICATIONS_PATH, 'utf8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

// Write notifications to file
function saveNotificationsData(notifications: AppNotification[]) {
    fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2));
}

// Read assignments from file
function getAssignmentsData(): ClientAssignment[] {
    if (!fs.existsSync(ASSIGNMENTS_PATH)) return [];
    try {
        const data = fs.readFileSync(ASSIGNMENTS_PATH, 'utf8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

// Write assignments to file
function saveAssignmentsData(assignments: ClientAssignment[]) {
    fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(assignments, null, 2));
}

// Helper to create + persist a notification from anywhere in the server code
export async function createNotification(userId: string, type: AppNotification['type'], title: string, message: string, icon = 'info', color = 'sky', link?: string) {
    const notification: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId,
        type,
        title,
        message,
        icon,
        color,
        link,
        read: false,
        createdAt: new Date().toISOString(),
    };
    const all = getNotificationsData();
    all.push(notification);
    saveNotificationsData(all);
    return notification;
}

async function getPersistentData(): Promise<{ candidates: Candidate[], meetings: Meeting[], users: User[] }> {
    if (!fs.existsSync(PERSISTENCE_PATH)) return { candidates: [], meetings: [], users: [] };
    try {
        const data = fs.readFileSync(PERSISTENCE_PATH, 'utf8');
        const parsed = JSON.parse(data);
        return {
            candidates: parsed.candidates || [],
            meetings: parsed.meetings || [],
            users: parsed.users || [],
        };
    } catch (error) {
        return { candidates: [], meetings: [], users: [] };
    }
}

async function savePersistentData(data: { candidates: Candidate[], meetings: Meeting[], users: User[] }): Promise<void> {
    try {
        fs.writeFileSync(PERSISTENCE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to save persistent fallback data:', error);
    }
}

export const db = {
    // Candidate methods
    getCandidates: async (): Promise<Candidate[]> => {
        try {
            const dbCandidates = await prisma.candidate.findMany({
                orderBy: { sortOrder: 'asc' }
            });

            // Merge DB, Mock, and Persistent candidates
            const { candidates: persistentCandidates } = await getPersistentData();
            const combined = [...dbCandidates];
            const dbIds = new Set(dbCandidates.map(c => c.id));

            for (const p of persistentCandidates) {
                if (!dbIds.has(p.id)) {
                    combined.push(p as any);
                    dbIds.add(p.id);
                }
            }

            for (const mock of mockCandidates) {
                if (!dbIds.has(mock.id)) {
                    combined.push(mock as any);
                    dbIds.add(mock.id);
                }
            }

            return combined as unknown as Candidate[];
        } catch (error) {
            console.error('Error getting candidates, falling back to mock/persistent data:', error);
            const { candidates: persistentCandidates } = await getPersistentData();

            // Combine mock and persistent, preferring persistent by ID
            const combined = [...persistentCandidates];
            const pIds = new Set(persistentCandidates.map(c => c.id));

            for (const mock of mockCandidates) {
                if (!pIds.has(mock.id)) {
                    combined.push(mock as any);
                }
            }

            return combined as unknown as Candidate[];
        }
    },

    getCandidateById: async (id: string): Promise<Candidate | undefined> => {
        try {
            const candidate = await prisma.candidate.findUnique({
                where: { id }
            });
            if (candidate) return candidate as unknown as Candidate;

            // Check persistence
            const { candidates } = await getPersistentData();
            const pCandidate = candidates.find(c => c.id === id);
            if (pCandidate) return pCandidate;

            // Fallback to mock data
            return mockCandidates.find(c => c.id === id);
        } catch (error) {
            const { candidates } = await getPersistentData();
            const pCandidate = candidates.find(c => c.id === id);
            if (pCandidate) return pCandidate;

            return mockCandidates.find(c => c.id === id);
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
            console.error('Error saving candidate to DB, falling back to file persistence:', error);
            try {
                const data = await getPersistentData();
                const index = data.candidates.findIndex(c => c.id === candidate.id);
                if (index >= 0) {
                    data.candidates[index] = candidate;
                } else {
                    data.candidates.push(candidate);
                }
                await savePersistentData(data);
            } catch (pError) {
                console.error('File persistence failed:', pError);
                throw error; // Throw original error if even fallback fails
            }
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
            // 1. Delete dependent records first to avoid foreign key constraints
            await prisma.meeting.deleteMany({ where: { candidateId: id } });

            // 2. Handle Assignments
            // Cascade through junctions
            await prisma.candidateAssignment.deleteMany({ where: { candidateId: id } });

            // 3. Finally delete the candidate from DB
            await prisma.candidate.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting candidate from DB:', error);
        }

        // 4. Remove from persistent data
        try {
            const data = await getPersistentData();
            const filtered = data.candidates.filter(c => c.id !== id);
            if (filtered.length !== data.candidates.length) {
                data.candidates = filtered;
                await savePersistentData(data);
            }
        } catch (pError) {
            console.error('File persistence delete failed:', pError);
        }
    },

    // Meeting methods
    getMeetings: async (): Promise<Meeting[]> => {
        try {
            const dbMeetings = await prisma.meeting.findMany();

            // Merge DB, Mock, and Persistent meetings
            const { meetings: persistentMeetings } = await getPersistentData();
            const combined = [...dbMeetings];
            const dbIds = new Set(dbMeetings.map(m => m.id));

            for (const p of persistentMeetings) {
                if (!dbIds.has(p.id)) {
                    combined.push(p as any);
                    dbIds.add(p.id);
                }
            }

            for (const mock of mockMeetings) {
                if (!dbIds.has(mock.id)) {
                    combined.push(mock as any);
                    dbIds.add(mock.id);
                }
            }

            return combined as unknown as Meeting[];
        } catch (error) {
            console.error('Error getting meetings, falling back to mock/persistent data:', error);
            const { meetings: persistentMeetings } = await getPersistentData();

            const combined = [...persistentMeetings];
            const pIds = new Set(persistentMeetings.map(m => m.id));

            for (const mock of mockMeetings) {
                if (!pIds.has(mock.id)) {
                    combined.push(mock as any);
                }
            }

            return combined as unknown as Meeting[];
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
            console.error('Error saving meeting to DB, falling back to file persistence:', error);
            try {
                const data = await getPersistentData();
                const index = data.meetings.findIndex(m => m.id === meeting.id);
                if (index >= 0) {
                    data.meetings[index] = meeting;
                } else {
                    data.meetings.push(meeting);
                }
                await savePersistentData(data);
            } catch (pError) {
                console.error('File persistence failed:', pError);
                // Don't throw here to avoid breaking UI if possible, or decide based on UX
            }
        }
    },

    deleteMeeting: async (id: string): Promise<void> => {
        try {
            await prisma.meeting.delete({ where: { id } });
        } catch (error) {
            console.error('Error deleting meeting from DB:', error);
        }
        // Also remove from persistent data if it exists there
        try {
            const data = await getPersistentData();
            const filtered = data.meetings.filter(m => m.id !== id);
            if (filtered.length !== data.meetings.length) {
                data.meetings = filtered;
                await savePersistentData(data);
            }
        } catch (pError) {
            console.error('File persistence delete failed:', pError);
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
            const dbUsers = await prisma.user.findMany();

            // Merge DB, Mock, and Persistent users
            const { users: persistentUsers } = await getPersistentData();
            const combined = [...dbUsers];
            const dbIds = new Set(dbUsers.map(u => u.id));

            for (const p of persistentUsers) {
                if (!dbIds.has(p.id)) {
                    combined.push(p as any);
                    dbIds.add(p.id);
                }
            }

            for (const mock of mockUsers) {
                if (!dbIds.has(mock.id)) {
                    combined.push(mock as any);
                    dbIds.add(mock.id);
                }
            }

            return combined as unknown as User[];
        } catch (error) {
            console.error('Error getting users, falling back to mock/persistent data:', error);
            const { users: persistentUsers } = await getPersistentData();

            const combined = [...persistentUsers];
            const pIds = new Set(persistentUsers.map(u => u.id));

            for (const mock of mockUsers) {
                if (!pIds.has(mock.id)) {
                    combined.push(mock as any);
                }
            }

            return combined as unknown as User[];
        }
    },

    getUserById: async (id: string): Promise<User | undefined> => {
        try {
            const user = await prisma.user.findUnique({
                where: { id }
            });
            if (user) return user as unknown as User;

            const { users: persistentUsers } = await getPersistentData();
            const pUser = persistentUsers.find(u => u.id === id);
            if (pUser) return pUser;

            return mockUsers.find(u => u.id === id);
        } catch (error) {
            const { users: persistentUsers } = await getPersistentData();
            const pUser = persistentUsers.find(u => u.id === id);
            if (pUser) return pUser;

            return mockUsers.find(u => u.id === id);
        }
    },

    getUserByEmail: async (email: string): Promise<User | undefined> => {
        try {
            const user = await prisma.user.findUnique({
                where: { email }
            });
            if (user) return user as unknown as User;

            const { users: persistentUsers } = await getPersistentData();
            const pUser = persistentUsers.find(u => u.email === email);
            if (pUser) return pUser;

            return mockUsers.find(u => u.email === email);
        } catch (error) {
            const { users: persistentUsers } = await getPersistentData();
            const pUser = persistentUsers.find(u => u.email === email);
            if (pUser) return pUser;

            return mockUsers.find(u => u.email === email);
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
            console.error('Error saving user to DB, falling back to file persistence:', error);
            try {
                const data = await getPersistentData();
                const index = data.users.findIndex(u => u.id === user.id);
                if (index >= 0) {
                    data.users[index] = user;
                } else {
                    data.users.push(user);
                }
                await savePersistentData(data);
            } catch (pError) {
                console.error('File persistence failed:', pError);
                throw error;
            }
        }
    },

    deleteUser: async (id: string): Promise<void> => {
        try {
            // 1. Delete dependent records first to avoid foreign key constraints
            await prisma.meeting.deleteMany({ where: { clientId: id } });
            await prisma.auditLog.deleteMany({ where: { userId: id } });

            // 2. Handle Chat sessions (cascading messages if necessary)
            const sessions = await prisma.clientChatSession.findMany({ where: { userId: id } });
            for (const session of sessions) {
                await prisma.clientChatMessage.deleteMany({ where: { sessionId: session.id } });
            }
            await prisma.clientChatSession.deleteMany({ where: { userId: id } });

            // 3. Handle Assignments
            const assignments = await prisma.clientAssignment.findMany({ where: { clientId: id } });
            for (const assignment of assignments) {
                await prisma.candidateAssignment.deleteMany({ where: { assignmentId: assignment.id } });
            }
            await prisma.clientAssignment.deleteMany({ where: { clientId: id } });

            // 4. Finally delete the user from DB
            await prisma.user.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Error deleting user from DB:', error);
        }

        // 5. Remove from persistent data
        try {
            const data = await getPersistentData();
            const filtered = data.users.filter(u => u.id !== id);
            if (filtered.length !== data.users.length) {
                data.users = filtered;
                await savePersistentData(data);
            }
        } catch (pError) {
            console.error('File persistence delete failed:', pError);
        }
    },

    // Assignment methods — with JSON file fallback
    getAssignments: async (): Promise<ClientAssignment[]> => {
        try {
            const assignments = await prisma.clientAssignment.findMany({
                include: { candidates: { orderBy: { sortOrder: 'asc' } } }
            });
            const dbAssignments = assignments.map((a: any) => ({
                clientId: a.clientId,
                candidateIds: a.candidates.map((c: any) => c.candidateId),
                updatedAt: a.updatedAt.toISOString(),
                updatedBy: a.updatedBy
            }));
            // Merge with file-based assignments
            const fileAssignments = getAssignmentsData();
            const dbClientIds = new Set(dbAssignments.map(a => a.clientId));
            for (const fa of fileAssignments) {
                if (!dbClientIds.has(fa.clientId)) {
                    dbAssignments.push(fa);
                }
            }
            return dbAssignments;
        } catch (error) {
            // Fallback to JSON file
            return getAssignmentsData();
        }
    },

    getAssignmentByClient: async (clientId: string): Promise<ClientAssignment | undefined> => {
        try {
            const assignment = await prisma.clientAssignment.findUnique({
                where: { clientId },
                include: { candidates: { orderBy: { sortOrder: 'asc' } } }
            });
            if (assignment) {
                return {
                    clientId: assignment.clientId,
                    candidateIds: assignment.candidates.map((c: any) => c.candidateId),
                    updatedAt: assignment.updatedAt.toISOString(),
                    updatedBy: assignment.updatedBy
                };
            }
            // Not found in DB, check JSON file
            const fileAssignments = getAssignmentsData();
            return fileAssignments.find(a => a.clientId === clientId);
        } catch (error) {
            // Fallback to JSON file
            const fileAssignments = getAssignmentsData();
            return fileAssignments.find(a => a.clientId === clientId);
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
            console.error('Error saving assignment to DB, falling back to JSON file:', error);
            // Fallback: save to JSON file
            const allAssignments = getAssignmentsData();
            const idx = allAssignments.findIndex(a => a.clientId === assignment.clientId);
            if (idx >= 0) {
                allAssignments[idx] = assignment;
            } else {
                allAssignments.push(assignment);
            }
            saveAssignmentsData(allAssignments);
        }
    },

    // Notification methods
    async getNotifications(userId: string): Promise<AppNotification[]> {
        const all = getNotificationsData();
        return all.filter(n => n.userId === userId);
    },

    async saveNotification(notification: AppNotification): Promise<void> {
        const all = getNotificationsData();
        all.push(notification);
        saveNotificationsData(all);
    },

    async markNotificationRead(notificationId: string): Promise<void> {
        const all = getNotificationsData();
        const idx = all.findIndex(n => n.id === notificationId);
        if (idx !== -1) {
            all[idx].read = true;
            saveNotificationsData(all);
        }
    },

    async markAllNotificationsRead(userId: string): Promise<void> {
        const all = getNotificationsData();
        for (const n of all) {
            if (n.userId === userId) n.read = true;
        }
        saveNotificationsData(all);
    },

    async deleteNotification(notificationId: string): Promise<void> {
        const all = getNotificationsData();
        saveNotificationsData(all.filter(n => n.id !== notificationId));
    },
};
