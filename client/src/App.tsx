import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ScannerView } from './components/ScannerView';
import { PdfConverterView } from './components/PdfConverterView';
import { ImageGeneratorView } from './components/ImageGeneratorView';
import { VideoGeneratorView } from './components/VideoGeneratorView';
import { QuizGeneratorView } from './components/QuizGeneratorView';
import { WebExplorerView } from './components/WebExplorerView';
import { PerformanceView } from './components/PerformanceView';
import { SettingsView } from './components/SettingsView';
import type { ChatMessage, ChatSession } from '../../server/src/schema';
import './App.css';

export type ViewType = 'chat' | 'scanner' | 'pdf-converter' | 'image-generator' | 'video-generator' | 'quiz-generator' | 'web-explorer' | 'performance' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const clearChatHistory = useCallback(() => {
    setChatSessions([]);
    setChatMessages([]);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return (
          <ChatView 
            sessions={chatSessions}
            messages={chatMessages}
            onSessionsChange={setChatSessions}
            onMessagesChange={setChatMessages}
          />
        );
      case 'scanner':
        return <ScannerView />;
      case 'pdf-converter':
        return <PdfConverterView />;
      case 'image-generator':
        return <ImageGeneratorView />;
      case 'video-generator':
        return <VideoGeneratorView />;
      case 'quiz-generator':
        return <QuizGeneratorView />;
      case 'web-explorer':
        return <WebExplorerView />;
      case 'performance':
        return <PerformanceView />;
      case 'settings':
        return <SettingsView onClearChatHistory={clearChatHistory} />;
      default:
        return <ChatView 
          sessions={chatSessions}
          messages={chatMessages}
          onSessionsChange={setChatSessions}
          onMessagesChange={setChatMessages}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter">
      <div className="flex h-screen">
        <Sidebar 
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <main className="flex-1 overflow-hidden">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default App;