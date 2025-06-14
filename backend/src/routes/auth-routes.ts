import express from 'express';
import { AuthController } from '../controllers/auth-controller';
import { checkJwt } from '../middleware/auth';

const router = express.Router();
const controller = new AuthController();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', controller.login.bind(controller));

/**
 * @route   POST /api/auth/signup
 * @desc    Create new customer account
 * @access  Public
 */
router.post('/signup', controller.signup.bind(controller));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public (with refresh token)
 */
router.post('/refresh', controller.refreshToken.bind(controller));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', checkJwt, controller.getProfile.bind(controller));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', checkJwt, controller.updateProfile.bind(controller));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change current user password
 * @access  Private
 */
router.put('/change-password', checkJwt, controller.changePassword.bind(controller));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', controller.requestPasswordReset.bind(controller));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', controller.resetPassword.bind(controller));

/**
 * @route   GET /api/auth/me/notifications
 * @desc    Get current user notification preferences
 * @access  Private
 */
router.get('/me/notifications', checkJwt, controller.getNotificationPreferences.bind(controller));

/**
 * @route   PUT /api/auth/me/notifications
 * @desc    Update current user notification preferences
 * @access  Private
 */
router.put('/me/notifications', checkJwt, controller.updateNotificationPreferences.bind(controller));

/**
 * @route   POST /api/auth/register
 * @desc    Create new customer account (backward compatibility)
 * @access  Public
 */
router.post('/register', controller.signup.bind(controller));

export default router; 