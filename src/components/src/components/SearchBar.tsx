import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

export interface SearchFilters {
  language: string;
  tags: string[];
  sortBy: 'recent' | 'popular' | 'name';
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({
    language: '',
    tags: [],
    sortBy: 'recent'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const languages = ['Lua', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Java'];
  const commonTags = ['Game', 'Utility', 'Admin', 'Fun', 'Economy', 'Security'];

  // Simulated search suggestions based on query
  const generateSuggestions = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const commonSearches = [
      'discord bot', 'automation script', 'game hack', 'web scraper',
      'database utility', 'file manager', 'chat bot', 'data analysis',
    ];

    const filtered = commonSearches.filter(term =>
      term.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSuggestions(filtered);
    setHighlightedIndex(-1);
  };

  // Debounced search suggestions
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      generateSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filters);
    setSuggestions([]);
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          setQuery(suggestions[highlightedIndex]);
          setSuggestions([]);
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar scripts..."
              className="w-full px-4 py-2 pl-10 bg-dark-gray/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-dark-gray border border-gray-700 rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      setSuggestions([]);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-dark-gray/70 ${
                      index === highlightedIndex ? 'bg-dark-gray/70' : ''
                    } ${index === 0 ? 'rounded-t-lg' : ''} ${
                      index === suggestions.length - 1 ? 'rounded-b-lg' : ''
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 p-2 bg-dark-gray/50 border border-gray-700 rounded-lg hover:bg-dark-gray/70"
          >
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute z-10 mt-2 w-full bg-dark-gray border border-gray-700 rounded-lg shadow-lg p-4">
            <div className="space-y-4">
              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Linguagem
                </label>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-gray/50 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todas</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-dark-gray/50 text-gray-300 hover:bg-dark-gray/70'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                  className="w-full px-3 py-2 bg-dark-gray/50 border border-gray-700 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="popular">Mais Populares</option>
                  <option value="name">Nome (A-Z)</option>
                </select>
              </div>

              {/* Active Filters Summary */}
              {(filters.language || filters.tags.length > 0) && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">Filtros ativos:</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.language && (
                      <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full">
                        {filters.language}
                      </span>
                    )}
                    {filters.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Filters Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;