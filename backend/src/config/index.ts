import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    // Redis
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // SendGrid
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        mockMode: process.env.EMAIL_MOCK_MODE === 'true',
    },

    // Twilio
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        mockMode: process.env.SMS_MOCK_MODE === 'true',
    },

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
