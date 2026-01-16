import twilio from 'twilio';
import { config } from '../config/index.js';

export interface SendSmsOptions {
    to: string;
    body: string;
}

class SmsService {
    private client: twilio.Twilio | null = null;

    private getClient() {
        if (!this.client && config.twilio.accountSid && config.twilio.authToken) {
            this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        }
        return this.client;
    }

    async sendSms(options: SendSmsOptions): Promise<boolean> {
        const { to, body } = options;

        if (config.twilio.mockMode) {
            console.log('📱 [MOCK SMS] ------------------------------------------');
            console.log(`   To: ${to}`);
            console.log(`   Message: ${body}`);
            console.log('--------------------------------------------------------');
            return true;
        }

        try {
            const client = this.getClient();

            if (!client) {
                throw new Error('Twilio client not configured');
            }

            const message = await client.messages.create({
                body,
                from: config.twilio.phoneNumber,
                to,
            });

            console.log(`📱 [TWILIO] SMS sent to ${to} (SID: ${message.sid})`);
            return true;
        } catch (error: any) {
            console.error('❌ [TWILIO ERROR]', error.message);
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }
}

export const smsService = new SmsService();
