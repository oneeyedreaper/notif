import { Router } from 'express';
import { preferenceController } from '../controllers/preference.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/preferences:
 *   get:
 *     summary: Get user preferences
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences
 */
router.get('/', preferenceController.get.bind(preferenceController));

/**
 * @swagger
 * /api/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               smsEnabled:
 *                 type: boolean
 *               pushEnabled:
 *                 type: boolean
 *               emailFrequency:
 *                 type: string
 *                 enum: [instant, daily, weekly]
 *               quietHoursStart:
 *                 type: string
 *               quietHoursEnd:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/', preferenceController.update.bind(preferenceController));

export default router;
