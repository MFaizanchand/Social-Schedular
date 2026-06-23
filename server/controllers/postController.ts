import { Request, Response } from 'express';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import {cloudinary} from '../config/cloudinary.js';
import zernio from '../config/zernio.js';
import { Post } from '../models/Post.js';
import  {Generation}  from '../models/Generation.js';
import { ORequest } from '../middleware/authMiddleware.js';

// Helper: Poll Leonardo for generated image
const pollLeonardoJob = async (generationId: string, apiKey: string): Promise<string> => {
  const maxRetries = 20;
  const delay = 5000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const generation = response.data.generationsByPk;

      if (generation.status === 'COMPLETE') {
        if (generation.generatedImages && generation.generatedImages.length > 0) {
          return generation.generatedImages[0].url;
        }
        throw new Error('Generation complete but no image found');
      }

      if (generation.status === 'FAILED') {
        throw new Error('Leonardo.ai generation failed');
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error: any) {
      console.error('Polling error:', response.data, error.message);
    }
  }

  throw new Error('Leonardo.ai generation timeout');
};

// Generate post with AI
export const generatePost = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const { prompt, tone, generateImage } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({
        message: 'Gemini API key is missing. Please add it to your server env file.',
      });
      return;
    }

    // Generate text with Gemini
    const ai = new GoogleGenAI({apiKey});
    //Generate text
    const textResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a social media post based on this prompt: "${prompt}". 
    Tone:${tone},
    Include relevent hashtags.
    Format the response as JSON with "content" and "imageprompt" fields. 
    The "imageprompt" should be a highly descriptive prompt for an image generator that compliments the post.`,
    });

    let content = '';
    let imagePrompt = prompt;

    try {
      const rawText = textResponse.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: rawText, imageprompt: prompt };
      content = data.content;
      imagePrompt = data.imageprompt;
    } catch (e: any) {
      content = textResponse.text || '';
    }

    let mediaUrl = '';

    if (generateImage) {
      try {
        const leonardoKey = process.env.LEONARDO_API_KEY;
        if (leonardoKey) {
          // Generate image with Leonardo
          const leoResponse = await axios.post(
            'https://cloud.leonardo.ai/api/rest/v2/generations',
            {
             "public": false,
       "model": "gpt-image-2",
       "parameters": {
        "quality": "LOW",
           "prompt": imagePrompt,
           "quantity": 1,
           "width": 1024,
           "height": 1024,
           "prompt_enhance": "OFF",
            },
        },
            {
              headers: {
                accept: 'application/json',
                authorization: `Bearer ${leonardoKey}`,
                'content-type': 'application/json',
              },
            }
          );

          const generationId = leoResponse.data.generate?.generationId;
          const tempUrl = await pollLeonardoJob(generationId, leonardoKey);

          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(tempUrl, {
            folder: 'ai-generations',
          });

          mediaUrl = uploadResult.secure_url;
        }
      } catch (error: any) {
        console.error('Image generation failed:', error);
      }
    }

    // Save to database
    const generation = await Generation.create({
      user: req.user.id,
      prompt,
      content,
      mediaUrl,
      mediaType: mediaUrl ? 'image' : undefined,
      tone,
    });

    res.status(201).json(generation);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// Get all generations
export const getGenerations = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const generations = await Generation.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(generations);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// Get all posts
export const getPosts = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const posts = await Post.find({ user: req.user.id });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// Schedule post
export const schedulePost = async (req: ORequest, res: Response): Promise<void> => {
  try {
    const { content, platforms: platformsStr, scheduledFor, status, mediaUrl, mediaType } = req.body;

    let parsedPlatforms = platformsStr;
    if (typeof platformsStr === 'string') {
      try {
        parsedPlatforms = JSON.parse(platformsStr);
      } catch {
        parsedPlatforms = platformsStr.split(',');
      }
    }

    let uploadedMediaUrl = mediaUrl;
    let uploadedMediaType = mediaType;

    if (req.file) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'scheduler',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file!.buffer);
        });

        uploadedMediaUrl = result.secure_url;
        uploadedMediaType = result.resource_type === 'video' ? 'video' : 'image';
      } catch (error: any) {
        console.error('File upload error:', error);
      }
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      mediaUrl: uploadedMediaUrl,
      mediaType: uploadedMediaType,
      platforms: parsedPlatforms,
      scheduledFor,
      status: status || 'scheduled',
    });

    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};