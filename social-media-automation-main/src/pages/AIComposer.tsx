// src/pages/ai-composer.tsx
import { useEffect, useState } from 'react';
import { Zap, Sparkles, Calendar, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { platforms } from '../assets/platforms';
import { dummyGenerationData } from '../assets/assets';

interface Generation {
  _id: string;
  prompt: string;
  content: string;
  mediaUrl?: string;
  tone: string;
  createdAt: string;
}

export default function AIComposer() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [generateImage, setGenerateImage] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeScheduler, setActiveScheduler] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const tones = ['professional', 'creative', 'funny', 'minimalist', 'excited'];

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    setFetchLoading(true);
    setGenerations(dummyGenerationData)
    setFetchLoading(false);
    // try {
    //    setFetchLoading(true);
    //   const response = await API.get('/posts/generations');
    //   setGenerations(response.data || []);
    // } catch (error: any) {
    //   toast.error('Failed to load generations');
    // } finally {
    //   setFetchLoading(false);
    // }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading('Generating content...');

      const response = await API.post('/posts/generate', {
        prompt,
        tone,
        generateImage,
      });

      const newGeneration = response.data;
      setGenerations([newGeneration, ...generations]);
      setActiveScheduler(newGeneration);
      toast.success('Content generated successfully!', { id: toastId });
      setPrompt('');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to generate content'
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeScheduler) return;

    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Select date and time');
      return;
    }

    try {
      setScheduling(true);
      const scheduledFor = new Date(
        `${scheduledDate}T${scheduledTime}`
      ).toISOString();

      await API.post('/posts', {
        content: activeScheduler.content,
        mediaUrl: activeScheduler.mediaUrl,
        mediaType: activeScheduler.mediaUrl ? 'image' : undefined,
        platforms: selectedPlatforms,
        scheduledFor,
        status: 'scheduled',
      });

      toast.success('AI post scheduled successfully!');
      setActiveScheduler(null);
      setSelectedPlatforms([]);
      setScheduledDate('');
      setScheduledTime('');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to schedule post'
      );
    } finally {
      setScheduling(false);
    }
  };

  const deleteGeneration = async (id: string) => {
    if (!window.confirm('Delete this generation?')) return;

    try {
      await API.delete(`/posts/generations/${id}`);
      setGenerations(generations.filter((g) => g._id !== id));
      if (activeScheduler?._id === id) {
        setActiveScheduler(null);
      }
      toast.success('Generation deleted');
    } catch (error: any) {
      toast.error('Failed to delete generation');
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Generate Panel */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6 sticky top-20">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Composer
          </h2>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the post you want to create..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      tone === t
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Image Toggle */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Generate Image
              </span>
              <button
                type="button"
                onClick={() => setGenerateImage(!generateImage)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  generateImage ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    generateImage ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Scheduler & Generations */}
      <div className="lg:col-span-2 space-y-6">
        {/* Scheduler Modal */}
        {activeScheduler && (
          <div className="bg-white rounded-lg border-2 border-purple-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Schedule Generation
              </h3>
              <button
                onClick={() => setActiveScheduler(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSchedule} className="space-y-4">
              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Prompt:</strong> {activeScheduler.prompt}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Tone:</strong> {activeScheduler.tone}
                </p>
                <p className="text-gray-900 font-medium mb-3 line-clamp-3">
                  {activeScheduler.content}
                </p>
                {activeScheduler.mediaUrl && (
                  <img
                    src={activeScheduler.mediaUrl}
                    alt="generated"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                        selectedPlatforms.includes(p.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={scheduling}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium"
              >
                {scheduling ? 'Scheduling...' : 'Schedule Post'}
              </button>
            </form>
          </div>
        )}

        {/* Generations List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Generations
              </h3>
            </div>
            <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
              {generations.length}
            </span>
          </div>

          {generations.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No content generated yet</p>
              <p className="text-sm text-gray-500">
                Try generating some content using the AI Composer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {generations.map((gen) => (
                <div
                  key={gen._id}
                  className={`rounded-lg border-2 p-4 transition cursor-pointer ${
                    activeScheduler?._id === gen._id
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                      {gen.tone}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGeneration(gen._id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Prompt */}
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    <strong>Prompt:</strong> {gen.prompt}
                  </p>

                  {/* Content */}
                  <p className="text-gray-900 font-medium mb-2 line-clamp-3">
                    {gen.content}
                  </p>

                  {/* Media */}
                  {gen.mediaUrl && (
                    <img
                      src={gen.mediaUrl}
                      alt="generated"
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-3">
                    {new Date(gen.createdAt).toLocaleDateString()}
                  </p>

                  {/* Schedule Button */}
                  <button
                    onClick={() => setActiveScheduler(gen)}
                    className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
                  >
                    Schedule This
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}