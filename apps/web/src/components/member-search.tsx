'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { trackEvent, normalizeQuery } from '@/lib/analytics';
import { buildMemberHref, DEFAULT_BENCHMARK_SCOPE, type BenchmarkScope } from '@/lib/benchmark-scope';

interface SearchResult {
  id: number;
  name: string;
  totalWorks: number;
}

interface MemberSearchProps {
  placeholder?: string;
  className?: string;
  scope?: BenchmarkScope;
}

export function MemberSearch({
  placeholder = 'Search publishers...',
  className,
  scope = DEFAULT_BENCHMARK_SCOPE,
}: MemberSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();
      const members: SearchResult[] = data.members || [];
      setResults(members);
      trackEvent('publisher_search', {
        query: normalizeQuery(searchQuery),
        results: members.length,
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (member: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(buildMemberHref(member.id, scope));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="publisher-search-results"
          className="h-14 w-full rounded-lg border border-brand-rule-2 bg-brand-paper py-3 pl-12 pr-12 text-brand-ink placeholder:text-brand-muted hover:bg-brand-mist focus:border-brand-ink focus:outline-brand-signal"
        />
        {isLoading && (
          <Loader2 aria-hidden="true" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-brand-signal" />
        )}
      </div>

      {isOpen && (results.length > 0 || query.length >= 2) && (
        <div id="publisher-search-results" className="absolute z-50 mt-2 w-full rounded-lg border border-brand-rule bg-brand-paper shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-80 overflow-auto py-2" role="listbox">
              {results.map((member) => (
                <li key={member.id}>
                  <button
                    onClick={() => handleSelect(member)}
                    role="option"
                    aria-selected="false"
                    className="flex min-h-14 w-full items-center justify-between px-4 py-3 text-left hover:bg-brand-mist focus-visible:bg-brand-mist"
                  >
                    <div>
                      <p className="whitespace-normal font-medium text-brand-ink">{member.name}</p>
                      <p className="whitespace-normal text-sm text-brand-muted">
                        ID: {member.id} &middot;{' '}
                        {member.totalWorks.toLocaleString()} works
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 && !isLoading ? (
            <p className="px-4 py-3 text-sm text-brand-muted">No publishers found</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
