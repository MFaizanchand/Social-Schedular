import express from 'express';
import { getAccounts, addAccount, disconnectAccount } from '../controllers/accountControllers.js';
import { protect } from '../middleware/authMiddleware.js';

const accountRouter = express.Router();

accountRouter.get('/', protect, getAccounts);
accountRouter.post('/', protect, addAccount);
accountRouter.delete('/:id', protect, disconnectAccount);

export default accountRouter;