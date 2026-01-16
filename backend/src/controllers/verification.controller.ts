import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { verificationService } from '../services/verification.service.js';
import { createError } from '../middleware/error.js';
import { z } from 'zod';

const verifyPhoneSchema = z.object({
    code: z.string().length(6, 'Verification code must be 6 digits'),
});

const resendEmailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export class VerificationController {
    async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { token } = req.params;

            if (!token) {
                throw createError('Verification token is required', 400);
            }

            const result = await verificationService.verifyEmail(token);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async resendVerificationEmail(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const result = await verificationService.sendEmailVerification(
                req.user.id,
                req.user.email,
                req.user.name || 'User'
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // Public resend (no auth required - for login page)
    async resendVerificationEmailPublic(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = resendEmailSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await verificationService.resendEmailVerification(parsed.data.email);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async sendPhoneCode(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const result = await verificationService.sendPhoneVerification(req.user.id);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async verifyPhone(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const parsed = verifyPhoneSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await verificationService.verifyPhone(req.user.id, parsed.data.code);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getVerificationStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const status = await verificationService.getVerificationStatus(req.user.id);

            res.json(status);
        } catch (error) {
            next(error);
        }
    }
}

export const verificationController = new VerificationController();
