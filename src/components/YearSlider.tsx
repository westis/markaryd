'use client';

import { useState, useEffect } from 'react';
import PersonCard from './PersonCard';
import type { Person } from '@/types/person';

interface YearSliderProps {
  locationId: number;
}

export default function YearSlider({ locationId }: YearSliderProps) {
  const [year, setYear] = useState(1850);
  const [residents, setResidents] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minYear, setMinYear] = useState(1600);
  const [maxYear, setMaxYear] = useState(1950);

  // Fetch residents for the selected year
  const fetchResidents = async (selectedYear: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/locations/${locationId}/residents?year=${selectedYear}`);

      if (!response.ok) {
        throw new Error('Failed to fetch residents');
      }

      const data = await response.json();
      setResidents(data.residents || []);
    } catch (err) {
      console.error('Error fetching residents:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data and determine year range
  useEffect(() => {
    // Fetch events to determine min/max years
    const fetchYearRange = async () => {
      try {
        const response = await fetch(`/api/locations/${locationId}/timeline?limit=1000`);
        if (response.ok) {
          const data = await response.json();
          if (data.events && data.events.length > 0) {
            const years = data.events
              .map((e: any) => e.event_date ? new Date(e.event_date).getFullYear() : null)
              .filter((y: number | null) => y !== null);

            if (years.length > 0) {
              const min = Math.min(...years);
              const max = Math.max(...years);
              setMinYear(min);
              setMaxYear(max);
              // Set initial year to middle of range
              setYear(Math.floor((min + max) / 2));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching year range:', err);
      }
    };

    fetchYearRange();
  }, [locationId]);

  // Fetch residents when year changes
  useEffect(() => {
    fetchResidents(year);
  }, [year, locationId]);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const handlePreviousYear = () => {
    if (year > minYear) {
      setYear(year - 1);
    }
  };

  const handleNextYear = () => {
    if (year < maxYear) {
      setYear(year + 1);
    }
  };

  const handlePreviousDecade = () => {
    setYear(Math.max(minYear, year - 10));
  };

  const handleNextDecade = () => {
    setYear(Math.min(maxYear, year + 10));
  };

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        {/* Year Display */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Visa boende under året
          </div>
          <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 historical-date mb-2">
            {year}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {residents.length} person{residents.length !== 1 ? 'er' : ''} boende
          </div>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#0058a3] dark:accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2">
            <span className="historical-date">{minYear}</span>
            <span className="historical-date">{maxYear}</span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-2">
          {/* Previous Decade */}
          <button
            onClick={handlePreviousDecade}
            disabled={year <= minYear}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#0058a3] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Föregående decennium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Previous Year */}
          <button
            onClick={handlePreviousYear}
            disabled={year <= minYear}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#0058a3] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Föregående år"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Year Input */}
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => {
              const newYear = parseInt(e.target.value);
              if (newYear >= minYear && newYear <= maxYear) {
                handleYearChange(newYear);
              }
            }}
            className="w-24 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500 focus:border-transparent"
          />

          {/* Next Year */}
          <button
            onClick={handleNextYear}
            disabled={year >= maxYear}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#0058a3] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Nästa år"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Next Decade */}
          <button
            onClick={handleNextDecade}
            disabled={year >= maxYear}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#0058a3] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Nästa decennium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Residents List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-[#0058a3] dark:text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Laddar boende...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              <strong>Fel:</strong> {error}
            </p>
          </div>
        ) : residents.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              Inga boende hittades för år {year}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Prova att välja ett annat år
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {residents.map(resident => (
              <PersonCard key={resident.id} person={resident} showDetails={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
