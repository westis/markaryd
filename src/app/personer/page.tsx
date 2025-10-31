'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PersonCard from '@/components/PersonCard';
import PersonTable, { type TableFilters, type SortField, type SortDirection } from '@/components/PersonTable';
import type { PersonDetailed, PaginatedResponse } from '@/types/person';

export default function PersonerPage() {
  const [persons, setPersons] = useState<PersonDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Global filters (from filter panel)
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Table-specific filters
  const [tableFilters, setTableFilters] = useState<TableFilters>({
    firstName: '',
    surname: '',
    birthYearFrom: '',
    birthYearTo: '',
    deathYearFrom: '',
    deathYearTo: '',
    occupation: '',
    location: '',
    gender: '',
    maritalStatus: '',
  });

  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchPersons();
  }, [currentPage, filters, tableFilters, viewMode]);

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        // Global filters (only used in card view)
        ...(viewMode === 'cards' && {
          search: filters.search,
          gender: filters.gender,
        }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        // Table-specific filters (only used in table view)
        ...(viewMode === 'table' && {
          filterFirstName: tableFilters.firstName,
          filterSurname: tableFilters.surname,
          filterBirthYearFrom: tableFilters.birthYearFrom,
          filterBirthYearTo: tableFilters.birthYearTo,
          filterDeathYearFrom: tableFilters.deathYearFrom,
          filterDeathYearTo: tableFilters.deathYearTo,
          filterOccupation: tableFilters.occupation,
          filterLocation: tableFilters.location,
          filterGender: tableFilters.gender,
          filterMaritalStatus: tableFilters.maritalStatus,
        }),
      });

      const response = await fetch(`/api/persons?${params}`);
      const data: PaginatedResponse<PersonDetailed> = await response.json();

      setPersons(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  // Handle table filter changes with debouncing
  const handleTableFilterChange = useCallback((newFilters: TableFilters) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setTableFilters(newFilters);
      setCurrentPage(1); // Reset to first page
    }, 300); // 300ms debounce
  }, []);

  // Handle table sort changes
  const handleTableSortChange = useCallback((sortField: SortField, sortDirection: SortDirection) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortField,
      sortOrder: sortDirection,
    }));
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Personer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {pagination?.total > 0 ? `Bläddra bland alla ${pagination.total.toLocaleString('sv-SE')} registrerade personer från Markaryd församling` : 'Bläddra bland alla registrerade personer från Markaryd församling'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sök
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Namn..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kön
              </label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500"
              >
                <option value="">Alla</option>
                <option value="M">Man</option>
                <option value="K">Kvinna</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sortera efter
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500"
              >
                <option value="name">Namn</option>
                <option value="birth_date">Födelseår</option>
                <option value="death_date">Dödsår</option>
                <option value="location">Plats</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordning
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500"
              >
                <option value="asc">Stigande</option>
                <option value="desc">Fallande</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#0058a3] dark:bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Kort
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#0058a3] dark:bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Tabell
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058a3] dark:border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar personer...</p>
          </div>
        ) : persons?.length > 0 ? (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {persons.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            ) : (
              <div className="mb-8">
                <PersonTable
                  persons={persons}
                  filters={tableFilters}
                  onFilterChange={handleTableFilterChange}
                  onSortChange={handleTableSortChange}
                />
              </div>
            )}

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

            <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
              Visar {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} av {pagination.total} personer
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Inga personer hittades med dessa filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
