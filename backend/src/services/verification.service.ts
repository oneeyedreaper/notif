import crypto from 'crypto';
import prisma from '../models/prisma.js';
import { createError } from '../middleware/error.js';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';

export class VerificationService {
    // Generate a random token for email verification
    private generateEmailToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Generate a 6-digit OTP for phone verification
    private generatePhoneOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send email verification
    async sendEmailVerification(userId: string, email: string, name: string) {
        const token = this.generateEmailToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save token to user
        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerifyToken: token,
                emailVerifyExpires: expires,
            },
        });

        // Send verification email
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

        await emailService.sendEmail({
            to: email,
            subject: 'Verify your email address',
            body: `
                <h1>Welcome to NotifyHub, ${name}!</h1>
                <p>Please verify your email address by clicking the link below:</p>
                <p><a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
                <p>Or copy this link: ${verifyUrl}</p>
                <p>This link expires in 24 hours.</p>
                <p>If you didn't create an account, you can ignore this email.</p>
            `,
        });

        return { message: 'Verification email sent' };
    }

    // Verify email with token
    async verifyEmail(token: string) {
        const user = await prisma.user.findFirst({
            where: {
                emailVerifyToken: token,
                emailVerifyExpires: { gt: new Date() },
            },
        });

        if (!user) {
            throw createError('Invalid or expired verification token', 400);
        }

        // Update user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null,
                emailVerifyExpires: null,
            },
        });

        return { message: 'Email verified successfully' };
    }

    // Send phone verification OTP
    async sendPhoneVerification(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        if (!user.phone) {
            throw createError('No phone number on file. Please add a phone number first.', 400);
        }

        if (user.phoneVerified) {
            throw createError('Phone number is already verified', 400);
        }

        const otp = this.generatePhoneOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user
        await prisma.user.update({
            where: { id: userId },
            data: {
                phoneVerifyCode: otp,
                phoneVerifyExpires: expires,
            },
        });

        // Send SMS with OTP
        await smsService.sendSms({
            to: user.phone,
            body: `Your NotifyHub verification code is: ${otp}. This code expires in 10 minutes.`,
        });

        return { message: 'Verification code sent to your phone' };
    }

    // Verify phone with OTP
    async verifyPhone(userId: string, code: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        if (!user.phoneVerifyCode || !user.phoneVerifyExpires) {
            throw createError('No verification code found. Please request a new code.', 400);
        }

        if (new Date() > user.phoneVerifyExpires) {
            throw createError('Verification code has expired. Please request a new code.', 400);
        }

        if (user.phoneVerifyCode !== code) {
            throw createError('Invalid verification code', 400);
        }

        // Update user as phone verified
        await prisma.user.update({
            where: { id: userId },
            data: {
                phoneVerified: true,
                phoneVerifyCode: null,
                phoneVerifyExpires: null,
            },
        });

        return { message: 'Phone number verified successfully' };
    }

    // Get verification status
    async getVerificationStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailVerified: true,
                phoneVerified: true,
                phone: true,
            },
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        return {
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            hasPhone: !!user.phone,
        };
    }
}

export const verificationService = new VerificationService();
