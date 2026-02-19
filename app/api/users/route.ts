import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let users = await db.getUsers();

    if (role) {
        users = users.filter(user => user.role === role);
    }

    return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const requesterRole = (session?.user as any)?.role;

        const body = await req.json();
        const { name, email, role, hiringNeeds, targetEmployee, softwareStack } = body;

        if (!name || !email || !role) {
            return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
        }

        // Restrict Customer Service to creating Client users only
        if (requesterRole === 'customer_service' && role !== 'client') {
            return NextResponse.json({ error: 'Unauthorized: Customer Service can only create Client users' }, { status: 403 });
        }

        // Check for duplicate email
        const existing = await db.getUserByEmail(email);
        if (existing) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }

        const validRoles: UserRole[] = ['admin', 'customer_service', 'client'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: role as UserRole,
            // Only add these for clients
            ...(role === 'client' ? { hiringNeeds, targetEmployee, softwareStack } : {}),
        };

        await db.saveUser(newUser);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const requesterRole = (session?.user as any)?.role;

        const body = await req.json();
        const { id, name, email, role, hiringNeeds, targetEmployee, softwareStack } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const existing = await db.getUserById(id);
        if (!existing) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Restrict Customer Service checks
        if (requesterRole === 'customer_service') {
            // Cannot edit non-client users
            if (existing.role !== 'client') {
                return NextResponse.json({ error: 'Unauthorized: Can only edit Client users' }, { status: 403 });
            }
            // Cannot change role to anything other than client
            if (role && role !== 'client') {
                return NextResponse.json({ error: 'Unauthorized: Can only assign Client role' }, { status: 403 });
            }
        }

        // Check for email conflict with other users
        if (email && email !== existing.email) {
            const emailTaken = await db.getUserByEmail(email);
            if (emailTaken) {
                return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
            }
        }

        const updatedUser = {
            ...existing,
            name: name || existing.name,
            email: email || existing.email,
            role: role || existing.role,
            // Update optional fields if provided or if role is client
            ...((role === 'client' || existing.role === 'client') ? {
                hiringNeeds: hiringNeeds !== undefined ? hiringNeeds : existing.hiringNeeds,
                targetEmployee: targetEmployee !== undefined ? targetEmployee : existing.targetEmployee,
                softwareStack: softwareStack !== undefined ? softwareStack : existing.softwareStack,
            } : {}),
        } as any;

        await db.saveUser(updatedUser);
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure only admins can delete users
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized: Only admins can delete users' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const existing = await db.getUserById(id);
        if (!existing) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deleting the last admin
        if (existing.role === 'admin') {
            const admins = (await db.getUsers()).filter(u => u.role === 'admin');
            if (admins.length <= 1) {
                return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 400 });
            }
        }

        await db.deleteUser(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
