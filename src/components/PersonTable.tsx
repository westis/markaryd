'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PersonDetailed } from '@/types/person';
import { getFullName } from '@/types/person';

interface PersonTableProps {
  persons: PersonDetailed[];
  filters?: TableFilters;
  onFilterChange?: (filters: TableFilters) => void;
  onSortChange?: (sortField: SortField, sortDirection: SortDirection) => void;
}

export interface TableFilters {
  firstName: string;
  surname: string;
  birthYearFrom: string;
  birthYearTo: string;
  deathYearFrom: string;
  deathYearTo: string;
  occupation: string;
  location: string;
  gender: string;
  maritalStatus: string;
}

export type SortField = 'name' | 'birth_date' | 'death_date' | 'occupation' | 'location' | 'gender' | 'marital_status';
export type SortDirection = 'asc' | 'desc';

export default function PersonTable({ persons, filters: externalFilters, onFilterChange, onSortChange }: PersonTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Local state for year inputs to allow typing without immediate filtering
  const [localYearFilters, setLocalYearFilters] = useState({
    birthYearFrom: '',
    birthYearTo: '',
    deathYearFrom: '',
    deathYearTo: '',
  });

  // Use external filters if provided, otherwise use local state
  const filters = externalFilters || {
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
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSortChange?.(field, newDirection);
  };

  // Handle year filter change with 4-digit validation
  const handleYearFilterChange = (key: 'birthYearFrom' | 'birthYearTo' | 'deathYearFrom' | 'deathYearTo', value: string) => {
    // Update local state immediately for visual feedback
    setLocalYearFilters(prev => ({ ...prev, [key]: value }));

    // Only notify parent when empty or 4 digits
    if (value === '' || value.length === 4) {
      const newFilters = { ...filters, [key]: value };
      onFilterChange?.(newFilters);
    }
  };

  // Handle filter change for non-year fields
  const handleFilterChange = (key: keyof TableFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    // Call parent callback (parent implements debouncing)
    onFilterChange?.(newFilters);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[#0058a3] dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#0058a3] dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '1200px' }}>
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              {/* Name Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '200px' }}>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Namn</span>
                  <SortIcon field="name" />
                </button>
                <input
                  type="text"
                  placeholder="Filtrera förnamn..."
                  value={filters.firstName}
                  onChange={(e) => handleFilterChange('firstName', e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Filtrera efternamn..."
                  value={filters.surname}
                  onChange={(e) => handleFilterChange('surname', e.target.value)}
                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
              </th>

              {/* Birth Date Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '150px' }}>
                <button
                  onClick={() => handleSort('birth_date')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Född</span>
                  <SortIcon field="birth_date" />
                </button>
                <div className="mt-2 flex flex-col gap-1">
                  <input
                    type="number"
                    placeholder="Från år"
                    value={localYearFilters.birthYearFrom}
                    onChange={(e) => handleYearFilterChange('birthYearFrom', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                    min="1600"
                    max="2100"
                  />
                  <input
                    type="number"
                    placeholder="Till år"
                    value={localYearFilters.birthYearTo}
                    onChange={(e) => handleYearFilterChange('birthYearTo', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                    min="1600"
                    max="2100"
                  />
                </div>
              </th>

              {/* Death Date Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '150px' }}>
                <button
                  onClick={() => handleSort('death_date')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Död</span>
                  <SortIcon field="death_date" />
                </button>
                <div className="mt-2 flex flex-col gap-1">
                  <input
                    type="number"
                    placeholder="Från år"
                    value={localYearFilters.deathYearFrom}
                    onChange={(e) => handleYearFilterChange('deathYearFrom', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                    min="1600"
                    max="2100"
                  />
                  <input
                    type="number"
                    placeholder="Till år"
                    value={localYearFilters.deathYearTo}
                    onChange={(e) => handleYearFilterChange('deathYearTo', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                    min="1600"
                    max="2100"
                  />
                </div>
              </th>

              {/* Gender Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '120px' }}>
                <button
                  onClick={() => handleSort('gender')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Kön</span>
                  <SortIcon field="gender" />
                </button>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                >
                  <option value="">Alla</option>
                  <option value="M">Man</option>
                  <option value="K">Kvinna</option>
                </select>
              </th>

              {/* Occupation Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '180px' }}>
                <button
                  onClick={() => handleSort('occupation')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Yrke</span>
                  <SortIcon field="occupation" />
                </button>
                <input
                  type="text"
                  placeholder="Filtrera..."
                  value={filters.occupation}
                  onChange={(e) => handleFilterChange('occupation', e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
              </th>

              {/* Location Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '180px' }}>
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Plats</span>
                  <SortIcon field="location" />
                </button>
                <input
                  type="text"
                  placeholder="Filtrera..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
              </th>

              {/* Marital Status Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '150px' }}>
                <button
                  onClick={() => handleSort('marital_status')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Civilstånd</span>
                  <SortIcon field="marital_status" />
                </button>
                <input
                  type="text"
                  placeholder="Filtrera..."
                  value={filters.maritalStatus}
                  onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {persons.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/personer/${person.id}`}
                    className="text-sm font-medium text-[#0058a3] dark:text-blue-400 hover:underline"
                  >
                    {getFullName(person)}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.birth_date_text || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.death_date_text || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.gender === 'M' ? 'Man' : person.gender === 'K' ? 'Kvinna' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.occupation_title || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.residence_location_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.marital_status || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {persons.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Inga personer matchar filtren
        </div>
      )}
    </div>
  );
}
