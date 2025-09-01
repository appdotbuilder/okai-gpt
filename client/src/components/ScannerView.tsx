import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  Scan, 
  FileImage, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateDocumentAnalysisInput } from '../../../server/src/schema';

export function ScannerView() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setSelectedImage(file);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            
            const previewUrl = URL.createObjectURL(blob);
            setImagePreviewUrl(previewUrl);
            
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const analyzeDocument = async () => {
    if (!selectedImage || !prompt.trim()) {
      setError('Please select an image and enter a prompt');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert image to base64 for API
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        const input: CreateDocumentAnalysisInput = {
          image_url: base64Image,
          prompt: prompt.trim()
        };

        try {
          const result = await trpc.analyzeDocument.mutate(input);
          setAnalysisResult(result.analysis_result);
        } catch (error) {
          console.error('Analysis failed:', error);
          setError('Failed to analyze document. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Error processing image file');
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async () => {
    if (analysisResult) {
      try {
        await navigator.clipboard.writeText(analysisResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setPrompt('');
    setAnalysisResult(null);
    setError(null);
    setCopied(false);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Scan className="mr-3 text-amber-400" size={28} />
              Document Scanner
            </h1>
            <p className="text-gray-400 mt-1">
              Analyze images and documents with AI-powered text recognition and understanding
            </p>
          </div>
          
          {(selectedImage || analysisResult) && (
            <Button
              onClick={clearAll}
              variant="outline"
              className="border-gray-600 hover:border-red-400 text-red-400"
            >
              Clear All
            </Button>
          )}
        </div>
      </header>

      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Upload/Preview Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileImage className="mr-2 text-blue-400" size={20} />
                Image Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Image Preview */}
              {imagePreviewUrl ? (
                <div className="relative">
                  <img
                    src={imagePreviewUrl}
                    alt="Document preview"
                    className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-600"
                  />
                  <Badge 
                    className="absolute top-2 right-2 bg-green-600"
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Ready
                  </Badge>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                      <FileImage size={32} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 font-medium">No image selected</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Upload an image or use your camera to get started
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera View */}
              {isCameraActive && (
                <div className="mt-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-600"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {/* Upload Controls */}
              <div className="flex gap-3 mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isCameraActive}
                >
                  <Upload size={16} className="mr-2" />
                  Upload Image
                </Button>
                
                {!isCameraActive ? (
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="flex-1 border-gray-600 hover:border-amber-400"
                  >
                    <Camera size={16} className="mr-2" />
                    Use Camera
                  </Button>
                ) : (
                  <div className="flex gap-2 flex-1">
                    <Button
                      onClick={captureImage}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Camera size={16} className="mr-2" />
                      Capture
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="border-gray-600 hover:border-red-400"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Scan className="mr-2 text-amber-400" size={20} />
                Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What would you like to know about this document?
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Extract all the text from this document, Summarize the key points, What is the total amount on this invoice?"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                />
              </div>

              {/* Analyze Button */}
              <Button
                onClick={analyzeDocument}
                disabled={!selectedImage || !prompt.trim() || isAnalyzing}
                className="w-full btn-accent"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scan size={16} className="mr-2" />
                    Analyze Document
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
                  <AlertCircle size={16} className="text-red-400 mr-2 flex-shrink-0" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              {/* Results */}
              {analysisResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      Analysis Results
                    </label>
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 hover:border-amber-400"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="mr-1 text-green-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-200 text-sm font-mono">
                      {analysisResult}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sample Prompts */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">💡 Sample Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Extract all text from this document",
                "Summarize the main points",
                "What is the total amount on this invoice?",
                "Translate this text to English",
                "What type of document is this?",
                "List all the contact information",
                "What are the key dates mentioned?",
                "Convert this handwritten text to typed text"
              ].map((samplePrompt, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(samplePrompt)}
                  className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-amber-400 transition-all text-gray-300 text-sm"
                >
                  {samplePrompt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}