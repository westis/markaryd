'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/types/person';
import { getFullName, getLifeSpan } from '@/types/person';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        setResults(data.data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/sok?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  const handleSelectPerson = (personId: number) => {
    router.push(`/personer/${personId}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder="Sök efter namn, plats, yrke..."
            className="w-full px-4 py-3 pr-12 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 dark:text-gray-500 hover:text-[#0058a3] dark:hover:text-blue-400"
            aria-label="Sök"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Dropdown Results */}
      {showResults && (
        <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Söker...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((person) => (
                <button
                  key={person.id}
                  onClick={() => handleSelectPerson(person.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {getFullName(person)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getLifeSpan(person)}
                    {person.residence_location_name && (
                      <span className="ml-2">• {person.residence_location_name}</span>
                    )}
                    {person.occupation_title && (
                      <span className="ml-2">• {person.occupation_title}</span>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  router.push(`/sok?q=${encodeURIComponent(query)}`);
                  setShowResults(false);
                }}
                className="w-full px-4 py-3 text-center text-sm text-[#0058a3] dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Visa alla resultat för &quot;{query}&quot;
              </button>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Inga resultat hittades för &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
