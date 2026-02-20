import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

// GET — fetch notifications for the current user
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const notifications = await db.getNotifications(userId);

    // Sort by timestamp descending (newest first)
    notifications.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(notifications);
}

// POST — create a new notification
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, type, title, message, icon, color } = body;

        if (!userId || !title || !message) {
            return NextResponse.json({ error: 'userId, title, and message are required' }, { status: 400 });
        }

        const notification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            userId,
            type: type || 'info',
            title,
            message,
            icon: icon || 'info',
            color: color || 'sky',
            read: false,
            createdAt: new Date().toISOString(),
        };

        await db.saveNotification(notification);
        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error('API Notification Error:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}

// PUT — mark notifications as read
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { notificationId, userId, markAll } = body;

        if (markAll && userId) {
            await db.markAllNotificationsRead(userId);
            return NextResponse.json({ success: true });
        }

        if (notificationId) {
            await db.markNotificationRead(notificationId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'notificationId or markAll+userId required' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}

// DELETE — delete a notification
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db.deleteNotification(id);
    return NextResponse.json({ success: true });
}
