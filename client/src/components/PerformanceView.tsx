import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Server, 
  Database,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface RunningApp {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  status: 'running' | 'idle' | 'busy';
}

export function PerformanceView() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'good',
      trend: 'stable',
      history: [40, 42, 45, 43, 45, 47, 45]
    },
    {
      name: 'Memory Usage',
      value: 68,
      unit: '%',
      status: 'warning',
      trend: 'up',
      history: [60, 62, 65, 66, 67, 68, 68]
    },
    {
      name: 'API Response Time',
      value: 125,
      unit: 'ms',
      status: 'good',
      trend: 'down',
      history: [150, 140, 135, 130, 128, 125, 125]
    },
    {
      name: 'Active Connections',
      value: 234,
      unit: 'connections',
      status: 'good',
      trend: 'up',
      history: [200, 210, 220, 225, 230, 234, 234]
    }
  ]);

  const [runningApps] = useState<RunningApp[]>([
    { id: '1', name: 'AI Chat Service', cpu: 15, memory: 25, status: 'running' },
    { id: '2', name: 'Image Generator', cpu: 35, memory: 45, status: 'busy' },
    { id: '3', name: 'Document Scanner', cpu: 8, memory: 12, status: 'idle' },
    { id: '4', name: 'Video Generator', cpu: 65, memory: 78, status: 'busy' },
    { id: '5', name: 'Web Search API', cpu: 12, memory: 18, status: 'running' },
    { id: '6', name: 'Database Engine', cpu: 22, memory: 35, status: 'running' },
    { id: '7', name: 'File Storage', cpu: 5, memory: 8, status: 'idle' },
    { id: '8', name: 'Authentication', cpu: 3, memory: 6, status: 'idle' }
  ]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const variation = (Math.random() - 0.5) * 10;
        let newValue = metric.value + variation;
        
        // Keep values in realistic ranges
        if (metric.name.includes('Usage')) {
          newValue = Math.max(0, Math.min(100, newValue));
        } else if (metric.name.includes('Response Time')) {
          newValue = Math.max(50, Math.min(500, newValue));
        } else if (metric.name.includes('Connections')) {
          newValue = Math.max(100, Math.min(1000, newValue));
        }

        const newHistory = [...metric.history.slice(1), newValue];
        
        // Determine status based on value
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (metric.name.includes('CPU') || metric.name.includes('Memory')) {
          if (newValue > 80) status = 'critical';
          else if (newValue > 60) status = 'warning';
        } else if (metric.name.includes('Response Time')) {
          if (newValue > 300) status = 'critical';
          else if (newValue > 200) status = 'warning';
        }

        // Determine trend
        const trend = newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable';

        return {
          ...metric,
          value: Math.round(newValue * 10) / 10,
          status,
          trend,
          history: newHistory
        };
      }));
      
      setLastUpdated(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    setLastUpdated(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-600';
      case 'warning': return 'bg-yellow-600';
      case 'critical': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Zap size={14} className="text-green-400" />;
      case 'busy': return <Activity size={14} className="text-amber-400" />;
      case 'idle': return <Server size={14} className="text-gray-400" />;
      default: return <Server size={14} className="text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} className="text-red-400" />;
      case 'down': return <TrendingDown size={14} className="text-green-400" />;
      default: return null;
    }
  };

  const overallHealth = metrics.every(m => m.status === 'good') ? 'Excellent' :
                      metrics.some(m => m.status === 'critical') ? 'Critical' : 'Good';

  const totalCpu = Math.round(runningApps.reduce((sum, app) => sum + app.cpu, 0) / runningApps.length);
  const totalMemory = Math.round(runningApps.reduce((sum, app) => sum + app.memory, 0) / runningApps.length);

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Activity className="mr-3 text-green-400" size={28} />
              Performance Monitor
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time system performance and application monitoring dashboard
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <Badge className={overallHealth === 'Excellent' ? 'bg-green-600' : 
                              overallHealth === 'Critical' ? 'bg-red-600' : 'bg-yellow-600'}>
                System Status: {overallHealth}
              </Badge>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            <Button
              onClick={refreshMetrics}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
              className="border-gray-600 hover:border-green-400"
            >
              <RefreshCw size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* System Overview */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {metric.name.includes('CPU') && <Cpu size={16} className="text-blue-400" />}
                    {metric.name.includes('Memory') && <HardDrive size={16} className="text-purple-400" />}
                    {metric.name.includes('Response') && <Wifi size={16} className="text-cyan-400" />}
                    {metric.name.includes('Connections') && <Globe size={16} className="text-green-400" />}
                    <span className="text-gray-300 text-sm font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-end space-x-2">
                  <span className="text-2xl font-bold text-white">
                    {metric.value}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">
                    {metric.unit}
                  </span>
                </div>

                {/* Mini chart */}
                <div className="mt-3 flex items-end space-x-1 h-8">
                  {metric.history.map((value, i) => {
                    const maxValue = Math.max(...metric.history);
                    const height = (value / maxValue) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gray-700 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* System Resources */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Server className="mr-2 text-blue-400" size={20} />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 font-medium">Overall CPU Usage</span>
                  <span className="text-white font-bold">{totalCpu}%</span>
                </div>
                <Progress 
                  value={totalCpu} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 font-medium">Overall Memory Usage</span>
                  <span className="text-white font-bold">{totalMemory}%</span>
                </div>
                <Progress 
                  value={totalMemory} 
                  className="h-3"
                />
              </div>

              {/* Resource breakdown */}
              <div className="mt-6">
                <h4 className="text-gray-300 font-medium mb-3">Resource Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available CPU:</span>
                      <span className="text-green-400">{100 - totalCpu}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Memory:</span>
                      <span className="text-green-400">{100 - totalMemory}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Processes:</span>
                      <span className="text-blue-400">{runningApps.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Disk Usage:</span>
                      <span className="text-amber-400">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network I/O:</span>
                      <span className="text-cyan-400">1.2 GB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-green-400">15d 4h 23m</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="mr-2 text-amber-400" size={20} />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <span className="text-yellow-300 font-medium text-sm">Memory Warning</span>
                </div>
                <p className="text-yellow-200 text-xs mt-1">
                  Memory usage is above 60% threshold
                </p>
                <p className="text-yellow-400 text-xs mt-1">
                  2 minutes ago
                </p>
              </div>

              <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown size={14} className="text-green-400" />
                  <span className="text-green-300 font-medium text-sm">Performance Improved</span>
                </div>
                <p className="text-green-200 text-xs mt-1">
                  API response time decreased by 15%
                </p>
                <p className="text-green-400 text-xs mt-1">
                  5 minutes ago
                </p>
              </div>

              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database size={14} className="text-blue-400" />
                  <span className="text-blue-300 font-medium text-sm">Database Optimized</span>
                </div>
                <p className="text-blue-200 text-xs mt-1">
                  Query performance increased by 23%
                </p>
                <p className="text-blue-400 text-xs mt-1">
                  12 minutes ago
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Running Applications */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="mr-2 text-amber-400" size={20} />
                Running Applications
              </span>
              <Badge className="bg-gray-700">
                {runningApps.filter(app => app.status === 'running').length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 pb-2">Application</th>
                    <th className="text-left text-gray-400 pb-2">Status</th>
                    <th className="text-left text-gray-400 pb-2">CPU Usage</th>
                    <th className="text-left text-gray-400 pb-2">Memory Usage</th>
                    <th className="text-left text-gray-400 pb-2">Resource Bar</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {runningApps.map((app) => (
                    <tr key={app.id} className="border-b border-gray-700/50">
                      <td className="py-3">
                        <span className="text-gray-200 font-medium">{app.name}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(app.status)}
                          <span className="text-gray-300 capitalize">{app.status}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-gray-200">{app.cpu}%</span>
                      </td>
                      <td className="py-3">
                        <span className="text-gray-200">{app.memory}%</span>
                      </td>
                      <td className="py-3 w-32">
                        <div className="space-y-1">
                          <Progress value={app.cpu} className="h-1" />
                          <Progress value={app.memory} className="h-1" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-amber-900/20 border-amber-700">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-400 font-semibold mb-1">Demo Dashboard</p>
                <p className="text-amber-200">
                  This is a simulated performance monitoring dashboard for demonstration purposes. 
                  The metrics and data shown are generated for display only and do not reflect 
                  actual system performance or real application statistics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}