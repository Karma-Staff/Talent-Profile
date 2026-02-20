import { Candidate, User, Meeting, UserActivity } from './types';

// Mock Activities for anjan
export const mockActivities: Record<string, UserActivity[]> = {
    'user-1771517117874': [
        {
            id: 'act-1',
            type: 'login',
            action: 'Logged into the system',
            timestamp: 'Today, 10:30 AM',
        },
        {
            id: 'act-2',
            type: 'time_log',
            action: 'Started working session',
            timestamp: 'Today, 10:32 AM',
            status: 'working',
            timeRange: '10:32 AM - 12:45 PM',
            duration: '2h 13m',
        },
    ]
};

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'admin@restoration.com',
        name: 'Admin User',
        role: 'admin',
        avatarUrl: 'https://i.pravatar.cc/150?u=admin',
        jobTitle: 'System Administrator',
        department: 'Operations',
        memberSince: '2024-01-01',
    },
    {
        id: 'user-2',
        email: 'cs@restoration.com',
        name: 'Sarah Johnson',
        role: 'customer_service',
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
        jobTitle: 'Customer Success Manager',
        department: 'Support',
        memberSince: '2024-02-15',
    },
    {
        id: 'user-3',
        email: 'client1@gmail.com',
        name: 'Mike Anderson',
        role: 'client',
        avatarUrl: 'https://i.pravatar.cc/150?u=mike',
        jobTitle: 'Proprietor',
        department: 'Management',
        memberSince: '2024-03-10',
    },
    {
        id: 'user-1771197344333',
        name: 'PHIL',
        email: 'pca@puroclean.com',
        role: 'client',
        avatarUrl: 'https://i.pravatar.cc/150?u=phil',
        jobTitle: 'Owner',
        department: 'Operations',
    },
    {
        id: 'user-1771201683235',
        name: 'jimmy',
        email: 'jimmy@gmail.com',
        role: 'client',
        avatarUrl: 'https://i.pravatar.cc/150?u=jimmy',
    },
    {
        id: 'user-1771268194778',
        name: 'jyoticlient',
        email: 'jyoti@restoration.com',
        role: 'client',
    },
];

// Mock Candidates from images
export const mockCandidates: Candidate[] = [
    {
        id: 'cand-3',
        name: 'Anudeep Nautiyal',
        email: 'service@karmastaff.com',
        phone: '571-470-0093',
        title: 'Restoration Office Admin',
        experience: 3,
        skills: ['Attention to detail', 'Analytical thinking', 'Problem-solving'],
        bio: '* Delivered customer satisfaction scores consistently above 80 while supporting a US-based financial process.\n* Promoted to Claims Specialist for exceptional performance in handling complex and high-priority cases.\n* Reduced customer service resolution time by 30% and claims processing time by 20%.\n* Utilized Quantum software and CRM tools to streamline workflows and improve claims accuracy.',
        resumeUrl: '/uploads/Anudeep Resume 1-1770953644776-241894701.pdf',
        location: 'Dehradun, India',
        availability: 'immediate',
        imageUrl: '/uploads/Anudeep Nautiyal-1770949774102-219428566.png',
    },
    {
        id: 'cand-1770985320632',
        name: 'Gagan Rana',
        email: 'service@karmastaff.com',
        phone: '571-470-0093',
        title: 'Office Admin',
        experience: 10,
        skills: ['Customer relationship', 'Marketing', 'Revenue Management'],
        bio: 'A result oriented professional with (5+) Five plus Years of total experience in multi-disciplinary areas requiring diversified skills. Last associated with Allianz as Team Lead in Customer Relations department.',
        resumeUrl: '/uploads/ResumeGAGANRANA-1771029299260-353743430.pdf',
        location: 'Noida, India',
        availability: 'immediate',
        imageUrl: "/uploads/Gagan'sPP-1770985320033-283725498.jpg",
    },
    {
        id: 'cand-1771505343600',
        name: 'Manya Arora',
        email: 'service@karmastaff.com',
        phone: '571-470-0093',
        title: 'Admin',
        experience: 3,
        skills: ['Comm'],
        bio: 'Experienced in handling inbound calls( US Process), resolving customer issues, and maintaining professionalism across service-focused roles. Strong ability to manage complex customer complaints with empathy and effective communication.',
        resumeUrl: '/uploads/Manya Resume 1-1771505342987-480104506.pdf',
        location: 'Dehradun, India',
        availability: 'immediate',
        imageUrl: '/uploads/Manya Arora-1771505342946-75460678.jpeg',
    },
    {
        id: 'cand-1771505472931',
        name: 'Aman Vijetra',
        email: 'service@karmastaff.com',
        phone: '571-470-0093',
        title: 'Admin',
        experience: 0,
        skills: ['Customer Service', 'Time Management', 'Teamwork'],
        bio: 'Handles international customer interactions professionally through voice support at I Energizer (US Based process). Efficiently resolves customer queries while ensuring high quality standards and process adherence.',
        resumeUrl: '/uploads/Aman Resume 1-1771505472899-626895746.pdf',
        location: 'Dehradun, India',
        availability: 'immediate',
        imageUrl: '/uploads/Aman Vijetra-1771505472866-260769084.jpeg',
    },
    {
        id: 'cand-1771505800747',
        name: 'Anshul Uppal',
        email: 'service@karmastaff.com',
        phone: '571-470-0093',
        title: 'Admin',
        experience: 0,
        skills: ['Procurement', 'Supply Chain', 'Vendor Negotiations'],
        bio: 'Procurement & Supply Chain Specialist with strong experience in construction purchasing, vendor negotiations, inventory forecasting, and hospital supply operations.',
        imageUrl: "/uploads/Anshul'sPP-1771505800591-323252188.jpg",
        location: 'Noida, India',
        availability: 'immediate',
    },
    {
        id: 'cand-1771505931794',
        name: 'Pulkit Parvinda',
        email: 'service@karmastaff.com',
        phone: '571-470-0093',
        title: 'Admin',
        experience: 4,
        skills: ['Xactimate', 'CRM', 'Job Management'],
        bio: 'Estimating software: proficient in Xactimate - sketching floor plans, applying line items, and generating detailed estimates.',
        resumeUrl: '/uploads/Pulkit Resume-1771505931767-991779960.pdf',
        location: 'Dehradun, India',
        availability: 'two_weeks',
        imageUrl: '/uploads/Pulkit-1771505931736-843690631.jpeg',
    },
];

// Mock Meetings
export const mockMeetings: Meeting[] = [
    {
        id: 'meet-1',
        candidateId: 'cand-3',
        clientId: 'user-3',
        scheduledAt: new Date('2026-02-15T10:00:00'),
        status: 'scheduled',
        notes: 'Initial interview for restoration office admin position',
        createdAt: new Date('2026-02-10T14:30:00'),
        updatedAt: new Date('2026-02-10T14:30:00'),
    },
    {
        id: 'meet-2',
        candidateId: 'cand-1771505343600',
        clientId: 'user-3',
        scheduledAt: new Date('2026-02-16T14:00:00'),
        status: 'scheduled',
        notes: 'Discussion about admin role',
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
