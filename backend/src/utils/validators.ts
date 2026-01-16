import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Notification schemas
export const createNotificationSchema = z.object({
    userId: z.string().optional(), // If not provided, uses authenticated user
    type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM']).default('INFO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    actionUrl: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
    scheduledAt: z.string().datetime().optional(),
    sendEmail: z.boolean().default(false),
    sendSms: z.boolean().default(false),
    templateId: z.string().optional(),
    templateVariables: z.record(z.string()).optional(),
});

export const listNotificationsSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    isRead: z.enum(['true', 'false', 'all']).default('all'),
    type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'priority']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Template schemas
export const createTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    channel: z.enum(['EMAIL', 'SMS']),
    subject: z.string().optional(),
    body: z.string().min(1, 'Body is required'),
    variables: z.array(z.string()).default([]),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const previewTemplateSchema = z.object({
    variables: z.record(z.string()),
});

// Preferences schemas
export const updatePreferencesSchema = z.object({
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    emailFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
    quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type PreviewTemplateInput = z.infer<typeof previewTemplateSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
