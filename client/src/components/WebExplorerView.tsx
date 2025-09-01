import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Globe, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateWebSearchInput } from '../../../server/src/schema';

interface SearchResult {
  id: number;
  query: string;
  summary: string;
  sources: string[];
  created_at: Date;
}

export function WebExplorerView() {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  const performSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const input: CreateWebSearchInput = {
        query: query.trim()
      };

      const result = await trpc.searchWeb.mutate(input);
      
      const searchResult: SearchResult = {
        id: result.id,
        query: result.query,
        summary: result.summary,
        sources: result.sources,
        created_at: result.created_at
      };

      setSearchResult(searchResult);
      setSearchHistory(prev => [searchResult, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };



  const openExternalSearch = (engine: string) => {
    const encodedQuery = encodeURIComponent(query);
    const urls = {
      startpage: `https://www.startpage.com/search?q=${encodedQuery}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodedQuery}`,
      searx: `https://searx.org/?q=${encodedQuery}`
    };
    
    window.open(urls[engine as keyof typeof urls], '_blank');
  };

  const trendingQueries = [
    "Latest AI developments 2024",
    "Climate change solutions",
    "Renewable energy innovations",
    "Space exploration news",
    "Cryptocurrency market trends",
    "Electric vehicle technology",
    "Mental health research",
    "Sustainable agriculture methods"
  ];

  const suggestionCategories = [
    {
      title: "Technology",
      icon: <Zap size={16} className="text-blue-400" />,
      queries: [
        "Artificial intelligence latest breakthroughs",
        "Quantum computing developments 2024",
        "Cybersecurity best practices",
        "Machine learning applications"
      ]
    },
    {
      title: "Science",
      icon: <Globe size={16} className="text-green-400" />,
      queries: [
        "Recent scientific discoveries",
        "Climate change research findings",
        "Space exploration missions",
        "Medical breakthrough news"
      ]
    },
    {
      title: "Business",
      icon: <TrendingUp size={16} className="text-amber-400" />,
      queries: [
        "Market trends analysis 2024",
        "Startup funding news",
        "Economic forecast updates",
        "Industry innovation reports"
      ]
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Search className="mr-3 text-cyan-400" size={28} />
              Web Explorer
            </h1>
            <p className="text-gray-400 mt-1">
              AI-powered web search with intelligent summaries and real-time information
            </p>
          </div>
          
          {/* External Search Options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Privacy-focused search:</span>
            <Button
              onClick={() => openExternalSearch('startpage')}
              size="sm"
              variant="outline"
              className="border-gray-600 hover:border-cyan-400 text-xs"
              disabled={!query.trim()}
            >
              <Shield size={12} className="mr-1" />
              Startpage
            </Button>
            <Button
              onClick={() => openExternalSearch('duckduckgo')}
              size="sm"
              variant="outline"
              className="border-gray-600 hover:border-cyan-400 text-xs"
              disabled={!query.trim()}
            >
              DuckDuckGo
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Search Bar */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about current events, research, or any topic..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg h-12"
                  disabled={isSearching}
                />
              </div>
              <Button
                onClick={performSearch}
                disabled={!query.trim() || isSearching}
                className="btn-accent h-12 px-8"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} className="mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
                <AlertCircle size={16} className="text-red-400 mr-2 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {searchResult ? (
          /* Search Results */
          <div className="space-y-6">
            {/* Main Result */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Globe className="mr-2 text-cyan-400" size={20} />
                    Search Results for: "{searchResult.query}"
                  </CardTitle>
                  <Badge className="bg-green-600 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {searchResult.created_at.toLocaleTimeString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Summary */}
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h3 className="font-semibold text-cyan-300 mb-2 flex items-center">
                    <Search size={16} className="mr-1" />
                    AI Summary
                  </h3>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {searchResult.summary}
                  </p>
                </div>

                {/* Sources */}
                <div>
                  <h3 className="font-semibold text-gray-300 mb-3 flex items-center">
                    <ExternalLink size={16} className="mr-1" />
                    Sources ({searchResult.sources.length})
                  </h3>
                  <div className="grid gap-3">
                    {searchResult.sources.map((source, index) => {
                      try {
                        const url = new URL(source);
                        const domain = url.hostname.replace('www.', '');
                        
                        return (
                          <a
                            key={index}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-cyan-400 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Globe size={14} className="text-gray-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-gray-200 font-medium truncate">
                                    {domain}
                                  </p>
                                  <p className="text-gray-400 text-xs truncate">
                                    {source}
                                  </p>
                                </div>
                              </div>
                              <ExternalLink size={14} className="text-gray-400 group-hover:text-cyan-400 flex-shrink-0" />
                            </div>
                          </a>
                        );
                      } catch {
                        return (
                          <a
                            key={index}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-cyan-400 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-200 truncate">{source}</span>
                              <ExternalLink size={14} className="text-gray-400 group-hover:text-cyan-400 flex-shrink-0 ml-2" />
                            </div>
                          </a>
                        );
                      }
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search History */}
            {searchHistory.length > 1 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Recent Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchHistory.slice(1).map((result, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(result.query);
                          setSearchResult(result);
                        }}
                        className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-cyan-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-200 font-medium truncate">
                              {result.query}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {result.created_at.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {result.sources.length} sources
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Default View - Suggestions */
          <div className="space-y-6">
            {/* Trending */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <TrendingUp className="mr-2 text-amber-400" size={20} />
                  Trending Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-2">
                  {trendingQueries.map((trendingQuery, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(trendingQuery);
                        setError(null);
                      }}
                      className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-amber-400 transition-all text-gray-300 text-sm"
                    >
                      <div className="flex items-center">
                        <TrendingUp size={14} className="text-amber-400 mr-2 flex-shrink-0" />
                        {trendingQuery}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Suggestions */}
            <div className="grid lg:grid-cols-3 gap-6">
              {suggestionCategories.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center">
                      {category.icon}
                      <span className="ml-2">{category.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.queries.map((query, queryIndex) => (
                        <button
                          key={queryIndex}
                          onClick={() => {
                            setQuery(query);
                            setError(null);
                          }}
                          className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 hover:border-cyan-400 transition-all text-gray-300 text-sm"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* How it Works */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">🔍 How AI Web Search Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center mx-auto">
                      <Search size={20} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-200">1. Search</h3>
                    <p className="text-sm text-gray-400">
                      AI searches across multiple sources for real-time information
                    </p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto">
                      <Zap size={20} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-200">2. Analyze</h3>
                    <p className="text-sm text-gray-400">
                      Information is processed and synthesized into a comprehensive summary
                    </p>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                      <ExternalLink size={20} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-200">3. Present</h3>
                    <p className="text-sm text-gray-400">
                      Results include AI summary with original sources for verification
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}