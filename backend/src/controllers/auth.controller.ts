import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../utils/validators.js';
import { createError } from '../middleware/error.js';

export class AuthController {
    async register(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const parsed = registerSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await authService.register(parsed.data);

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const parsed = loginSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await authService.login(parsed.data);

            res.json({
                message: 'Login successful',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const user = await authService.getMe(req.user.id);

            res.json({ user });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const parsed = updateProfileSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const user = await authService.updateProfile(req.user.id, parsed.data);

            res.json({
                message: 'Profile updated successfully',
                user,
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const parsed = changePasswordSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await authService.changePassword(req.user.id, parsed.data);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const { password } = req.body;

            if (!password) {
                throw createError('Password is required to delete account', 400);
            }

            const result = await authService.deleteAccount(req.user.id, password);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
