import sgMail from '@sendgrid/mail';
import { config } from '../config/index.js';

export interface SendEmailOptions {
    to: string;
    subject: string;
    body: string;
}

class EmailService {
    private initialized = false;

    private initialize() {
        if (!this.initialized && config.sendgrid.apiKey) {
            sgMail.setApiKey(config.sendgrid.apiKey);
            this.initialized = true;
        }
    }

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const { to, subject, body } = options;

        if (config.sendgrid.mockMode) {
            console.log('📧 [MOCK EMAIL] ----------------------------------------');
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject}`);
            console.log(`   Body: ${body.substring(0, 1000)}...`);
            console.log('--------------------------------------------------------');
            return true;
        }

        try {
            this.initialize();

            await sgMail.send({
                to,
                from: config.sendgrid.fromEmail,
                subject,
                html: body,
            });

            console.log(`📧 [SENDGRID] Email sent to ${to}`);
            return true;
        } catch (error: any) {
            console.error('❌ [SENDGRID ERROR]', error?.response?.body || error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}

export const emailService = new EmailService();
