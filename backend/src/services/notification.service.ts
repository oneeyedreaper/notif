import prisma from '../models/prisma.js';
import { CreateNotificationInput, ListNotificationsInput } from '../utils/validators.js';
import { createError } from '../middleware/error.js';
import { Prisma } from '@prisma/client';
import { addEmailJob, addSmsJob } from '../queues/index.js';

export class NotificationService {
    async create(data: CreateNotificationInput, userId: string) {
        const targetUserId = data.userId || userId;

        // Get user with preferences
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: { preferences: true },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        const notification = await prisma.notification.create({
            data: {
                userId: targetUserId,
                type: data.type,
                priority: data.priority,
                title: data.title,
                message: data.message,
                actionUrl: data.actionUrl,
                metadata: data.metadata as Prisma.JsonObject,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            },
            include: {
                user: {
                    select: { id: true, email: true, name: true, phone: true },
                },
            },
        });

        // Queue email if user has opted in and email is verified
        if (user.preferences?.emailEnabled && user.emailVerified) {
            console.log(`📧 [QUEUE] Queuing email for user ${user.email} - Notification: "${data.title}"`);
            await addEmailJob({
                notificationId: notification.id,
                to: user.email,
                subject: `[${data.type}] ${data.title}`,
                body: data.message,
            });
            console.log(`📧 [QUEUE] Email queued successfully for ${user.email}`);
        } else {
            console.log(`📧 [SKIP] Email not sent - emailEnabled: ${user.preferences?.emailEnabled}, emailVerified: ${user.emailVerified}`);
        }

        // Queue SMS if user has opted in and phone is verified
        if (user.preferences?.smsEnabled && user.phone && user.phoneVerified) {
            console.log(`📱 [QUEUE] Queuing SMS for user ${user.phone} - Notification: "${data.title}"`);
            const smsMessage = data.actionUrl
                ? `${data.title}: ${data.message}\n\nView: ${data.actionUrl}`
                : `${data.title}: ${data.message}`;
            await addSmsJob({
                notificationId: notification.id,
                to: user.phone,
                message: smsMessage,
            });
            console.log(`📱 [QUEUE] SMS queued successfully for ${user.phone}`);
        } else {
            console.log(`📱 [SKIP] SMS not sent - smsEnabled: ${user.preferences?.smsEnabled}, phone: ${user.phone ? 'exists' : 'none'}, phoneVerified: ${user.phoneVerified}`);
        }

        return notification;
    }

    async list(userId: string, filters: ListNotificationsInput) {
        const { page, limit, isRead, type, priority, startDate, endDate, sortBy, sortOrder } = filters;
        const skip = (page - 1) * limit;

        const where: Prisma.NotificationWhereInput = {
            userId,
            ...(isRead !== 'all' && { isRead: isRead === 'true' }),
            ...(type && { type }),
            ...(priority && { priority }),
            ...((startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) }),
                },
            }),
        };

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.notification.count({ where }),
        ]);

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + notifications.length < total,
            },
        };
    }

    async getById(id: string, userId: string) {
        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            throw createError('Notification not found', 404);
        }

        return notification;
    }

    async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        return { unreadCount: count };
    }

    async markAsRead(id: string, userId: string) {
        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            throw createError('Notification not found', 404);
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });

        return updated;
    }

    async markAllAsRead(userId: string) {
        const result = await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });

        return { count: result.count };
    }

    async delete(id: string, userId: string) {
        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            throw createError('Notification not found', 404);
        }

        await prisma.notification.delete({ where: { id } });

        return { message: 'Notification deleted successfully' };
    }

    async deleteAll(userId: string) {
        const result = await prisma.notification.deleteMany({
            where: { userId },
        });

        return { count: result.count };
    }
}

export const notificationService = new NotificationService();
