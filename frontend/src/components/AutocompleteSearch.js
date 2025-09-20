import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Tag, Building, Wrench } from 'lucide-react';

/**
 * AutocompleteSearch Component
 * Provides debounced search suggestions with categorized results
 */
const AutocompleteSearch = ({ 
  onSelect, 
  placeholder = "Search providers, services, or locations...",
  className = "",
  debounceMs = 300 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({
    providers: [],
    services: [],
    categories: [],
    locations: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Get all suggestions as flat array for keyboard navigation
  const allSuggestions = [
    ...suggestions.providers.map(item => ({ ...item, section: 'providers' })),
    ...suggestions.services.map(item => ({ ...item, section: 'services' })),
    ...suggestions.categories.map(item => ({ ...item, section: 'categories' })),
    ...suggestions.locations.map(item => ({ ...item, section: 'locations' }))
  ];

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions({ providers: [], services: [], categories: [], locations: [] });
      setIsLoading(false);
      return;
    }

    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      
      const response = await fetch(
        `/api/search/suggestions/?q=${encodeURIComponent(searchQuery)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || { providers: [], services: [], categories: [], locations: [] });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error);
        setSuggestions({ providers: [], services: [], categories: [], locations: [] });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, fetchSuggestions, debounceMs]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle item selection
  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect?.(item);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSelect(allSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const renderSuggestionIcon = (type) => {
    switch (type) {
      case 'provider':
        return <Building className="w-4 h-4 text-blue-500" />;
      case 'service':
        return <Wrench className="w-4 h-4 text-green-500" />;
      case 'category':
        return <Tag className="w-4 h-4 text-purple-500" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-red-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderSuggestionSection = (title, items, sectionKey) => {
    if (items.length === 0) return null;

    return (
      <div key={sectionKey} className="py-2">
        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
          {title}
        </div>
        {items.map((item, index) => {
          const globalIndex = allSuggestions.findIndex(s => s.id === item.id && s.section === sectionKey);
          const isSelected = globalIndex === selectedIndex;
          
          return (
            <button
              key={`${sectionKey}-${item.id}`}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center space-x-3 ${
                isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
              onClick={() => handleSelect({ ...item, section: sectionKey })}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
            >
              {renderSuggestionIcon(item.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </div>
                {item.provider_name && (
                  <div className="text-xs text-gray-500 truncate">
                    by {item.provider_name}
                  </div>
                )}
                {item.category && (
                  <div className="text-xs text-gray-500 truncate">
                    in {item.category}
                  </div>
                )}
                {item.city && item.state && (
                  <div className="text-xs text-gray-500 truncate">
                    {item.city}, {item.state}
                  </div>
                )}
              </div>
              {item.verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
              {item.claimed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Claimed
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const hasResults = allSuggestions.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {isOpen && (query.length >= 2) && (
        <div 
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
          role="listbox"
        >
          {isLoading ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : hasResults ? (
            <>
              {renderSuggestionSection('Providers', suggestions.providers, 'providers')}
              {renderSuggestionSection('Services', suggestions.services, 'services')}
              {renderSuggestionSection('Categories', suggestions.categories, 'categories')}
              {renderSuggestionSection('Locations', suggestions.locations, 'locations')}
            </>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No suggestions found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;