import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notification.service.js';
import { createNotificationSchema, listNotificationsSchema } from '../utils/validators.js';
import { createError } from '../middleware/error.js';
import { getSocketIO } from '../sockets/index.js';

export class NotificationController {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const parsed = createNotificationSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const notification = await notificationService.create(parsed.data, req.user.id);

            // Emit real-time notification
            const io = getSocketIO();
            if (io) {
                const targetUserId = parsed.data.userId || req.user.id;
                io.to(`user:${targetUserId}`).emit('notification:new', { notification });

                // Also emit updated unread count
                const { unreadCount } = await notificationService.getUnreadCount(targetUserId);
                io.to(`user:${targetUserId}`).emit('unread-count:update', { unreadCount });
            }

            res.status(201).json({
                message: 'Notification created successfully',
                notification,
            });
        } catch (error) {
            next(error);
        }
    }

    async list(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const parsed = listNotificationsSchema.safeParse(req.query);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await notificationService.list(req.user.id, parsed.data);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const notification = await notificationService.getById(req.params.id, req.user.id);

            res.json({ notification });
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const result = await notificationService.getUnreadCount(req.user.id);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const notification = await notificationService.markAsRead(req.params.id, req.user.id);

            // Emit real-time update
            const io = getSocketIO();
            if (io) {
                io.to(`user:${req.user.id}`).emit('notification:read', { id: notification.id });
                const { unreadCount } = await notificationService.getUnreadCount(req.user.id);
                io.to(`user:${req.user.id}`).emit('unread-count:update', { unreadCount });
            }

            res.json({
                message: 'Notification marked as read',
                notification,
            });
        } catch (error) {
            next(error);
        }
    }

    async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const result = await notificationService.markAllAsRead(req.user.id);

            // Emit real-time update
            const io = getSocketIO();
            if (io) {
                io.to(`user:${req.user.id}`).emit('notification:read-all', {});
                io.to(`user:${req.user.id}`).emit('unread-count:update', { unreadCount: 0 });
            }

            res.json({
                message: 'All notifications marked as read',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const result = await notificationService.delete(req.params.id, req.user.id);

            // Emit real-time update for unread count
            const io = getSocketIO();
            if (io) {
                const { unreadCount } = await notificationService.getUnreadCount(req.user.id);
                io.to(`user:${req.user.id}`).emit('unread-count:update', { unreadCount });
            }

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const result = await notificationService.deleteAll(req.user.id);

            // Emit real-time update
            const io = getSocketIO();
            if (io) {
                io.to(`user:${req.user.id}`).emit('notification:delete-all', {});
                io.to(`user:${req.user.id}`).emit('unread-count:update', { unreadCount: 0 });
            }

            res.json({
                message: 'All notifications deleted',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const notificationController = new NotificationController();
