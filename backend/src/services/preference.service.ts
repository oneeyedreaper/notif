import prisma from '../models/prisma.js';
import { UpdatePreferencesInput } from '../utils/validators.js';
import { createError } from '../middleware/error.js';

export class PreferenceService {
    async get(userId: string) {
        let preferences = await prisma.userPreference.findUnique({
            where: { userId },
        });

        // Create default preferences if not exists
        if (!preferences) {
            preferences = await prisma.userPreference.create({
                data: { userId },
            });
        }

        return preferences;
    }

    async update(userId: string, data: UpdatePreferencesInput) {
        // Ensure preferences exist
        let preferences = await prisma.userPreference.findUnique({
            where: { userId },
        });

        if (!preferences) {
            preferences = await prisma.userPreference.create({
                data: { userId, ...data },
            });
        } else {
            preferences = await prisma.userPreference.update({
                where: { userId },
                data,
            });
        }

        return preferences;
    }

    // Check if user wants to receive notifications on a specific channel
    async shouldSendNotification(userId: string, channel: 'email' | 'sms' | 'push'): Promise<boolean> {
        const preferences = await this.get(userId);

        switch (channel) {
            case 'email':
                return preferences.emailEnabled;
            case 'sms':
                return preferences.smsEnabled;
            case 'push':
                return preferences.pushEnabled;
            default:
                return false;
        }
    }

    // Check if current time is within quiet hours
    async isQuietHours(userId: string): Promise<boolean> {
        const preferences = await this.get(userId);

        if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
            return false;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const start = preferences.quietHoursStart;
        const end = preferences.quietHoursEnd;

        // Handle cases where quiet hours span midnight
        if (start <= end) {
            return currentTime >= start && currentTime <= end;
        } else {
            return currentTime >= start || currentTime <= end;
        }
    }
}

export const preferenceService = new PreferenceService();
