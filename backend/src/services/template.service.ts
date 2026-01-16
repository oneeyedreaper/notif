import prisma from '../models/prisma.js';
import { CreateTemplateInput, UpdateTemplateInput, PreviewTemplateInput } from '../utils/validators.js';
import { createError } from '../middleware/error.js';

export class TemplateService {
    async create(data: CreateTemplateInput) {
        // Check if template name already exists
        const existing = await prisma.template.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            throw createError('Template with this name already exists', 400);
        }

        // Extract variables from body using regex
        const extractedVariables = this.extractVariables(data.body);
        const allVariables = [...new Set([...data.variables, ...extractedVariables])];

        const template = await prisma.template.create({
            data: {
                name: data.name,
                channel: data.channel,
                subject: data.subject,
                body: data.body,
                variables: allVariables,
            },
        });

        return template;
    }

    async list() {
        const templates = await prisma.template.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return templates;
    }

    async getById(id: string) {
        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            throw createError('Template not found', 404);
        }

        return template;
    }

    async getByName(name: string) {
        const template = await prisma.template.findUnique({
            where: { name },
        });

        if (!template) {
            throw createError('Template not found', 404);
        }

        return template;
    }

    async update(id: string, data: UpdateTemplateInput) {
        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            throw createError('Template not found', 404);
        }

        // If name is being changed, check for uniqueness
        if (data.name && data.name !== template.name) {
            const existing = await prisma.template.findUnique({
                where: { name: data.name },
            });

            if (existing) {
                throw createError('Template with this name already exists', 400);
            }
        }

        // Re-extract variables if body is updated
        let variables = data.variables;
        if (data.body) {
            const extractedVariables = this.extractVariables(data.body);
            variables = [...new Set([...(data.variables || []), ...extractedVariables])];
        }

        const updated = await prisma.template.update({
            where: { id },
            data: {
                ...data,
                ...(variables && { variables }),
            },
        });

        return updated;
    }

    async delete(id: string) {
        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            throw createError('Template not found', 404);
        }

        await prisma.template.delete({ where: { id } });

        return { message: 'Template deleted successfully' };
    }

    async preview(id: string, data: PreviewTemplateInput) {
        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            throw createError('Template not found', 404);
        }

        const renderedSubject = template.subject
            ? this.renderTemplate(template.subject, data.variables)
            : null;
        const renderedBody = this.renderTemplate(template.body, data.variables);

        return {
            template: {
                ...template,
                renderedSubject,
                renderedBody,
            },
        };
    }

    // Render a template string with variable substitution
    renderTemplate(template: string, variables: Record<string, string>): string {
        let result = template;

        // Replace {{variable}} patterns
        const regex = /\{\{(\w+)\}\}/g;
        result = result.replace(regex, (match, varName) => {
            return variables[varName] !== undefined ? variables[varName] : match;
        });

        return result;
    }

    // Extract variable names from template string
    private extractVariables(template: string): string[] {
        const regex = /\{\{(\w+)\}\}/g;
        const variables: string[] = [];
        let match;

        while ((match = regex.exec(template)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }

        return variables;
    }
}

export const templateService = new TemplateService();
