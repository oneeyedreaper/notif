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

// Add email job to queue (with optional delay for quiet hours)
export async function addEmailJob(data: EmailJobData, delayMs: number = 0) {
    const job = await emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
        ...(delayMs > 0 && { delay: delayMs }),
    });

    return job;
}

// Add SMS job to queue (with optional delay for quiet hours)
export async function addSmsJob(data: SmsJobData, delayMs: number = 0) {
    const job = await smsQueue.add('send-sms', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
        ...(delayMs > 0 && { delay: delayMs }),
    });

    return job;
}

// Mock SendGrid email sending
async function sendEmail(data: EmailJobData): Promise<boolean> {
    const { notificationId, to, subject, body, templateId, variables } = data;

    let finalSubject = subject;
    let finalBody = body;

    // If template is provided, render it
    if (templateId) {
        try {
            console.log(`📧 [TEMPLATE] Fetching template: ${templateId}`);
            const template = await templateService.getById(templateId);
            const vars = variables || {};
            if (template.subject) {
                finalSubject = templateService.renderTemplate(template.subject, vars);
            }
            finalBody = templateService.renderTemplate(template.body, vars);
            console.log(`📧 [TEMPLATE] Rendered with ${Object.keys(vars).length} variables`);
        } catch (error) {
            console.error('📧 [TEMPLATE ERROR] Failed to render template:', error);
            // Fall back to default subject/body
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

    // Real SendGrid implementation
    try {
        console.log(`📧 [SENDGRID] Attempting to send email...`);
        console.log(`   API Key: ${config.sendgrid.apiKey ? config.sendgrid.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
        console.log(`   From: ${config.sendgrid.fromEmail}`);
        console.log(`   To: ${to}`);

        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(config.sendgrid.apiKey);

        const response = await sgMail.default.send({
            to,
            from: config.sendgrid.fromEmail,
            subject: finalSubject,
            text: finalBody,
            html: `<p>${finalBody.replace(/\n/g, '<br>')}</p>`,
        });

        console.log(`📧 [SENDGRID] Response status: ${response[0].statusCode}`);
        console.log(`📧 [SENDGRID] Email sent successfully to ${to}`);
        return true;
    } catch (error: any) {
        console.error(`📧 [SENDGRID ERROR] Failed to send email to ${to}`);
        console.error(`   Error message: ${error.message}`);
        if (error.response) {
            console.error(`   Response body: ${JSON.stringify(error.response.body)}`);
        }
        throw error;
    }
}

// Mock Twilio SMS sending
async function sendSms(data: SmsJobData): Promise<boolean> {
    const { notificationId, to, message, templateId, variables } = data;

    let finalMessage = message;

    // If template is provided, render it
    if (templateId) {
        try {
            console.log(`📱 [TEMPLATE] Fetching template: ${templateId}`);
            const template = await templateService.getById(templateId);
            const vars = variables || {};
            finalMessage = templateService.renderTemplate(template.body, vars);
            console.log(`📱 [TEMPLATE] Rendered with ${Object.keys(vars).length} variables`);
        } catch (error) {
            console.error('📱 [TEMPLATE ERROR] Failed to render template:', error);
            // Fall back to default message
        }
    }

    if (config.twilio.mockMode) {
        console.log('📱 [MOCK SMS] ------------------------------------------');
        console.log(`   To: ${to}`);
        console.log(`   Message: ${finalMessage}`);
        console.log('--------------------------------------------------------');
        return true;
    }

    // Real Twilio implementation
    try {
        const twilio = await import('twilio');
        const client = twilio.default(config.twilio.accountSid, config.twilio.authToken);
        await client.messages.create({
            body: finalMessage,
            from: config.twilio.phoneNumber,
            to,
        });
        console.log(`📱 [TWILIO] SMS sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error(`📱 [TWILIO ERROR] Failed to send SMS to ${to}:`, error);
        throw error;
    }
}

// Email worker
export const emailWorker = new Worker(
    'email',
    async (job: Job<EmailJobData>) => {
        console.log(`📧 [WORKER] Processing email job ${job.id} for ${job.data.to}`);
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
            console.log(`📧 [WORKER] Calling sendEmail for ${to}...`);
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
    {
        connection,
        // Reduce Redis polling to save Upstash requests
        drainDelay: 30000, // Wait 30 seconds between polls when queue is empty
    }
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
    {
        connection,
        // Reduce Redis polling to save Upstash requests
        drainDelay: 30000, // Wait 30 seconds between polls when queue is empty
    }
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
