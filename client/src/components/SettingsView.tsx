import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Trash2, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Info
} from 'lucide-react';
import { trpc } from '@/utils/trpc';

interface SettingsViewProps {
  onClearChatHistory: () => void;
}

export function SettingsView({ onClearChatHistory }: SettingsViewProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastClearTime, setLastClearTime] = useState<Date | null>(null);

  const handleClearChatHistory = async () => {
    setIsClearing(true);
    try {
      await trpc.clearChatHistory.mutate();
      onClearChatHistory();
      setLastClearTime(new Date());
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const exportData = () => {
    // Simulate data export
    const exportData = {
      settings: {
        notifications: notificationsEnabled,
        autoSave: autoSaveEnabled,
        darkMode: darkMode,
        analytics: analyticsEnabled
      },
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `okaigpt-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const settingSections = [
    {
      title: 'Chat & AI',
      icon: <Settings className="text-blue-400" size={20} />,
      settings: [
        {
          id: 'autoSave',
          name: 'Auto-save conversations',
          description: 'Automatically save chat sessions as you interact',
          enabled: autoSaveEnabled,
          onChange: setAutoSaveEnabled
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell className="text-amber-400" size={20} />,
      settings: [
        {
          id: 'notifications',
          name: 'Desktop notifications',
          description: 'Show notifications for completed tasks and updates',
          enabled: notificationsEnabled,
          onChange: setNotificationsEnabled
        }
      ]
    },
    {
      title: 'Appearance',
      icon: <Palette className="text-purple-400" size={20} />,
      settings: [
        {
          id: 'darkMode',
          name: 'Dark mode',
          description: 'Use dark theme throughout the application',
          enabled: darkMode,
          onChange: setDarkMode
        }
      ]
    },
    {
      title: 'Privacy',
      icon: <Shield className="text-green-400" size={20} />,
      settings: [
        {
          id: 'analytics',
          name: 'Usage analytics',
          description: 'Help improve the app by sharing anonymous usage data',
          enabled: analyticsEnabled,
          onChange: setAnalyticsEnabled
        }
      ]
    }
  ];

  const storageInfo = {
    chatSessions: 15,
    generatedImages: 8,
    generatedVideos: 3,
    documentScans: 12,
    totalSize: '2.4 MB'
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Settings className="mr-3 text-gray-400" size={28} />
              Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Configure your OKAIgpt experience and manage your data
            </p>
          </div>
          
          <Badge className="bg-blue-600">
            Version 1.0.0
          </Badge>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Settings Sections */}
        {settingSections.map((section) => (
          <Card key={section.title} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                {section.icon}
                <span className="ml-2">{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex-1">
                    <h3 className="text-gray-200 font-medium">{setting.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={setting.onChange}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Data Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Database className="text-cyan-400 mr-2" size={20} />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Storage Info */}
            <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <h3 className="text-gray-200 font-medium mb-3">Storage Usage</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chat sessions:</span>
                    <span className="text-gray-200">{storageInfo.chatSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Generated images:</span>
                    <span className="text-gray-200">{storageInfo.generatedImages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Generated videos:</span>
                    <span className="text-gray-200">{storageInfo.generatedVideos}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Document scans:</span>
                    <span className="text-gray-200">{storageInfo.documentScans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total size:</span>
                    <span className="text-gray-200">{storageInfo.totalSize}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={exportData}
                variant="outline"
                className="border-gray-600 hover:border-blue-400 text-blue-400"
              >
                <Download size={16} className="mr-2" />
                Export Data
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-600 hover:border-green-400 text-green-400"
                onClick={() => {
                  // Simulate import action
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      console.log('Importing settings from:', file.name);
                      // In a real app, this would process the file
                    }
                  };
                  input.click();
                }}
              >
                <Upload size={16} className="mr-2" />
                Import Data
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-gray-600 hover:border-red-400 text-red-400"
                    disabled={isClearing}
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-2" />
                        Clear Chat History
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Clear Chat History</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      This action will permanently delete all chat sessions and messages. 
                      This cannot be undone. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearChatHistory}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {lastClearTime && (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center">
                <CheckCircle size={16} className="text-green-400 mr-2 flex-shrink-0" />
                <span className="text-green-300 text-sm">
                  Chat history cleared successfully at {lastClearTime.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Info className="text-gray-400 mr-2" size={20} />
              About OKAIgpt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-gray-200 font-semibold">Application Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-gray-200">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Build:</span>
                    <span className="text-gray-200">2024.12.19</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-gray-200">Web Application</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Framework:</span>
                    <span className="text-gray-200">React + TypeScript</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-gray-200 font-semibold">Features</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• AI-powered chat conversations</li>
                  <li>• Document scanning and analysis</li>
                  <li>• Image and video generation</li>
                  <li>• Interactive quiz creation</li>
                  <li>• Web search with AI summaries</li>
                  <li>• PDF conversion tools</li>
                  <li>• Real-time performance monitoring</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                OKAIgpt is a comprehensive AI-powered toolkit designed to enhance productivity 
                and creativity through intelligent automation and assistance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center">
                <RefreshCw className="text-green-400 mr-2" size={20} />
                System Status
              </span>
              <Badge className="bg-green-600">All Systems Operational</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-medium">API Status</p>
                <p className="text-green-400 text-sm">Operational</p>
              </div>
              
              <div className="text-center p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-medium">Database</p>
                <p className="text-green-400 text-sm">Connected</p>
              </div>
              
              <div className="text-center p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-medium">AI Services</p>
                <p className="text-green-400 text-sm">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4 border-t border-gray-800">
          <p>© 2024 OKAIgpt. Built with modern web technologies.</p>
          <p className="mt-1">
            Powered by React, TypeScript, and AI innovation.
          </p>
        </div>
      </div>
    </div>
  );
}