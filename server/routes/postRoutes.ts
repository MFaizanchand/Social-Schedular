import express from 'express';
import { generatePost, getGenerations, getPosts, schedulePost } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const postRouter = express.Router();

postRouter.get('/', protect, getPosts);
postRouter.get('/generations', protect, getGenerations);
postRouter.post('/generate', protect, generatePost);
postRouter.post('/', protect, upload.single('media'), schedulePost);

export default postRouter;