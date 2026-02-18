export type UserRole = 'admin' | 'customer_service' | 'client';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    // Client Questionnaire Fields
    hiringNeeds?: string; // What help they need most
    targetEmployee?: string; // What kind of employee they look for
    softwareStack?: string; // What software they use
}

export interface Candidate {
    id: string;
    name: string;
    email: string; // PII
    phone: string; // PII
    title: string;
    experience: number; // years
    skills: string[];
    bio: string;
    resumeUrl?: string; // made optional
    location: string;
    availability: 'immediate' | 'two_weeks' | 'negotiable' | 'hired' | 'specific_date';
    joiningDate?: string; // ISO date string
    imageUrl?: string;
    hiringCompanyLogo?: string;
    hobbies?: string[];
    sortOrder?: number;
    recordingUrl?: string;
    // Internal Grading
    rankings?: {
        personality: number; // 1-5
        accent: number;      // 1-5
        professionalism: number; // 1-5
        technical: number;   // 1-5
        likeability: number; // 1-5
        notes?: string;
    };
}

export interface Meeting {
    id: string;
    candidateId: string;
    clientId: string;
    scheduledAt: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    meetingType?: 'standard' | 'teams';
    participants?: string[];
}

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resourceType: 'candidate' | 'meeting' | 'user';
    resourceId: string;
    timestamp: Date;
    ipAddress?: string;
    details?: Record<string, any>;
}

export interface ClientChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ClientChatSession {
    id: string;
    clientEmail: string;
    clientName: string;
    startedAt: string;
    lastMessageAt: string;
    messages: ClientChatMessage[];
}

export interface ClientAssignment {
    clientId: string;
    candidateIds: string[]; // ordered list of assigned candidate IDs
    updatedAt: string;
    updatedBy: string;
}
