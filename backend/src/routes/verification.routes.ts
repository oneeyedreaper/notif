import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/verification/email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/email/:token', verificationController.verifyEmail.bind(verificationController));

/**
 * @swagger
 * /api/verification/resend-email:
 *   post:
 *     summary: Resend verification email
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       401:
 *         description: Not authenticated
 */
router.post('/resend-email', authMiddleware, verificationController.resendVerificationEmail.bind(verificationController));

/**
 * @swagger
 * /api/verification/send-phone-code:
 *   post:
 *     summary: Send phone verification OTP
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code sent
 *       400:
 *         description: No phone number or already verified
 *       401:
 *         description: Not authenticated
 */
router.post('/send-phone-code', authMiddleware, verificationController.sendPhoneCode.bind(verificationController));

/**
 * @swagger
 * /api/verification/verify-phone:
 *   post:
 *     summary: Verify phone number with OTP
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 6-digit verification code
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid or expired code
 *       401:
 *         description: Not authenticated
 */
router.post('/verify-phone', authMiddleware, verificationController.verifyPhone.bind(verificationController));

/**
 * @swagger
 * /api/verification/status:
 *   get:
 *     summary: Get verification status
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status
 *       401:
 *         description: Not authenticated
 */
router.get('/status', authMiddleware, verificationController.getVerificationStatus.bind(verificationController));

export default router;
