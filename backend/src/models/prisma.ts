import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend root directory BEFORE importing PrismaClient
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Pass DATABASE_URL directly to bypass any caching issues
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
