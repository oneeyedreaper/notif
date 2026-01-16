import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { templateService } from '../services/template.service.js';
import { createTemplateSchema, updateTemplateSchema, previewTemplateSchema } from '../utils/validators.js';
import { createError } from '../middleware/error.js';

export class TemplateController {
    async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const parsed = createTemplateSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const template = await templateService.create(parsed.data);

            res.status(201).json({
                message: 'Template created successfully',
                template,
            });
        } catch (error) {
            next(error);
        }
    }

    async list(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const templates = await templateService.list();

            res.json({ templates });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const template = await templateService.getById(req.params.id);

            res.json({ template });
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const parsed = updateTemplateSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const template = await templateService.update(req.params.id, parsed.data);

            res.json({
                message: 'Template updated successfully',
                template,
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await templateService.delete(req.params.id);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async preview(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const parsed = previewTemplateSchema.safeParse(req.body);

            if (!parsed.success) {
                throw createError(parsed.error.errors[0].message, 400);
            }

            const result = await templateService.preview(req.params.id, parsed.data);

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const templateController = new TemplateController();
