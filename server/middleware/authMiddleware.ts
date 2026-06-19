import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export interface ORequest extends Request {
  user?: any;
}

export const protect = async (req: ORequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error: any) {
      res.status(401).json({
        message: error.message || 'Not authorized, token failed',
      });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};