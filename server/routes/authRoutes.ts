import express, { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
// import { protect } from '../middlewares/';

const authRouter: Router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { name: string, email: string, password: string }
 * @returns { _id, name, email, token }
 */
authRouter.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { _id, name, email, token }
 */
authRouter.post('/login', loginUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 * @returns { _id, name, email }
 */
authRouter.get('/me', async (req: any, res) => {
  try {
    res.json(req.user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 * @returns { message: "Logged out successfully" }
 */
authRouter.post('/logout', async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default authRouter;