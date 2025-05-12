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

export default router; 