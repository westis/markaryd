'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PersonCard from '@/components/PersonCard';
import LocationPersonTable from '@/components/LocationPersonTable';
import type { Location, PersonDetailed } from '@/types/person';

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [location, setLocation] = useState<Location | null>(null);
  const [persons, setPersons] = useState<PersonDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'birth' | 'residence' | 'death'>('all');

  useEffect(() => {
    if (id) {
      fetchLocation();
    }
  }, [id]);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/locations/${id}`);
      if (!response.ok) {
        router.push('/platser');
        return;
      }
      const data = await response.json();
      setLocation(data.location);
      setPersons(data.persons);
    } catch (error) {
      console.error('Error fetching location:', error);
      router.push('/platser');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058a3] dark:border-blue-500"></div>
      </div>
    );
  }

  if (!location) {
    return null;
  }

  // Group persons by their connection to the location
  const bornHere = persons.filter(p => p.birth_location_id === location.id);
  const livedHere = persons.filter(p => p.residence_location_id === location.id);
  const diedHere = persons.filter(p => p.death_location_id === location.id);

  // Filter persons based on connection filter
  const getFilteredPersons = () => {
    if (connectionFilter === 'all') return persons;
    if (connectionFilter === 'birth') return bornHere;
    if (connectionFilter === 'residence') return livedHere;
    if (connectionFilter === 'death') return diedHere;
    return persons;
  };

  const filteredPersons = getFilteredPersons();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/platser"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-[#0058a3] dark:hover:text-blue-400 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tillbaka till Platser
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#0058a3] to-blue-600 dark:from-blue-700 dark:to-blue-800 text-white p-6">
            <div className="flex items-center mb-2">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h1 className="text-3xl font-bold">{location.name}</h1>
            </div>
            <p className="text-blue-100 dark:text-blue-200">
              {persons.length} {persons.length === 1 ? 'person' : 'personer'} registrerade
            </p>
          </div>

          <div className="p-6">
            {/* Connection Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setConnectionFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  connectionFilter === 'all'
                    ? 'bg-[#0058a3] dark:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Alla ({persons.length})
              </button>
              <button
                onClick={() => setConnectionFilter('birth')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  connectionFilter === 'birth'
                    ? 'bg-[#0058a3] dark:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Födda ({bornHere.length})
              </button>
              <button
                onClick={() => setConnectionFilter('residence')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  connectionFilter === 'residence'
                    ? 'bg-[#0058a3] dark:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Bodde ({livedHere.length})
              </button>
              <button
                onClick={() => setConnectionFilter('death')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  connectionFilter === 'death'
                    ? 'bg-[#0058a3] dark:bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Döda ({diedHere.length})
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end">
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
          </div>
        </div>

        {/* Persons Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Personer kopplade till {location.name}
            {connectionFilter !== 'all' && ` (${
              connectionFilter === 'birth' ? 'Födda' :
              connectionFilter === 'residence' ? 'Bodde' :
              'Döda'
            })`}
          </h2>

          {filteredPersons.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPersons.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            ) : (
              <LocationPersonTable
                persons={persons}
                locationId={location.id}
                connectionFilter={connectionFilter}
              />
            )
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Inga personer hittades med dessa filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
