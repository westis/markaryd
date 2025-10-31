'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PersonCard from '@/components/PersonCard';
import type { PersonDetailed, PaginatedResponse } from '@/types/person';

function SearchContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [persons, setPersons] = useState<PersonDetailed[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      performSearch(queryParam, 1);
    }
  }, [queryParam]);

  const performSearch = async (searchQuery: string, page: number = 1, sort?: string, order?: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setPersons([]);
      return;
    }

    setLoading(true);
    try {
      const sortByParam = sort || sortBy;
      const sortOrderParam = order || sortOrder;

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=20&sortBy=${sortByParam}&sortOrder=${sortOrderParam}`
      );
      const data: PaginatedResponse<PersonDetailed> = await response.json();

      setPersons(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
    performSearch(query, 1, column, newOrder);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.pushState({}, '', url);
      performSearch(query, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    performSearch(query, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Sök
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sök efter personer i Markaryds församlings register
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök efter namn, plats, yrke..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-[#0058a3] dark:bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
              >
                Sök
              </button>
            </div>
          </form>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Tips för bättre sökning:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Använd minst 2 tecken för att söka</li>
              <li>Sök efter förnamn, patronymikon eller efternamn</li>
              <li>Sök efter platsnamn som Agghult, Berg eller Boda</li>
              <li>Sök efter yrken som soldat, piga eller kyrkoherde</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058a3] dark:border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Söker...</p>
          </div>
        ) : query && query.length >= 2 ? (
          persons.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Hittade {pagination.total} {pagination.total === 1 ? 'person' : 'personer'} för &quot;{query}&quot;
                </h2>
              </div>

              {/* Table View */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Namn</span>
                            {sortBy === 'name' && (
                              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('gender')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Kön</span>
                            {sortBy === 'gender' && (
                              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('birth_date')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Född</span>
                            {sortBy === 'birth_date' && (
                              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('death_date')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Död</span>
                            {sortBy === 'death_date' && (
                              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('occupation')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Yrke</span>
                            {sortBy === 'occupation' && (
                              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('location')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Boendeort</span>
                            {sortBy === 'location' && (
                              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {persons.map((person) => {
                        const fullName = [
                          person.first_name,
                          person.patronymic,
                          person.surname,
                        ].filter(Boolean).join(' ');

                        return (
                          <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => window.location.href = `/personer/${person.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[#0058a3] dark:text-blue-400 hover:underline">
                                {fullName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {person.gender === 'M' ? 'Man' : person.gender === 'K' ? 'Kvinna' : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {person.birth_date_text || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {person.death_date_text || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {person.occupation_title || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {person.residence_location_name || '-'}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Föregående
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 border rounded-md text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'bg-[#0058a3] dark:bg-blue-600 text-white border-[#0058a3] dark:border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Nästa
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Inga resultat hittades för &quot;{query}&quot;
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Försök med andra sökord eller stavning
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Skriv in minst 2 tecken för att börja söka
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SokPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058a3]"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
