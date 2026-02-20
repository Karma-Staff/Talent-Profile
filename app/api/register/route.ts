import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, password, role } = body;

        // Validation
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user exists directly in Postgres
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Determine Role
        const assignedRole = role === 'admin' || role === 'customer_service' ? role : 'client';

        // Create random ID matching existing schema
        const newUserId = `user-${Date.now()}`;

        // Add user directly to Postgres
        const newUser = await prisma.user.create({
            data: {
                id: newUserId,
                email,
                name,
                role: assignedRole,
            }
        });

        console.log(`[API] Successfully registered new user: ${email} (${assignedRole})`);

        return NextResponse.json(
            { message: 'User created successfully', user: { id: newUser.id, email: newUser.email, role: newUser.role } },
            { status: 201 }
        );
    } catch (error) {
        console.error('[API] Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error during registration' },
            { status: 500 }
        );
    }
}
