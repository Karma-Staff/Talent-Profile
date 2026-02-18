import { Candidate, User, Meeting } from './types';

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'admin@restoration.com',
        name: 'Admin User',
        role: 'admin',
    },
    {
        id: 'user-2',
        email: 'cs@restoration.com',
        name: 'Sarah Johnson',
        role: 'customer_service',
    },
    {
        id: 'user-3',
        email: 'client1@gmail.com',
        name: 'Mike Anderson',
        role: 'client',
    },
];

// Mock Candidates with PII
export const mockCandidates: Candidate[] = [
    {
        id: 'cand-1',
        name: 'Alex Rivera',
        email: 'alex.rivera@email.com', // PII
        phone: '(555) 123-4567', // PII
        title: 'Water Damage Restoration Specialist',
        experience: 5,
        skills: ['Water Extraction', 'Mold Remediation', 'IICRC Certified', 'Customer Service'],
        bio: 'Experienced restoration professional with 5 years in water damage restoration. IICRC certified with expertise in emergency response and customer communication.',
        resumeUrl: '/resumes/alex-rivera.pdf',
        location: 'Miami, FL',
        availability: 'immediate',
        imageUrl: '/candidates/alex-rivera.jpg',
    },
    {
        id: 'cand-2',
        name: 'Jordan Chen',
        email: 'jordan.chen@email.com', // PII
        phone: '(555) 234-5678', // PII
        title: 'Fire & Smoke Damage Technician',
        experience: 3,
        skills: ['Fire Damage Restoration', 'Smoke Odor Removal', 'Content Cleaning', 'Safety Protocols'],
        bio: 'Detail-oriented technician specializing in fire and smoke damage restoration. Strong background in safety protocols and content restoration.',
        resumeUrl: '/resumes/jordan-chen.pdf',
        location: 'Phoenix, AZ',
        availability: 'two_weeks',
        imageUrl: 'https://ui-avatars.com/api/?name=Jordan+Chen&background=059669&color=fff&size=200',
    },
    {
        id: 'cand-3',
        name: 'Taylor Martinez',
        email: 'taylor.martinez@email.com', // PII
        phone: '(555) 345-6789', // PII
        title: 'Mold Remediation Expert',
        experience: 7,
        skills: ['Mold Assessment', 'Containment', 'Air Quality Testing', 'OSHA Certified'],
        bio: 'Senior mold remediation specialist with extensive experience in residential and commercial projects. OSHA certified and trained in latest containment techniques.',
        resumeUrl: '/resumes/taylor-martinez.pdf',
        location: 'Houston, TX',
        availability: 'immediate',
        imageUrl: 'https://ui-avatars.com/api/?name=Taylor+Martinez&background=7c3aed&color=fff&size=200',
    },
    {
        id: 'cand-4',
        name: 'Morgan Thompson',
        email: 'morgan.thompson@email.com', // PII
        phone: '(555) 456-7890', // PII
        title: 'Restoration Project Manager',
        experience: 10,
        skills: ['Project Management', 'Client Relations', 'Team Leadership', 'Insurance Claims'],
        bio: 'Seasoned project manager with a decade of experience coordinating large-scale restoration projects. Expertise in insurance claims and client communication.',
        resumeUrl: '/resumes/morgan-thompson.pdf',
        location: 'Denver, CO',
        availability: 'negotiable',
        imageUrl: 'https://ui-avatars.com/api/?name=Morgan+Thompson&background=dc2626&color=fff&size=200',
    },
    {
        id: 'cand-5',
        name: 'Casey Wilson',
        email: 'casey.wilson@email.com', // PII
        phone: '(555) 567-8901', // PII
        title: 'Emergency Response Technician',
        experience: 2,
        skills: ['Emergency Response', '24/7 Availability', 'Equipment Operation', 'Documentation'],
        bio: 'Dedicated emergency response technician available for urgent callouts. Trained in equipment operation and proper documentation procedures.',
        resumeUrl: '/resumes/casey-wilson.pdf',
        location: 'Seattle, WA',
        availability: 'immediate',
        imageUrl: 'https://ui-avatars.com/api/?name=Casey+Wilson&background=ea580c&color=fff&size=200',
    },
    {
        id: 'cand-6',
        name: 'Jamie Patterson',
        email: 'jamie.patterson@email.com', // PII
        phone: '(555) 678-9012', // PII
        title: 'Commercial Restoration Specialist',
        experience: 8,
        skills: ['Commercial Projects', 'Large Loss', 'Vendor Coordination', 'Quality Control'],
        bio: 'Commercial restoration expert with focus on large loss projects. Skilled in vendor coordination and maintaining quality standards on complex jobs.',
        resumeUrl: '/resumes/jamie-patterson.pdf',
        location: 'Atlanta, GA',
        availability: 'two_weeks',
        imageUrl: 'https://ui-avatars.com/api/?name=Jamie+Patterson&background=0891b2&color=fff&size=200',
    },
];

// Mock Meetings
export const mockMeetings: Meeting[] = [
    {
        id: 'meet-1',
        candidateId: 'cand-1',
        clientId: 'user-3',
        scheduledAt: new Date('2026-02-15T10:00:00'),
        status: 'scheduled',
        notes: 'Initial interview for water damage position',
        createdAt: new Date('2026-02-10T14:30:00'),
        updatedAt: new Date('2026-02-10T14:30:00'),
    },
    {
        id: 'meet-2',
        candidateId: 'cand-3',
        clientId: 'user-3',
        scheduledAt: new Date('2026-02-16T14:00:00'),
        status: 'scheduled',
        notes: 'Discussion about mold remediation projects',
        createdAt: new Date('2026-02-11T09:15:00'),
        updatedAt: new Date('2026-02-11T09:15:00'),
    },
];

// Helper functions
export function getCandidateById(id: string): Candidate | undefined {
    return mockCandidates.find((c) => c.id === id);
}

export function getMeetingsByClientId(clientId: string): Meeting[] {
    return mockMeetings.filter((m) => m.clientId === clientId);
}

export function getMeetingsByCandidateId(candidateId: string): Meeting[] {
    return mockMeetings.filter((m) => m.candidateId === candidateId);
}
