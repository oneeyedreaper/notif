import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

// Determine server URL based on environment
const serverUrl = process.env.RENDER_EXTERNAL_URL ||
    (process.env.NODE_ENV === 'production'
        ? `https://${process.env.RENDER_SERVICE_NAME || 'notif-backend'}.onrender.com`
        : `http://localhost:${config.port}`);

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notif - Notification System API',
            version: '1.0.0',
            description: 'A comprehensive notification system with email/SMS integration, real-time updates, and template management',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: serverUrl,
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Notifications', description: 'Notification management' },
            { name: 'Templates', description: 'Email/SMS template management' },
            { name: 'Preferences', description: 'User notification preferences' },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
