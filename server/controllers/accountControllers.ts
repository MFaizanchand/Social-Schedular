import { Request, Response } from 'express';
import { Account } from '../models/Accounts.js';
import zernio from '../config/zernio.js';
import { ORequest } from '../middleware/authMiddleware.js';

// Get all accounts
export const getAccounts = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const accounts = await Account.find({ user: req.user.id });
    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// Add account
export const addAccount = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const { platform, handle, avatarUrl } = req.body;

    const account = await Account.create({
      user: req.user.id,
      platform,
      handle,
      avatarUrl,
    });

    res.status(201).json(account);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// Disconnect account
export const disconnectAccount = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    // Delete from Zyno if connected
    if (account.zNewAccountId) {
      try {
        await zernio.accounts.deleteAccount({
          path: {
            accountId: account.zNewAccountId,
          },
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error' });
        return;
      }
    }

    await account.deleteOne();
    res.json({ message: 'Account disconnected successfully' });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};