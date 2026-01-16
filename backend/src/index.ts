import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { initializeSocketIO } from './sockets/index.js';
import authRoutes from './routes/auth.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import templateRoutes from './routes/template.routes.js';
import preferenceRoutes from './routes/preference.routes.js';
import verificationRoutes from './routes/verification.routes.js';

// Import queue workers to start them
import './queues/index.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS - allow multiple origins for production
const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.RENDER_EXTERNAL_URL || null,
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin) return callback(null, true);
        // Allow vercel.app and onrender.com domains
        if (allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
            origin.includes('vercel.app') ||
            origin.includes('onrender.com')) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Notification System API',
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/verification', verificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
    console.log(`
🚀 Notification System Backend Started!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌐 Server:    http://localhost:${config.port}
   📚 API Docs:  http://localhost:${config.port}/api/docs
   🔌 Socket.IO: ws://localhost:${config.port}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    const { closeQueues } = await import('./queues/index.js');
    await closeQueues();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
