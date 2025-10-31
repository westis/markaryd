'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Location } from '@/types/person';

interface LocationWithCount extends Location {
  person_count: number;
}

export default function PlatserPage() {
  const [locations, setLocations] = useState<LocationWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/locations');
      const data = await response.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter locations by search term
  const filteredLocations = (locations || []).filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by first letter
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    const firstLetter = loc.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(loc);
    return acc;
  }, {} as Record<string, LocationWithCount[]>);

  const letters = Object.keys(groupedLocations).sort();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Platser
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Utforska historiska platser, byar och boendeadresser i Markaryds församling
          </p>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sök plats
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Skriv platsnamn..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058a3] dark:border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar platser...</p>
          </div>
        ) : filteredLocations.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Alphabet Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap gap-2">
                {letters.map(letter => (
                  <a
                    key={letter}
                    href={`#${letter}`}
                    className="px-3 py-1 text-sm font-medium text-[#0058a3] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {letter}
                  </a>
                ))}
              </div>
            </div>

            {/* Locations List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {letters.map(letter => (
                <div key={letter} id={letter} className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{letter}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedLocations[letter].map(location => (
                      <Link
                        key={location.id}
                        href={`/platser/${location.id}`}
                        className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#0058a3] dark:hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#0058a3] dark:group-hover:text-blue-400 transition-colors">
                              {location.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {location.person_count} {location.person_count === 1 ? 'person' : 'personer'}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-[#0058a3] dark:group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {searchTerm ? `Inga platser hittades för "${searchTerm}"` : 'Inga platser hittades'}
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-8 bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistik</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-[#0058a3] dark:text-blue-400">
                {locations?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totalt antal platser</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0058a3] dark:text-blue-400">
                {locations?.length > 0 ? Math.max(...locations.map(l => l.person_count), 0) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Flest personer per plats</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0058a3] dark:text-blue-400">
                {locations?.reduce((sum, l) => sum + l.person_count, 0) || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totalt antal personreferenser</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
