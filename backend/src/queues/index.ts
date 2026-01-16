import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';
import prisma from '../models/prisma.js';
import { templateService } from '../services/template.service.js';

// Redis connection for BullMQ
export const connection = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
});

// Queue definitions
export const emailQueue = new Queue('email', { connection });
export const smsQueue = new Queue('sms', { connection });

// Email job data interface
export interface EmailJobData {
    notificationId: string;
    to: string;
    subject: string;
    body: string;
    templateId?: string;
    variables?: Record<string, string>;
}

// SMS job data interface
export interface SmsJobData {
    notificationId: string;
    to: string;
    message: string;
    templateId?: string;
    variables?: Record<string, string>;
}

// Add email job to queue
export async function addEmailJob(data: EmailJobData) {
    const job = await emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    });

    return job;
}

// Add SMS job to queue
export async function addSmsJob(data: SmsJobData) {
    const job = await smsQueue.add('send-sms', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    });

    return job;
}

// Mock SendGrid email sending
async function sendEmail(data: EmailJobData): Promise<boolean> {
    const { notificationId, to, subject, body, templateId, variables } = data;

    let finalSubject = subject;
    let finalBody = body;

    // If template is provided, render it
    if (templateId && variables) {
        try {
            const template = await templateService.getById(templateId);
            if (template.subject) {
                finalSubject = templateService.renderTemplate(template.subject, variables);
            }
            finalBody = templateService.renderTemplate(template.body, variables);
        } catch (error) {
            console.error('Failed to render template:', error);
        }
    }

    if (config.sendgrid.mockMode) {
        console.log('📧 [MOCK EMAIL] ----------------------------------------');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${finalSubject}`);
        console.log(`   Body: ${finalBody}`);
        console.log('--------------------------------------------------------');
        return true;
    }

    // Real SendGrid implementation would go here
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(config.sendgrid.apiKey);
    // await sgMail.send({ to, from: config.sendgrid.fromEmail, subject: finalSubject, text: finalBody });

    console.log(`📧 [SENDGRID] Email sent to ${to}`);
    return true;
}

// Mock Twilio SMS sending
async function sendSms(data: SmsJobData): Promise<boolean> {
    const { notificationId, to, message, templateId, variables } = data;

    let finalMessage = message;

    // If template is provided, render it
    if (templateId && variables) {
        try {
            const template = await templateService.getById(templateId);
            finalMessage = templateService.renderTemplate(template.body, variables);
        } catch (error) {
            console.error('Failed to render template:', error);
        }
    }

    if (config.twilio.mockMode) {
        console.log('📱 [MOCK SMS] ------------------------------------------');
        console.log(`   To: ${to}`);
        console.log(`   Message: ${finalMessage}`);
        console.log('--------------------------------------------------------');
        return true;
    }

    // Real Twilio implementation would go here
    // const twilio = require('twilio');
    // const client = twilio(config.twilio.accountSid, config.twilio.authToken);
    // await client.messages.create({ body: finalMessage, from: config.twilio.phoneNumber, to });

    console.log(`📱 [TWILIO] SMS sent to ${to}`);
    return true;
}

// Email worker
export const emailWorker = new Worker(
    'email',
    async (job: Job<EmailJobData>) => {
        const { notificationId, to } = job.data;

        // Create log entry
        const log = await prisma.notificationLog.create({
            data: {
                notificationId,
                channel: 'EMAIL',
                recipient: to,
                status: 'PENDING',
            },
        });

        try {
            const success = await sendEmail(job.data);

            if (success) {
                await prisma.notificationLog.update({
                    where: { id: log.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                    },
                });
            }

            return { success, logId: log.id };
        } catch (error) {
            await prisma.notificationLog.update({
                where: { id: log.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                },
            });

            throw error;
        }
    },
    { connection }
);

// SMS worker
export const smsWorker = new Worker(
    'sms',
    async (job: Job<SmsJobData>) => {
        const { notificationId, to } = job.data;

        // Create log entry
        const log = await prisma.notificationLog.create({
            data: {
                notificationId,
                channel: 'SMS',
                recipient: to,
                status: 'PENDING',
            },
        });

        try {
            const success = await sendSms(job.data);

            if (success) {
                await prisma.notificationLog.update({
                    where: { id: log.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                    },
                });
            }

            return { success, logId: log.id };
        } catch (error) {
            await prisma.notificationLog.update({
                where: { id: log.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                },
            });

            throw error;
        }
    },
    { connection }
);

// Worker event handlers
emailWorker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

smsWorker.on('completed', (job) => {
    console.log(`✅ SMS job ${job.id} completed`);
});

smsWorker.on('failed', (job, err) => {
    console.error(`❌ SMS job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
export async function closeQueues() {
    await emailWorker.close();
    await smsWorker.close();
    await emailQueue.close();
    await smsQueue.close();
    await connection.quit();
}
