import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Upload, 
  Mic, 
  MicOff, 
  Volume2, 
  Copy, 
  Check, 
  Image as ImageIcon,
  FileText,
  Languages,
  Zap,
  Code,
  Plus,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ChatMessage, ChatSession, CreateChatMessageInput, CreateChatSessionInput } from '../../../server/src/schema';

interface ChatViewProps {
  sessions: ChatSession[];
  messages: ChatMessage[];
  onSessionsChange: (sessions: ChatSession[]) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
}

const languages = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Español' },
  { value: 'french', label: 'Français' },
  { value: 'german', label: 'Deutsch' },
  { value: 'italian', label: 'Italiano' },
  { value: 'portuguese', label: 'Português' },
  { value: 'russian', label: 'Русский' },
  { value: 'japanese', label: '日本語' },
  { value: 'korean', label: '한국어' },
  { value: 'chinese', label: '中文' },
];

export function ChatView({ sessions, messages, onSessionsChange, onMessagesChange }: ChatViewProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [genZMode, setGenZMode] = useState(false);
  const [copyCodeOnly, setCopyCodeOnly] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions on mount
  const loadSessions = useCallback(async () => {
    try {
      const result = await trpc.getChatSessions.query();
      onSessionsChange(result);
      
      if (result.length > 0 && !currentSessionId) {
        setCurrentSessionId(result[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [onSessionsChange, currentSessionId]);

  // Load messages for current session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const result = await trpc.getChatMessages.query({ session_id: sessionId });
      onMessagesChange(result);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [onMessagesChange]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async () => {
    try {
      const sessionInput: CreateChatSessionInput = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        gen_z_mode: genZMode,
        copy_code_only_mode: copyCodeOnly,
        target_language: targetLanguage
      };
      
      const newSession = await trpc.createChatSession.mutate(sessionInput);
      onSessionsChange([...sessions, newSession]);
      setCurrentSessionId(newSession.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await trpc.deleteChatSession.mutate({ sessionId });
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      onSessionsChange(updatedSessions);
      
      if (currentSessionId === sessionId) {
        const nextSession = updatedSessions[0];
        setCurrentSessionId(nextSession?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !uploadedFile) return;
    if (!currentSessionId) {
      await createNewSession();
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user message
      const userMessageInput: CreateChatMessageInput = {
        session_id: currentSessionId,
        role: 'user',
        content: inputMessage.trim(),
        content_type: uploadedFile ? (uploadedFile.type.includes('image') ? 'image' : 'pdf') : 'text',
        metadata: uploadedFile ? { fileName: uploadedFile.name, fileSize: uploadedFile.size } : null
      };

      const userMessage = await trpc.createChatMessage.mutate(userMessageInput);
      
      // Update messages with user message
      const updatedMessages = [...messages, userMessage];
      onMessagesChange(updatedMessages);

      // TODO: Here we would send to AI and get response
      // For now, simulate AI response
      setTimeout(async () => {
        try {
          const aiResponse = genZMode 
            ? "yo that's pretty cool ngl 🔥 let me think about that real quick..."
            : "I understand your message. Let me provide you with a comprehensive response.";

          const aiMessageInput: CreateChatMessageInput = {
            session_id: currentSessionId,
            role: 'assistant',
            content: aiResponse,
            content_type: 'text'
          };

          const aiMessage = await trpc.createChatMessage.mutate(aiMessageInput);
          onMessagesChange([...updatedMessages, aiMessage]);
        } catch (error) {
          console.error('Failed to create AI message:', error);
        } finally {
          setIsLoading(false);
        }
      }, 1000);

      // Clear input
      setInputMessage('');
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (content: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isValidType = file.type.includes('image') || file.type.includes('pdf');
      if (isValidType) {
        setUploadedFile(file);
      } else {
        alert('Please select an image or PDF file');
      }
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement speech-to-text functionality
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentMessages = messages.filter(m => m.session_id === currentSessionId);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">AI Chat</h1>
            {currentSession && (
              <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                {currentSession.title}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Gen Z Mode */}
            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-amber-400" />
              <span className="text-sm text-gray-300">Gen Z Mode</span>
              <Switch
                checked={genZMode}
                onCheckedChange={setGenZMode}
              />
            </div>
            
            {/* Copy Code Only Mode */}
            <div className="flex items-center space-x-2">
              <Code size={16} className="text-orange-400" />
              <span className="text-sm text-gray-300">Code Only</span>
              <Switch
                checked={copyCodeOnly}
                onCheckedChange={setCopyCodeOnly}
              />
            </div>
            
            {/* Language Selection */}
            <div className="flex items-center space-x-2">
              <Languages size={16} className="text-blue-400" />
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Session Management */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={createNewSession}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus size={16} className="mr-1" />
              New Chat
            </Button>
            
            {sessions.length > 1 && (
              <Select value={currentSessionId || ''} onValueChange={setCurrentSessionId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {currentSessionId && (
            <Button
              onClick={() => deleteSession(currentSessionId)}
              size="sm"
              variant="destructive"
            >
              <Trash2 size={16} className="mr-1" />
              Delete Session
            </Button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm">Send a message to begin chatting with AI</p>
          </div>
        ) : (
          currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-2xl ${
                message.role === 'user' 
                  ? 'message-user ml-12' 
                  : 'message-assistant mr-12'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={message.role === 'user' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {message.role === 'user' ? 'You' : 'AI'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {message.created_at.toLocaleTimeString()}
                        </span>
                        {message.content_type !== 'text' && (
                          <Badge variant="outline" className="text-xs">
                            {message.content_type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                            {message.content_type}
                          </Badge>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          {message.metadata.fileName && (
                            <span>📎 {message.metadata.fileName}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {message.role === 'assistant' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // TODO: Implement text-to-speech
                            console.log('Playing audio for message:', message.id);
                          }}
                        >
                          <Volume2 size={14} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <Card className="message-assistant mr-12">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full loading-dot"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full loading-dot"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full loading-dot"></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        {uploadedFile && (
          <div className="mb-3 p-3 bg-gray-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {uploadedFile.type.includes('image') ? (
                <ImageIcon size={16} className="text-blue-400" />
              ) : (
                <FileText size={16} className="text-red-400" />
              )}
              <span className="text-sm text-gray-300">{uploadedFile.name}</span>
              <Badge variant="outline" className="text-xs">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setUploadedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={uploadedFile ? "Ask something about your file..." : "Type your message..."}
              className="resize-none min-h-[60px] max-h-32 input-focus bg-gray-700 border-gray-600 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-gray-600 hover:border-amber-400"
              >
                <Upload size={16} />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={toggleRecording}
                className={`border-gray-600 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 border-red-500' 
                    : 'hover:border-amber-400'
                }`}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </Button>
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={(!inputMessage.trim() && !uploadedFile) || isLoading}
              className="btn-accent"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}