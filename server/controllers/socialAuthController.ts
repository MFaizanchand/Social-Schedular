import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Account } from '../models/Accounts.js';
import zernio from '../config/zernio.js';
import { ORequest } from '../middlewares/o-middleware';

// Helper: Get or create Zyno profile
const getOrCreateZernioProfile = async (user: any): Promise<string> => {
  try {
    // List existing profiles
    const result = await zernio.profiles.listProfiles();
    const data = result.data as any;
    const profiles: any[] = Array.isArray(data) ? data : data?.profiles || [];

    if (profiles.length > 0) {
      const profileId = profiles[0]._id;
      await User.findByIdAndUpdate(user._id, { jProfileId: profileId });
      return profileId;
    }

    // Create new profile
    const createResult = await zernio.profiles.createProfile({
      body: {
        name: user.name || user.email,
        workspace: 'default',
      },
    });

    const created = (createResult.data as any)?.profile || createResult.data;
    const profileId = created?.id || created?._id;

    if (!profileId) {
      throw new Error('Failed to create Zyno profile: no ID returned');
    }

    await User.findByIdAndUpdate(user._id, { jProfileId: profileId });
    return profileId;
  } catch (error: any) {
    console.error('Get or create Zyno profile error:', error.message || error);
    throw error;
  }
};

// Generate OAuth URL
export const generateAuthUrl = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const profileId = await getOrCreateZernioProfile(req.user);

    const origin = req.headers.origin;
    const redirectUrl = `${origin}/accounts`;

    const result = await zernio.connect.getConnectUrl({
      platform: platform as any,
      query: {
        profileId,
        redirectUrl,
      },
    });

    const data = result.data as any;
    const url = data?.oAuthUrl;

    if (!url) {
      throw new Error(`zernio no auth URL response: ${JSON.stringify(data)}`);
    }

    res.json({ url });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// Sync connected accounts
export const syncAccounts = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const profileId = await getOrCreateZernioProfile(req.user);

    const result = await zernio.accounts.listAccounts({
      query: {
        profileId,
      },
    });

    const data = result.data as any;
    const zynoAccounts: any[] = Array.isArray(data) ? data : data?.accounts || [];
    const supportedPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
    const syncedAccounts = [];

    for (const zAccount of zynoAccounts) {
      const zId = zAccount.id || zAccount._id;
      if (!zId) {
        console.log('Skipping account with no ID:', zAccount);
        continue;
      }

      const rawPlatform = (zAccount.platform || zAccount.type || '').toLowerCase();
      const normalizedPlatform = supportedPlatforms.find((p) => rawPlatform.includes(p));

      if (!normalizedPlatform) {
        console.log(`Skipping unsupported platform: ${rawPlatform}`);
        continue;
      }

      const account = await Account.findOneAndUpdate(
        { zNewAccountId: zId },
        {
          user: req.user.id,
          platform: normalizedPlatform,
          handle: zAccount.username || zAccount.name || zAccount.handle || 'unknown',
          zNewAccountId: zId,
          status: 'connected',
          avatarUrl: zAccount.pictureUrl || zAccount.picture || zAccount.profileImageUrl,
        },
        { upsert: true, returnDocument: 'after' }
      );

      syncedAccounts.push(account);
    }

    res.json(syncedAccounts);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};