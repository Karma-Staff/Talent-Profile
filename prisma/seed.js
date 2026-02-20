require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting seed...');

    const dataDir = path.join(__dirname, '../data');

    // Helper to read JSON
    const readJson = (file) => {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    };

    // 1. Seed Users
    const users = readJson('users.json');
    if (users) {
        console.log(`Seeding ${users.length} users...`);
        for (const user of users) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: {
                    name: user.name,
                    role: user.role,
                    hiringNeeds: user.hiringNeeds,
                    targetEmployee: user.targetEmployee,
                    softwareStack: user.softwareStack,
                },
                create: {
                    id: user.id || undefined,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    hiringNeeds: user.hiringNeeds,
                    targetEmployee: user.targetEmployee,
                    softwareStack: user.softwareStack,
                },
            });
        }
    }

    // 2. Seed Candidates
    const candidates = readJson('candidates.json');
    if (candidates) {
        console.log(`Seeding ${candidates.length} candidates...`);
        for (const cand of candidates) {
            await prisma.candidate.upsert({
                where: { id: cand.id },
                update: {
                    name: cand.name,
                    email: cand.email,
                    phone: cand.phone,
                    title: cand.title,
                    experience: cand.experience,
                    skills: cand.skills,
                    bio: cand.bio,
                    resumeUrl: cand.resumeUrl,
                    location: cand.location,
                    availability: cand.availability,
                    joiningDate: cand.joiningDate ? cand.joiningDate : undefined,
                    imageUrl: cand.imageUrl,
                    recordingUrl: cand.recordingUrl,
                    sortOrder: cand.sortOrder || 0,
                    rankings: cand.rankings || {},
                    hobbies: cand.hobbies || [],
                },
                create: {
                    id: cand.id,
                    name: cand.name,
                    email: cand.email,
                    phone: cand.phone,
                    title: cand.title,
                    experience: cand.experience,
                    skills: cand.skills,
                    bio: cand.bio,
                    resumeUrl: cand.resumeUrl,
                    location: cand.location,
                    availability: cand.availability,
                    joiningDate: cand.joiningDate ? cand.joiningDate : undefined,
                    imageUrl: cand.imageUrl,
                    recordingUrl: cand.recordingUrl,
                    sortOrder: cand.sortOrder || 0,
                    rankings: cand.rankings || {},
                    hobbies: cand.hobbies || [],
                },
            });
        }
    }

    // 3. Seed Meetings
    const meetings = readJson('meetings.json');
    if (meetings) {
        console.log(`Seeding ${meetings.length} meetings...`);
        for (const meet of meetings) {
            await prisma.meeting.upsert({
                where: { id: meet.id },
                update: {
                    candidateId: meet.candidateId,
                    clientId: meet.clientId,
                    scheduledAt: new Date(meet.scheduledAt),
                    status: meet.status,
                    notes: meet.notes,
                },
                create: {
                    id: meet.id,
                    candidateId: meet.candidateId,
                    clientId: meet.clientId,
                    scheduledAt: new Date(meet.scheduledAt),
                    status: meet.status,
                    notes: meet.notes,
                },
            });
        }
    }

    // 4. Seed Assignments
    const assignments = readJson('assignments.json');
    if (assignments) {
        console.log(`Seeding ${assignments.length} assignments...`);
        for (const assign of assignments) {
            const assignment = await prisma.clientAssignment.upsert({
                where: { clientId: assign.clientId },
                update: {
                    updatedBy: assign.updatedBy,
                    updatedAt: new Date(assign.updatedAt),
                },
                create: {
                    clientId: assign.clientId,
                    updatedBy: assign.updatedBy,
                    updatedAt: new Date(assign.updatedAt),
                },
            });

            // Clear old candidates for this assignment and add new ones
            await prisma.assignmentCandidate.deleteMany({
                where: { assignmentClientId: assign.clientId },
            });

            await prisma.assignmentCandidate.createMany({
                data: assign.candidateIds.map((cid, index) => ({
                    assignmentClientId: assign.clientId,
                    candidateId: cid,
                    sortOrder: index,
                })),
            });
        }
    }

    // 5. Seed Client Chats
    const clientChats = readJson('client-chats.json');
    if (clientChats) {
        console.log(`Seeding ${clientChats.length} client chats...`);
        for (const chat of clientChats) {
            await prisma.clientChatSession.upsert({
                where: { id: chat.id },
                update: {
                    clientEmail: chat.clientEmail,
                    clientName: chat.clientName,
                    startedAt: new Date(chat.startedAt),
                    lastMessageAt: new Date(chat.lastMessageAt),
                },
                create: {
                    id: chat.id,
                    clientEmail: chat.clientEmail,
                    clientName: chat.clientName,
                    startedAt: new Date(chat.startedAt),
                    lastMessageAt: new Date(chat.lastMessageAt),
                    messages: {
                        create: chat.messages.map(m => ({
                            role: m.role,
                            content: m.content,
                            timestamp: new Date(m.timestamp),
                        })),
                    },
                },
            });
        }
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
