import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma.js';
import { config } from '../config/index.js';
import { RegisterInput, LoginInput } from '../utils/validators.js';
import { createError } from '../middleware/error.js';
import { verificationService } from './verification.service.js';

export interface UpdateProfileInput {
    name?: string;
    phone?: string | null;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export class AuthService {
    async register(data: RegisterInput) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw createError('User with this email already exists', 400);
        }

        // Check if phone number is already in use
        if (data.phone) {
            const existingPhone = await prisma.user.findFirst({
                where: { phone: data.phone },
            });

            if (existingPhone) {
                throw createError('This phone number is already registered', 400);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
            },
        });

        // Create default preferences
        await prisma.userPreference.create({
            data: {
                userId: user.id,
            },
        });

        // Send verification email
        await verificationService.sendEmailVerification(user.id, user.email, user.name);

        // Don't return token - user must verify email first
        return {
            user,
            message: 'Registration successful! Please check your email to verify your account.'
        };
    }

    async login(data: LoginInput) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw createError('Invalid email or password', 401);
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw createError('Invalid email or password', 401);
        }

        // Check if email is verified
        if (!user.emailVerified) {
            const error = createError('Please verify your email before logging in', 403);
            (error as any).code = 'EMAIL_NOT_VERIFIED';
            (error as any).email = user.email;
            throw error;
        }

        // Generate token
        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        return user;
    }

    async updateProfile(userId: string, data: UpdateProfileInput) {
        // Check if phone number is already in use by another user
        if (data.phone) {
            const existingPhone = await prisma.user.findFirst({
                where: {
                    phone: data.phone,
                    NOT: { id: userId },
                },
            });

            if (existingPhone) {
                throw createError('This phone number is already registered by another user', 400);
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.phone !== undefined && { phone: data.phone || null }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        });

        return user;
    }

    async changePassword(userId: string, data: ChangePasswordInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);

        if (!isPasswordValid) {
            throw createError('Current password is incorrect', 400);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async deleteAccount(userId: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        // Verify password before deletion
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw createError('Password is incorrect', 400);
        }

        // Delete user and all related data (cascading delete)
        await prisma.user.delete({
            where: { id: userId },
        });

        return { message: 'Account deleted successfully' };
    }

    private generateToken(userId: string, email: string): string {
        const options: jwt.SignOptions = {
            expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
        };
        return jwt.sign(
            { userId, email },
            config.jwt.secret,
            options
        );
    }
}

export const authService = new AuthService();
