import express from 'express';
import { generateAuthUrl, syncAccounts } from '../controllers/socialAuthController.js';
import { protect } from '../middleware/AuthMiddleware.ts';

const socialORouter = express.Router();

socialORouter.get('/:platform/url', protect, generateAuthUrl);
socialORouter.get('/sync', protect, syncAccounts);

export default socialORouter;