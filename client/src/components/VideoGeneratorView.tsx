import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Play, 
  Download, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Trash2,
  Film
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateGeneratedVideoInput } from '../../../server/src/schema';

export function VideoGeneratorView() {
  const [prompt, setPrompt] = useState('');
  const [initialImage, setInitialImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Poll for video status updates
  const pollVideoStatus = async (id: number) => {
    try {
      const result = await trpc.getVideoStatus.query({ id });
      setStatus(result.status);
      setProgressMessage(result.progress_message);
      setVideoUrl(result.video_url);

      // Update progress based on status
      switch (result.status) {
        case 'pending':
          setProgress(10);
          break;
        case 'processing':
          setProgress(50);
          break;
        case 'completed':
          setProgress(100);
          setIsGenerating(false);
          if (pollIntervalRef.current) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          break;
        case 'failed':
          setIsGenerating(false);
          setError(result.progress_message || 'Video generation failed');
          if (pollIntervalRef.current) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          break;
      }
    } catch (error) {
      console.error('Failed to get video status:', error);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setInitialImage(file);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setInitialImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your video');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setVideoUrl(null);
    setProgressMessage(null);

    try {
      let imageUrl = null;
      
      // Convert image to base64 if provided
      if (initialImage) {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(initialImage);
        });
      }

      const input: CreateGeneratedVideoInput = {
        prompt: prompt.trim(),
        initial_image_url: imageUrl
      };

      const result = await trpc.generateVideo.mutate(input);
      setStatus(result.status);
      setProgress(10);
      setProgressMessage('Video generation started...');

      // Start polling for status updates
      pollIntervalRef.current = window.setInterval(() => {
        pollVideoStatus(result.id);
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      console.error('Video generation failed:', error);
      setError('Failed to start video generation. Please try again.');
      setIsGenerating(false);
    }
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download video');
    }
  };

  const resetGeneration = () => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    setIsGenerating(false);

    setVideoUrl(null);
    setStatus('pending');
    setProgress(0);
    setProgressMessage(null);
    setError(null);
  };

  const samplePrompts = [
    "A peaceful ocean sunset with gentle waves",
    "Rain falling on a window with city lights in the background",
    "A campfire crackling under a starry night sky",
    "Clouds moving across a mountain landscape in time-lapse",
    "A flower blooming in fast motion with morning dew",
    "Snow falling gently on a quiet forest path",
    "Birds flying over a calm lake at golden hour",
    "Steam rising from a hot cup of coffee on a wooden table"
  ];

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'processing': return 'bg-blue-600';
      case 'completed': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'processing': return <Loader2 size={16} className="animate-spin" />;
      case 'completed': return <CheckCircle size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return <Video size={16} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Film className="mr-3 text-red-400" size={28} />
              Video Generator
            </h1>
            <p className="text-gray-400 mt-1">
              Create short AI-generated video clips from text descriptions and optional starter images
            </p>
          </div>
          
          {isGenerating && (
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{status}</span>
              </Badge>
              <Button
                onClick={resetGeneration}
                variant="outline"
                size="sm"
                className="border-gray-600 hover:border-red-400 text-red-400"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Video className="mr-2 text-red-400" size={20} />
                  Video Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video Description
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the video you want to create (e.g., 'A peaceful sunset over calm ocean waters with gentle waves')"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                    disabled={isGenerating}
                  />
                </div>

                {/* Initial Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Starting Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {imagePreviewUrl ? (
                      <div className="relative">
                        <img
                          src={imagePreviewUrl}
                          alt="Initial frame"
                          className="w-full h-32 object-cover rounded border border-gray-600"
                        />
                        <Button
                          onClick={removeImage}
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          disabled={isGenerating}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon size={24} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400 text-sm">
                          Click to upload starting image
                        </p>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <Button
                  onClick={generateVideo}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full btn-accent"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video size={16} className="mr-2" />
                      Generate Video
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
                    <AlertCircle size={16} className="text-red-400 mr-2 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sample Prompts */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">🎬 Video Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {samplePrompts.map((samplePrompt, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(samplePrompt)}
                      className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-red-400 transition-all text-gray-300 text-sm"
                      disabled={isGenerating}
                    >
                      {samplePrompt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Display Area */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    <Play className="mr-2 text-green-400" size={20} />
                    Generated Video
                  </span>
                  {videoUrl && status === 'completed' && (
                    <Button
                      onClick={downloadVideo}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                  {status === 'completed' && videoUrl ? (
                    <video
                      ref={videoRef}
                      controls
                      className="w-full h-full"
                      poster={imagePreviewUrl || undefined}
                    >
                      <source src={videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center px-4">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          {getStatusIcon()}
                          <span className="text-red-400 font-semibold capitalize">{status}</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {progressMessage || 'Processing your video...'}
                        </p>
                        <div className="w-64 mt-4">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            {progress}% complete
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <Video size={48} className="mb-4" />
                      <p className="text-lg font-medium mb-2">No video generated yet</p>
                      <p className="text-sm text-center px-4">
                        Enter a description and click "Generate Video" to create your clip
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Details */}
            {isGenerating && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Clock className="mr-2 text-amber-400" size={20} />
                    Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Status:</span>
                      <Badge className={getStatusColor()}>
                        {getStatusIcon()}
                        <span className="ml-1 capitalize">{status}</span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Progress:</span>
                        <span className="text-gray-400">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {progressMessage && (
                      <div className="p-3 bg-gray-700 rounded border border-gray-600">
                        <p className="text-gray-300 text-sm">{progressMessage}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Video generation can take 2-5 minutes</p>
                      <p>• Keep this tab open to monitor progress</p>
                      <p>• You'll be notified when the video is ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">📹 Video Generation Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-200">Best Practices</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Keep descriptions simple and clear</li>
                  <li>• Focus on movement and motion</li>
                  <li>• Mention lighting and mood</li>
                  <li>• Use natural scene descriptions</li>
                  <li>• Avoid complex narratives</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-200">Technical Details</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Videos are typically 3-5 seconds long</li>
                  <li>• Resolution: 512x512 or 1024x576</li>
                  <li>• Format: MP4 (H.264)</li>
                  <li>• Generation time: 2-5 minutes</li>
                  <li>• Starting image helps guide the video</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}