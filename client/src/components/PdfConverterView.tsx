import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Download, 
  File, 
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Note: In a real implementation, you would install jsPDF:
// npm install jspdf html2canvas
// For now, we'll create a stub implementation

export function PdfConverterView() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type === 'text/plain';
      return isImage || isText;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were ignored. Only images and text files are supported.');
    } else {
      setError(null);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Stub implementation - in real app, this would use jsPDF
  const convertToPdf = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to convert');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // Simulate conversion time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Create a new jsPDF instance
      // 2. For each image: add as image to PDF
      // 3. For each text file: read content and add as text to PDF
      // 4. Generate and download the PDF blob
      
      // For now, create a simple text file as demonstration
      const pdfContent = `PDF Conversion Results
====================

Files processed: ${selectedFiles.length}
Files included:
${selectedFiles.map((file, index) => `${index + 1}. ${file.name} (${file.type})`).join('\n')}

Generated on: ${new Date().toLocaleString()}

Note: This is a demonstration. In a real implementation, 
this would be a proper PDF with your images and text content.`;

      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Clear files after successful conversion
      setTimeout(() => {
        clearAll();
      }, 1000);

    } catch (error) {
      console.error('Conversion failed:', error);
      setError('Failed to convert files. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon size={16} className="text-blue-400" />;
    }
    return <File size={16} className="text-green-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <FileText className="mr-3 text-orange-400" size={28} />
              PDF Converter
            </h1>
            <p className="text-gray-400 mt-1">
              Convert images and text files into a single PDF document - completely client-side
            </p>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="flex items-center space-x-3">
              <Badge className="bg-amber-600">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </Badge>
              <Button
                onClick={clearAll}
                variant="outline"
                className="border-gray-600 hover:border-red-400 text-red-400"
              >
                <Trash2 size={16} className="mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* File Drop Zone */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                drop-zone border-2 rounded-xl p-12 text-center transition-all
                ${isDragOver ? 'drag-over' : ''}
                ${selectedFiles.length === 0 ? 'min-h-[300px] flex items-center justify-center' : 'min-h-[200px]'}
              `}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                  <Upload size={24} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-200 mb-2">
                    Drop your files here
                  </p>
                  <p className="text-gray-400 mb-4">
                    or click to select files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload size={16} className="mr-2" />
                    Select Files
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Supports: JPG, PNG, GIF, TXT files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <File className="mr-2 text-amber-400" size={20} />
                Selected Files ({selectedFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {file.type.startsWith('image/') ? 'Image' : 'Text'}
                      </Badge>
                      <Button
                        onClick={() => removeFile(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Convert Button */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-red-400 mr-2" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}
              
              <Button
                onClick={convertToPdf}
                disabled={selectedFiles.length === 0 || isConverting}
                className="btn-accent px-8 py-3 text-lg"
              >
                {isConverting ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download size={20} className="mr-2" />
                    Convert & Download PDF
                  </>
                )}
              </Button>
              
              {selectedFiles.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Select files to enable conversion
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">📋 How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Upload size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-200">1. Upload Files</h3>
                <p className="text-sm text-gray-400">
                  Select or drag & drop your images and text files
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <FileText size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-200">2. Convert</h3>
                <p className="text-sm text-gray-400">
                  Files are processed entirely in your browser
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Download size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-200">3. Download</h3>
                <p className="text-sm text-gray-400">
                  Your PDF is ready for download
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-400 font-semibold mb-1">Privacy First</p>
                  <p className="text-gray-300">
                    All processing happens locally in your browser. Your files never leave your device.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stub Implementation Notice */}
        <Card className="bg-amber-900/20 border-amber-700 mt-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-400 font-semibold mb-1">Development Note</p>
                <p className="text-amber-200">
                  This is currently a demonstration version. In production, this would use the jsPDF library 
                  to create proper PDF documents with your images and text content embedded.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}