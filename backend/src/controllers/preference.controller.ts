import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { preferenceService } from '../services/preference.service.js';
import { updatePreferencesSchema } from '../utils/validators.js';
import { createError } from '../middleware/error.js';

export class PreferenceController {
    async get(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const preferences = await preferenceService.get(req.user.id);

            res.json({ preferences });
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw createError('Not authenticated', 401);
            }

            const parsed = updatePreferencesSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const preferences = await preferenceService.update(req.user.id, parsed.data);

            res.json({
                message: 'Preferences updated successfully',
                preferences,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const preferenceController = new PreferenceController();
