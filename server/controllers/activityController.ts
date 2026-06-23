import { Request, Response } from 'express';
import { ActivityLog } from '../models/Activitylog.js';
import { ORequest } from '../middleware/authMiddleware.js';

export const getActivity = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const activity = await ActivityLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('relatedPost', 'content')
      .populate('user', 'name');

    res.json(activity);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};