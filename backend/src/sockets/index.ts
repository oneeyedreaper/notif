import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../models/prisma.js';

let io: Server | null = null;

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

interface JwtPayload {
    userId: string;
    email: string;
}

export function initializeSocketIO(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: config.frontendUrl,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

            // Verify user exists
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true },
            });

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`🔌 User connected: ${socket.userId}`);

        // Join user-specific room
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Handle client requesting to mark notification as read
        socket.on('notification:mark-read', async (data: { notificationId: string }) => {
            if (!socket.userId) return;

            try {
                await prisma.notification.updateMany({
                    where: { id: data.notificationId, userId: socket.userId },
                    data: { isRead: true, readAt: new Date() },
                });

                // Broadcast to all user's devices
                io?.to(`user:${socket.userId}`).emit('notification:read', { id: data.notificationId });

                // Send updated unread count
                const unreadCount = await prisma.notification.count({
                    where: { userId: socket.userId, isRead: false },
                });
                io?.to(`user:${socket.userId}`).emit('unread-count:update', { unreadCount });
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        });

        // Handle client requesting to mark all as read
        socket.on('notification:mark-all-read', async () => {
            if (!socket.userId) return;

            try {
                await prisma.notification.updateMany({
                    where: { userId: socket.userId, isRead: false },
                    data: { isRead: true, readAt: new Date() },
                });

                io?.to(`user:${socket.userId}`).emit('notification:read-all', {});
                io?.to(`user:${socket.userId}`).emit('unread-count:update', { unreadCount: 0 });
            } catch (error) {
                console.error('Failed to mark all notifications as read:', error);
            }
        });

        // Handle ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong');
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.userId}`);
        });
    });

    return io;
}

export function getSocketIO(): Server | null {
    return io;
}

// Utility to emit to specific user
export function emitToUser(userId: string, event: string, data: unknown) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}
