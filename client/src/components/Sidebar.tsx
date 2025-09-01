import { 
  MessageCircle, 
  ScanText, 
  FileText, 
  Image, 
  Video, 
  FileQuestion, 
  Globe, 
  Activity, 
  Settings 
} from 'lucide-react';
import type { ViewType } from '../App';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'chat', label: 'AI Chat', icon: MessageCircle },
  { id: 'scanner', label: 'Document Scanner', icon: ScanText },
  { id: 'pdf-converter', label: 'PDF Converter', icon: FileText },
  { id: 'image-generator', label: 'Image Generator', icon: Image },
  { id: 'video-generator', label: 'Video Generator', icon: Video },
  { id: 'quiz-generator', label: 'Quiz Generator', icon: FileQuestion },
  { id: 'web-explorer', label: 'Web Explorer', icon: Globe },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo/Title */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-gradient">
          OKAIgpt
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          AI-Powered Toolkit
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    text-left transition-all relative
                    ${isActive 
                      ? 'nav-active shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-white' : 'text-gray-400'} 
                  />
                  <span className="font-medium">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          <div className="mb-1">Version 1.0.0</div>
          <div>Built with ❤️</div>
        </div>
      </div>
    </aside>
  );
}