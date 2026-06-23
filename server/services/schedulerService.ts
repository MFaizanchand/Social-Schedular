import cron from 'node-cron';
import { Post } from '../models/Post.js';
import { Account } from '../models/Accounts.js';
import { ActivityLog } from '../models/Activitylog.js';
import zernio from '../config/zernio.js';

export const initScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const postsToPublish = await Post.find({
        status: 'scheduled',
        scheduledFor: { $lte: now },
      });

      for (const post of postsToPublish) {
        try {
          const accounts = await Account.find({
            user: post.user,
            platform: { $in: post.platforms },
            status: 'connected',
            zNewAccountId: { $exists: true },
          });

          if (accounts.length === 0) {
            console.log(`No connected Zyno accounts found for post ${post._id}`);
            continue;
          }

          const zynoplatforms = accounts.map((acc) => ({
            platform: acc.platform,
            accountId: acc.zNewAccountId,
          }));

          const payload: any = {
            content: post.content,
            publish: true,
          };

          if (post.mediaUrl) {
            payload.mediaItems = [
              {
                type: post.mediaType || 'image',
                url: post.mediaUrl,
              },
            ];
          }

          payload.platforms = zynoplatforms;

          console.log(`Publishing post ${post._id} to Zyno with media and media URL or none`);

          const response = await zyno.posts.createPost({
            body: payload,
          });

          const publishedPost = (response.data as any)?.post || response.data;
          if (!publishedPost) {
            throw new Error('Failed to get post object from Zyno response');
          }

          console.log(`Post created: ${publishedPost.id || publishedPost._id}`);

          post.status = 'published';
          await post.save();

          await ActivityLog.create({
            user: post.user,
            actionType: 'post_published',
            description: `Published post to ${accounts.map((a) => a.platform).join(', ')}`,
            relatedPost: post._id,
          });
        } catch (error: any) {
          console.error(`Failed to publish post ${post._id}:`, error.message);
          post.status = 'failed';
          await post.save();
        }
      }

      if (postsToPublish.length > 0) {
        console.log(`Evaluated ${postsToPublish.length} posts at ${now}`);
      }
    } catch (error: any) {
      console.error('Scheduler error:', error);
    }
  });

  console.log('Scheduler service initialized');
};