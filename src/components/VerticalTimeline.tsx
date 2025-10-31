'use client';

import { useState, useEffect } from 'react';
import TimelineEvent from './TimelineEvent';
import DateRangeFilter from './DateRangeFilter';
import type { EventDetailed } from '@/types/person';

interface VerticalTimelineProps {
  locationId: number;
}

export default function VerticalTimeline({ locationId }: VerticalTimelineProps) {
  const [events, setEvents] = useState<EventDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Event type options for filtering (GEDCOM codes)
  const eventTypeOptions = [
    { value: 'BIRT', label: 'Födelse' },
    { value: 'DEAT', label: 'Död' },
    { value: 'MARR', label: 'Vigsel' },
    { value: 'CHR', label: 'Kristning' },
    { value: 'BAPM', label: 'Dop (LDS)' },
    { value: 'BURI', label: 'Begravning' },
    { value: 'RESI', label: 'Bosättning' },
    { value: 'EMIG', label: 'Emigration' },
    { value: 'IMMI', label: 'Immigration' },
    { value: 'CONF', label: 'Konfirmation' },
    { value: 'CENS', label: 'Folkräkning' },
  ];

  // Fetch events
  const fetchEvents = async (newOffset = 0, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString(),
      });

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedEventTypes.length > 0) {
        params.append('event_types', selectedEventTypes.join(','));
      }

      const response = await fetch(`/api/locations/${locationId}/timeline?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch timeline events');
      }

      const data = await response.json();

      if (append) {
        setEvents(prev => [...prev, ...(data.events || [])]);
      } else {
        setEvents(data.events || []);
      }

      setHasMore(data.pagination?.hasMore || false);
      setOffset(newOffset);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchEvents(0, false);
  }, [locationId, startDate, endDate, selectedEventTypes]);

  // Load more events
  const handleLoadMore = () => {
    fetchEvents(offset + limit, true);
  };

  // Handle date filter change
  const handleDateFilterChange = (newStartDate: string | null, newEndDate: string | null) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Handle event type filter toggle
  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => {
      if (prev.includes(eventType)) {
        return prev.filter(t => t !== eventType);
      } else {
        return [...prev, eventType];
      }
    });
  };

  // Group events by year for better organization
  const eventsByYear: { [year: string]: EventDetailed[] } = {};
  events.forEach(event => {
    if (event.event_date) {
      const year = new Date(event.event_date).getFullYear().toString();
      if (!eventsByYear[year]) {
        eventsByYear[year] = [];
      }
      eventsByYear[year].push(event);
    } else {
      // Events without dates go in "Okänt år"
      if (!eventsByYear['Okänt år']) {
        eventsByYear['Okänt år'] = [];
      }
      eventsByYear['Okänt år'].push(event);
    }
  });

  const years = Object.keys(eventsByYear).sort((a, b) => {
    if (a === 'Okänt år') return 1;
    if (b === 'Okänt år') return -1;
    return parseInt(a) - parseInt(b);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        {/* Date Range Filter */}
        <DateRangeFilter
          onFilterChange={handleDateFilterChange}
          initialStartDate={startDate || ''}
          initialEndDate={endDate || ''}
        />

        {/* Event Type Filter */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Händelsetyper
            </h3>
          </div>

          <div className="space-y-2">
            {eventTypeOptions.map(option => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEventTypes.includes(option.value)}
                  onChange={() => handleEventTypeToggle(option.value)}
                  className="w-4 h-4 text-[#0058a3] dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-[#0058a3] dark:focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          {selectedEventTypes.length > 0 && (
            <button
              onClick={() => setSelectedEventTypes([])}
              className="mt-3 text-sm text-[#0058a3] dark:text-blue-400 hover:underline"
            >
              Rensa alla
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 dark:text-gray-400 px-2">
          {events.length} händelse{events.length !== 1 ? 'r' : ''}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="lg:col-span-3">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-[#0058a3] dark:text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Laddar tidslinje...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              <strong>Fel:</strong> {error}
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              Inga händelser hittades
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Prova att ändra dina filterinställningar
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Events grouped by year */}
            {years.map(year => (
              <div key={year}>
                {/* Year header */}
                <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-900 border-b-2 border-[#0058a3] dark:border-blue-500 px-4 py-2 mb-4 rounded-t-lg">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 historical-date">
                    {year}
                  </h3>
                </div>

                {/* Events for this year */}
                <div className="space-y-3">
                  {eventsByYear[year].map(event => (
                    <TimelineEvent key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-[#0058a3] dark:bg-blue-600 text-white rounded-lg hover:bg-[#004080] dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Laddar...' : 'Ladda fler händelser'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
