import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Copy, 
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wand2
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateGeneratedImageInput } from '../../../server/src/schema';

export function ImageGeneratorView() {
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<Array<{ prompt: string; imageUrl: string; timestamp: Date }>>([]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your image');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const input: CreateGeneratedImageInput = {
        prompt: prompt.trim()
      };

      const result = await trpc.generateImage.mutate(input);
      setGeneratedImageUrl(result.image_url);
      
      // Add to history
      setGenerationHistory(prev => [{
        prompt: prompt.trim(),
        imageUrl: result.image_url,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]); // Keep last 10 generations

    } catch (error) {
      console.error('Image generation failed:', error);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImageUrl) return;

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download image');
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };



  const regenerateImage = () => {
    if (prompt.trim()) {
      generateImage();
    }
  };

  const samplePrompts = [
    "A serene mountain landscape at sunset with golden hour lighting",
    "A futuristic city with flying cars and neon lights",
    "A cozy coffee shop on a rainy day, warm interior lighting",
    "An astronaut riding a horse on Mars, photorealistic style",
    "A magical forest with glowing mushrooms and fairy lights",
    "A vintage 1950s diner with chrome details and neon signs",
    "A minimalist modern living room with large windows",
    "A steampunk airship floating above Victorian London",
    "A field of lavender flowers under a starry night sky",
    "A cyberpunk samurai in a neon-lit alley, digital art style"
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Wand2 className="mr-3 text-purple-400" size={28} />
              Image Generator
            </h1>
            <p className="text-gray-400 mt-1">
              Create stunning AI-generated images from your text descriptions
            </p>
          </div>
          
          {generationHistory.length > 0 && (
            <Badge className="bg-purple-600">
              {generationHistory.length} image{generationHistory.length !== 1 ? 's' : ''} generated
            </Badge>
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
                  <Sparkles className="mr-2 text-amber-400" size={20} />
                  Image Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Describe the image you want to create
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A beautiful sunset over a calm lake with mountains in the background..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={generateImage}
                    disabled={!prompt.trim() || isGenerating}
                    className="flex-1 btn-accent"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} className="mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                  
                  {generatedImageUrl && (
                    <Button
                      onClick={regenerateImage}
                      disabled={!prompt.trim() || isGenerating}
                      variant="outline"
                      className="border-gray-600 hover:border-purple-400"
                    >
                      <RefreshCw size={16} />
                    </Button>
                  )}
                  
                  <Button
                    onClick={copyPrompt}
                    disabled={!prompt.trim()}
                    variant="outline"
                    className="border-gray-600 hover:border-amber-400"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Button>
                </div>

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
                <CardTitle className="text-white text-lg">🎨 Inspiration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {samplePrompts.map((samplePrompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setPrompt(samplePrompt);
                        setError(null);
                      }}
                      className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-purple-400 transition-all text-gray-300 text-sm"
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
                    <ImageIcon className="mr-2 text-blue-400" size={20} />
                    Generated Image
                  </span>
                  {generatedImageUrl && (
                    <Button
                      onClick={downloadImage}
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
                <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                  {isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="text-purple-400 font-semibold">Creating your image...</p>
                        <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
                      </div>
                    </div>
                  ) : generatedImageUrl ? (
                    <img
                      src={generatedImageUrl}
                      alt="Generated artwork"
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(generatedImageUrl, '_blank')}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <ImageIcon size={48} className="mb-4" />
                      <p className="text-lg font-medium mb-2">No image generated yet</p>
                      <p className="text-sm text-center px-4">
                        Enter a description and click "Generate Image" to create your artwork
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generation History */}
            {generationHistory.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">📜 Recent Generations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {generationHistory.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-purple-400 transition-colors cursor-pointer"
                        onClick={() => {
                          setPrompt(item.prompt);
                          setGeneratedImageUrl(item.imageUrl);
                        }}
                      >
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt="Generated thumbnail"
                            className="w-full h-full object-cover rounded border border-gray-600"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-200 font-medium text-sm truncate">
                            {item.prompt}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {item.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tips */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">💡 Pro Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-200">Writing Great Prompts</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Be specific about style (photorealistic, cartoon, oil painting)</li>
                  <li>• Include lighting details (golden hour, dramatic shadows)</li>
                  <li>• Mention camera angles and composition</li>
                  <li>• Add mood and atmosphere descriptions</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-200">Style Keywords</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• "digital art", "concept art", "trending on artstation"</li>
                  <li>• "4K", "highly detailed", "ultra realistic"</li>
                  <li>• "cinematic lighting", "dramatic composition"</li>
                  <li>• Artist names: "by Greg Rutkowski", "Alphonse Mucha style"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}