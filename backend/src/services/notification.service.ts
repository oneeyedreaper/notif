import prisma from '../models/prisma.js';
import { CreateNotificationInput, ListNotificationsInput } from '../utils/validators.js';
import { createError } from '../middleware/error.js';
import { Prisma } from '@prisma/client';

export class NotificationService {
    async create(data: CreateNotificationInput, userId: string) {
        const targetUserId = data.userId || userId;

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
                    select: { id: true, email: true, name: true },
                },
            },
        });

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
