'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PersonDetailed } from '@/types/person';
import { getFullName } from '@/types/person';

interface LocationPersonTableProps {
  persons: PersonDetailed[];
  locationId: number;
  connectionFilter: 'all' | 'birth' | 'residence' | 'death';
}

type SortField = 'name' | 'birth_date' | 'death_date' | 'gender' | 'occupation';
type SortDirection = 'asc' | 'desc';

export default function LocationPersonTable({ persons, locationId, connectionFilter }: LocationPersonTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [nameFilter, setNameFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedPersons = useMemo(() => {
    let filtered = [...persons];

    // Apply name filter
    if (nameFilter) {
      filtered = filtered.filter(person =>
        getFullName(person).toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Apply gender filter
    if (genderFilter) {
      filtered = filtered.filter(person => person.gender === genderFilter);
    }

    // Apply connection filter
    if (connectionFilter !== 'all') {
      filtered = filtered.filter(person => {
        if (connectionFilter === 'birth') return person.birth_location_id === locationId;
        if (connectionFilter === 'residence') return person.residence_location_id === locationId;
        if (connectionFilter === 'death') return person.death_location_id === locationId;
        return true;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = getFullName(a).toLowerCase();
          bValue = getFullName(b).toLowerCase();
          break;
        case 'birth_date':
          aValue = a.birth_date || '';
          bValue = b.birth_date || '';
          break;
        case 'death_date':
          aValue = a.death_date || '';
          bValue = b.death_date || '';
          break;
        case 'occupation':
          aValue = a.occupation_title?.toLowerCase() || '';
          bValue = b.occupation_title?.toLowerCase() || '';
          break;
        case 'gender':
          aValue = a.gender || '';
          bValue = b.gender || '';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [persons, locationId, connectionFilter, nameFilter, genderFilter, sortField, sortDirection]);

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

  // Helper to determine the relevant date to show based on connection filter
  const getRelevantDate = (person: PersonDetailed) => {
    if (connectionFilter === 'birth') {
      return person.birth_date_text || '-';
    } else if (connectionFilter === 'death') {
      return person.death_date_text || '-';
    } else if (connectionFilter === 'residence') {
      // For residence, we don't have specific dates in the schema yet
      // Could show birth-death as the period they could have lived there
      if (person.birth_date_text && person.death_date_text) {
        return `${person.birth_date_text} – ${person.death_date_text}`;
      } else if (person.birth_date_text) {
        return `från ${person.birth_date_text}`;
      } else if (person.death_date_text) {
        return `till ${person.death_date_text}`;
      }
      return '-';
    }
    return '-';
  };

  // Get column header for relevant date
  const getDateColumnHeader = () => {
    if (connectionFilter === 'birth') return 'Födelsedatum';
    if (connectionFilter === 'death') return 'Dödsdatum';
    if (connectionFilter === 'residence') return 'Period';
    return 'Koppling';
  };

  // Helper to get connection type(s) for a person
  const getConnectionType = (person: PersonDetailed) => {
    const connections: string[] = [];
    if (person.birth_location_id === locationId) connections.push('Född');
    if (person.residence_location_id === locationId) connections.push('Bodde');
    if (person.death_location_id === locationId) connections.push('Död');
    return connections.join(', ') || '-';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '1000px' }}>
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
                  placeholder="Filtrera..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
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
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#0058a3] dark:focus:ring-blue-500"
                >
                  <option value="">Alla</option>
                  <option value="M">Man</option>
                  <option value="K">Kvinna</option>
                </select>
              </th>

              {/* Relevant Date/Period Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '180px' }}>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {getDateColumnHeader()}
                </div>
              </th>

              {/* Birth Date Column (if not specifically filtered by birth) */}
              {connectionFilter !== 'birth' && (
                <th className="px-6 py-3 text-left" style={{ minWidth: '120px' }}>
                  <button
                    onClick={() => handleSort('birth_date')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                  >
                    <span>Född</span>
                    <SortIcon field="birth_date" />
                  </button>
                </th>
              )}

              {/* Death Date Column (if not specifically filtered by death) */}
              {connectionFilter !== 'death' && (
                <th className="px-6 py-3 text-left" style={{ minWidth: '120px' }}>
                  <button
                    onClick={() => handleSort('death_date')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                  >
                    <span>Död</span>
                    <SortIcon field="death_date" />
                  </button>
                </th>
              )}

              {/* Occupation Column */}
              <th className="px-6 py-3 text-left" style={{ minWidth: '180px' }}>
                <button
                  onClick={() => handleSort('occupation')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-[#0058a3] dark:hover:text-blue-500"
                >
                  <span>Yrke</span>
                  <SortIcon field="occupation" />
                </button>
              </th>

              {/* Connection Type (only for 'all' filter) */}
              {connectionFilter === 'all' && (
                <th className="px-6 py-3 text-left" style={{ minWidth: '150px' }}>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Koppling
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedPersons.map((person) => (
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
                  {person.gender === 'M' ? 'Man' : person.gender === 'K' ? 'Kvinna' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0058a3] dark:text-blue-400">
                  {getRelevantDate(person)}
                </td>
                {connectionFilter !== 'birth' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {person.birth_date_text || '-'}
                  </td>
                )}
                {connectionFilter !== 'death' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {person.death_date_text || '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {person.occupation_title || '-'}
                </td>
                {connectionFilter === 'all' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {getConnectionType(person)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedPersons.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Inga personer matchar filtren
        </div>
      )}

      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
        Visar {filteredAndSortedPersons.length} av {persons.length} personer
      </div>
    </div>
  );
}
