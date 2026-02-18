import fs from 'fs';
import path from 'path';
import { Candidate, Meeting, ClientChatSession, User, ClientAssignment } from './types';
import { mockCandidates, mockUsers } from './data';

const DB_PATH = path.join(process.cwd(), 'data', 'candidates.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initialize DB with mock data if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(mockCandidates, null, 2));
}

const MEETINGS_PATH = path.join(process.cwd(), 'data', 'meetings.json');
if (!fs.existsSync(MEETINGS_PATH)) {
    const { mockMeetings } = require('./data');
    fs.writeFileSync(MEETINGS_PATH, JSON.stringify(mockMeetings, null, 2));
}

const CLIENT_CHATS_PATH = path.join(process.cwd(), 'data', 'client-chats.json');
if (!fs.existsSync(CLIENT_CHATS_PATH)) {
    fs.writeFileSync(CLIENT_CHATS_PATH, JSON.stringify([], null, 2));
}

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json');
if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(mockUsers, null, 2));
}

const ASSIGNMENTS_PATH = path.join(process.cwd(), 'data', 'assignments.json');
if (!fs.existsSync(ASSIGNMENTS_PATH)) {
    fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify([], null, 2));
}

export const db = {
    getCandidates: (): Candidate[] => {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            const candidates: Candidate[] = JSON.parse(data);
            return candidates.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        } catch (error) {
            return [];
        }
    },

    getCandidateById: (id: string): Candidate | undefined => {
        const candidates = db.getCandidates();
        return candidates.find((c) => c.id === id);
    },

    saveCandidate: (candidate: Candidate): void => {
        const candidates = db.getCandidates();
        const index = candidates.findIndex((c) => c.id === candidate.id);

        if (index >= 0) {
            candidates[index] = candidate;
        } else {
            // New candidate gets the highest sort order
            const maxOrder = Math.max(...candidates.map((c) => c.sortOrder || 0), -1);
            candidates.push({ ...candidate, sortOrder: maxOrder + 1 });
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(candidates, null, 2));
    },

    saveCandidates: (candidates: Candidate[]): void => {
        fs.writeFileSync(DB_PATH, JSON.stringify(candidates, null, 2));
    },

    deleteCandidate: (id: string): void => {
        const candidates = db.getCandidates();
        const filtered = candidates.filter((c) => c.id !== id);
        fs.writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2));
    },

    getMeetings: (): Meeting[] => {
        const MEETINGS_PATH = path.join(process.cwd(), 'data', 'meetings.json');
        if (!fs.existsSync(MEETINGS_PATH)) return [];
        try {
            const data = fs.readFileSync(MEETINGS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    },

    saveMeeting: (meeting: Meeting): void => {
        const MEETINGS_PATH = path.join(process.cwd(), 'data', 'meetings.json');
        const meetings = db.getMeetings();
        const index = meetings.findIndex((m) => m.id === meeting.id);

        if (index >= 0) {
            meetings[index] = meeting;
        } else {
            meetings.push(meeting);
        }

        fs.writeFileSync(MEETINGS_PATH, JSON.stringify(meetings, null, 2));
    },

    // Client Chat methods
    getClientChats: (): ClientChatSession[] => {
        try {
            const data = fs.readFileSync(CLIENT_CHATS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    },

    saveClientChat: (session: ClientChatSession): void => {
        const chats = db.getClientChats();
        const index = chats.findIndex((c) => c.id === session.id);

        if (index >= 0) {
            chats[index] = session;
        } else {
            chats.push(session);
        }

        fs.writeFileSync(CLIENT_CHATS_PATH, JSON.stringify(chats, null, 2));
    },

    getClientChatsByEmail: (email: string): ClientChatSession[] => {
        const chats = db.getClientChats();
        return chats.filter((c) => c.clientEmail === email);
    },

    // User methods
    getUsers: (): User[] => {
        try {
            const data = fs.readFileSync(USERS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    },

    getUserById: (id: string): User | undefined => {
        const users = db.getUsers();
        return users.find((u) => u.id === id);
    },

    getUserByEmail: (email: string): User | undefined => {
        const users = db.getUsers();
        return users.find((u) => u.email === email);
    },

    saveUser: (user: User): void => {
        const users = db.getUsers();
        const index = users.findIndex((u) => u.id === user.id);

        if (index >= 0) {
            users[index] = user;
        } else {
            users.push(user);
        }

        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    },

    deleteUser: (id: string): void => {
        const users = db.getUsers();
        const filtered = users.filter((u) => u.id !== id);
        fs.writeFileSync(USERS_PATH, JSON.stringify(filtered, null, 2));
    },

    // Assignment methods
    getAssignments: (): ClientAssignment[] => {
        try {
            const data = fs.readFileSync(ASSIGNMENTS_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    },

    getAssignmentByClient: (clientId: string): ClientAssignment | undefined => {
        const assignments = db.getAssignments();
        return assignments.find((a) => a.clientId === clientId);
    },

    saveAssignment: (assignment: ClientAssignment): void => {
        const assignments = db.getAssignments();
        const index = assignments.findIndex((a) => a.clientId === assignment.clientId);

        if (index >= 0) {
            assignments[index] = assignment;
        } else {
            assignments.push(assignment);
        }

        fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(assignments, null, 2));
    },
};
