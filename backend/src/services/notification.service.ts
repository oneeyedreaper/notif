import prisma from '../models/prisma.js';
import { CreateNotificationInput, ListNotificationsInput } from '../utils/validators.js';
import { createError } from '../middleware/error.js';
import { Prisma } from '@prisma/client';
import { addEmailJob, addSmsJob } from '../queues/index.js';

// Helper: Check if current time is within quiet hours and calculate delay
function getQuietHoursDelay(quietStart: string | null, quietEnd: string | null): number {
    if (!quietStart || !quietEnd) return 0;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    let isQuietHours = false;
    let delayMinutes = 0;

    if (startMinutes < endMinutes) {
        // Same day: e.g., 22:00 - 23:00 
        // Wait, this would be a short period. Let's handle overnight properly
        // Actually for same-day: 09:00 - 17:00 means quiet during work hours
        isQuietHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        if (isQuietHours) {
            delayMinutes = endMinutes - currentMinutes;
        }
    } else {
        // Overnight: e.g., 22:00 - 07:00 (start > end)
        isQuietHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
        if (isQuietHours) {
            if (currentMinutes >= startMinutes) {
                // After start time, delay until end time next day
                delayMinutes = (24 * 60 - currentMinutes) + endMinutes;
            } else {
                // Before end time, delay until end time today
                delayMinutes = endMinutes - currentMinutes;
            }
        }
    }

    if (isQuietHours) {
        console.log(`🌙 [QUIET HOURS] Currently in quiet hours (${quietStart} - ${quietEnd}). Delaying by ${delayMinutes} minutes.`);
    }

    return delayMinutes * 60 * 1000; // Convert to milliseconds
}

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

        // Calculate quiet hours delay
        const quietDelay = getQuietHoursDelay(
            user.preferences?.quietHoursStart || null,
            user.preferences?.quietHoursEnd || null
        );

        // Queue email if user has opted in and email is verified
        if (user.preferences?.emailEnabled && user.emailVerified) {
            console.log(`📧 [QUEUE] Queuing email for user ${user.email} - Notification: "${data.title}"`);

            // Use template if provided, otherwise use default body
            const emailBody = data.actionUrl
                ? `${data.message}\n\nView details: ${data.actionUrl}`
                : data.message;

            await addEmailJob({
                notificationId: notification.id,
                to: user.email,
                subject: `[${data.type}] ${data.title}`,
                body: emailBody,
                templateId: data.emailTemplateId,
                variables: data.templateVariables,
            }, quietDelay);

            if (data.emailTemplateId) {
                console.log(`📧 [QUEUE] Email will use template: ${data.emailTemplateId}`);
            }
            if (quietDelay > 0) {
                console.log(`📧 [QUEUE] Email scheduled to send after quiet hours (delay: ${Math.round(quietDelay / 60000)} min)`);
            } else {
                console.log(`📧 [QUEUE] Email queued successfully for ${user.email}`);
            }
        } else {
            console.log(`📧 [SKIP] Email not sent - emailEnabled: ${user.preferences?.emailEnabled}, emailVerified: ${user.emailVerified}`);
        }

        // Queue SMS if user has opted in and phone is verified
        if (user.preferences?.smsEnabled && user.phone && user.phoneVerified) {
            console.log(`📱 [QUEUE] Queuing SMS for user ${user.phone} - Notification: "${data.title}"`);

            // Use template if provided, otherwise use default message
            const smsMessage = data.actionUrl
                ? `${data.title}: ${data.message}\n\nView: ${data.actionUrl}`
                : `${data.title}: ${data.message}`;

            await addSmsJob({
                notificationId: notification.id,
                to: user.phone,
                message: smsMessage,
                templateId: data.smsTemplateId,
                variables: data.templateVariables,
            }, quietDelay);

            if (data.smsTemplateId) {
                console.log(`📱 [QUEUE] SMS will use template: ${data.smsTemplateId}`);
            }
            if (quietDelay > 0) {
                console.log(`📱 [QUEUE] SMS scheduled to send after quiet hours (delay: ${Math.round(quietDelay / 60000)} min)`);
            } else {
                console.log(`📱 [QUEUE] SMS queued successfully for ${user.phone}`);
            }
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
