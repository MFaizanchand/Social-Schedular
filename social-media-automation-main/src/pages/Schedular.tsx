// src/pages/scheduler.tsx
import { useEffect, useState } from 'react';
import { Calendar, Clock, Send, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { platforms } from '../assets/platforms';
import { dummyPostsData } from '../assets/assets';

interface Post {
  _id: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  mediaUrl?: string;
  mediaType?: string;
  status: 'scheduled' | 'published' | 'failed';
}

export default function Scheduler() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setPosts(dummyPostsData)
    // try {
    //   const response = await API.get('/posts');
    //   setPosts(response.data || []);
    // } catch (error) {
    //   toast.error('Failed to load posts');
    // }
  };

  // Handle media file selection
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, GIF, MP4, and MOV files are supported');
        return;
      }

      setMediaFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove media file
  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter post content');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Select date and time');
      return;
    }

    // Instagram requires media
    if (selectedPlatforms.includes('instagram') && !mediaFile) {
      toast.error('Instagram requires an image or video');
      return;
    }

    try {
      setLoading(true);
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', content);
      formData.append('scheduledFor', scheduledFor);
      formData.append('status', 'scheduled');
      formData.append('platforms', JSON.stringify(selectedPlatforms));

      // Add media file if exists
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      await API.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Post scheduled successfully!');
      
      // Reset form
      setContent('');
      setSelectedPlatforms([]);
      setScheduledDate('');
      setScheduledTime('');
      setMediaFile(null);
      setMediaPreview('');

      // Refresh posts
      fetchPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const scheduled = posts.filter(p => p.status === 'scheduled');
  const published = posts.filter(p => p.status === 'published');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Composer Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
          <h2 className="text-xl font-bold mb-6">Compose Post</h2>

          <form onSubmit={handleSchedule} className="space-y-5">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedPlatforms((prev) =>
                        prev.includes(p.id)
                          ? prev.filter((x) => x !== p.id)
                          : [...prev, p.id]
                      )
                    }
                    className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                      selectedPlatforms.includes(p.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p
                className={`text-xs mt-2 ${
                  content.length > 280 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {content.length} / 280
              </p>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media (Optional)
              </label>

              {mediaPreview ? (
                // Preview Mode
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 mb-3 bg-gray-50">
                  {mediaFile?.type.startsWith('image/') ? (
                    <img
                      src={mediaPreview}
                      alt="preview"
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-full h-40 object-cover"
                      controls
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* File Info */}
                  <div className="p-2 bg-white border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      {mediaFile?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(mediaFile?.size ? mediaFile.size / 1024 / 1024 : 0).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                // Upload Area
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, MP4, MOV (Max 10MB)
                  </p>
                </label>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Schedule Post
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Posts Queue */}
      <div className="lg:col-span-2 space-y-6">
        {/* Upcoming Posts */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span>Upcoming Posts</span>
            <span className="ml-auto bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
              {scheduled.length}
            </span>
          </div>

          {scheduled.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No scheduled posts</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scheduled.map((post) => (
                <PostItem key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Published Posts */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 font-semibold flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            <span>Published Posts</span>
            <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
              {published.length}
            </span>
          </div>

          {published.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No published posts</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {published.map((post) => (
                <PostItem key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostItem({ post }: { post: Post }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          {post.platforms.map((p) => (
            <span
              key={p}
              className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium"
            >
              {p}
            </span>
          ))}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            post.status === 'published'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {post.status}
        </span>
      </div>

      <p className="text-gray-900 font-medium line-clamp-2 mb-2">{post.content}</p>

      {post.mediaUrl && (
        <img
          src={post.mediaUrl}
          alt="post media"
          className="w-full h-32 object-cover rounded-lg mb-2"
        />
      )}

      <p className="text-xs text-gray-500">
        {new Date(post.scheduledFor).toLocaleString()}
      </p>
    </div>
  );
}