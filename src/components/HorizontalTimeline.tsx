'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFullName } from '@/types/person';
import type { EventDetailed } from '@/types/person';

interface HorizontalTimelineProps {
  locationId: number;
}

interface PersonLifespan {
  id: number;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  gender: 'M' | 'K' | null;
  occupation: string | null;
}

export default function HorizontalTimeline({ locationId }: HorizontalTimelineProps) {
  const [lifespans, setLifespans] = useState<PersonLifespan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minYear, setMinYear] = useState(1600);
  const [maxYear, setMaxYear] = useState(1950);
  const [hoveredPerson, setHoveredPerson] = useState<number | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [locationId]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all events to build lifespans
      const response = await fetch(`/api/locations/${locationId}/timeline?limit=1000`);

      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }

      const data = await response.json();
      const events: EventDetailed[] = data.events || [];

      // Group events by person
      const personEventsMap = new Map<number, EventDetailed[]>();
      events.forEach(event => {
        if (event.person) {
          if (!personEventsMap.has(event.person.id)) {
            personEventsMap.set(event.person.id, []);
          }
          personEventsMap.get(event.person.id)!.push(event);
        }
      });

      // Build lifespans
      const personLifespans: PersonLifespan[] = [];
      let allMinYear = Infinity;
      let allMaxYear = -Infinity;

      personEventsMap.forEach((personEvents, personId) => {
        const person = personEvents[0].person;
        if (!person) return;

        // Find birth and death years (GEDCOM event types)
        const birthEvent = personEvents.find(e => e.event_type === 'BIRT');
        const deathEvent = personEvents.find(e => e.event_type === 'DEAT');

        const birthYear = birthEvent?.event_date ? new Date(birthEvent.event_date).getFullYear() :
                         (person.birth_date ? new Date(person.birth_date).getFullYear() : null);
        const deathYear = deathEvent?.event_date ? new Date(deathEvent.event_date).getFullYear() :
                         (person.death_date ? new Date(person.death_date).getFullYear() : null);

        // Only include if we have at least one year
        if (birthYear || deathYear) {
          personLifespans.push({
            id: person.id,
            name: getFullName(person),
            birthYear,
            deathYear,
            gender: person.gender,
            occupation: person.occupations?.title || null,
          });

          // Track min/max years
          if (birthYear && birthYear < allMinYear) allMinYear = birthYear;
          if (deathYear && deathYear > allMaxYear) allMaxYear = deathYear;
          if (birthYear && birthYear > allMaxYear) allMaxYear = birthYear;
          if (deathYear && deathYear < allMinYear) allMinYear = deathYear;
        }
      });

      // Sort by birth year
      personLifespans.sort((a, b) => {
        const yearA = a.birthYear || a.deathYear || 0;
        const yearB = b.birthYear || b.deathYear || 0;
        return yearA - yearB;
      });

      setLifespans(personLifespans);

      // Set year range with padding
      if (allMinYear !== Infinity && allMaxYear !== -Infinity) {
        setMinYear(Math.floor(allMinYear / 10) * 10);
        setMaxYear(Math.ceil(allMaxYear / 10) * 10);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Calculate position and width for a lifespan bar
  const getLifespanStyle = (lifespan: PersonLifespan) => {
    const startYear = lifespan.birthYear || minYear;
    const endYear = lifespan.deathYear || maxYear;
    const yearRange = maxYear - minYear;

    const left = ((startYear - minYear) / yearRange) * 100;
    const width = ((endYear - startYear) / yearRange) * 100;

    return {
      left: `${left}%`,
      width: `${Math.max(width, 0.5)}%`,
    };
  };

  // Generate decade markers
  const decades = [];
  for (let year = Math.floor(minYear / 10) * 10; year <= maxYear; year += 10) {
    decades.push(year);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-[#0058a3] dark:text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Laddar tidslinje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          <strong>Fel:</strong> {error}
        </p>
      </div>
    );
  }

  if (lifespans.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Inga livslinjer att visa
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Horisontell tidslinje:</strong> Varje stapel representerar en persons livstid. Håll muspekaren över en stapel för att se detaljer.
        </p>
      </div>

      {/* Timeline Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 overflow-x-auto">
        {/* Decade markers */}
        <div className="relative mb-6 h-8">
          {decades.map(decade => {
            const position = ((decade - minYear) / (maxYear - minYear)) * 100;
            return (
              <div
                key={decade}
                className="absolute top-0 transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-auto"></div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 historical-date whitespace-nowrap">
                  {decade}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lifespans */}
        <div className="space-y-2 min-h-96">
          {lifespans.map(lifespan => {
            const style = getLifespanStyle(lifespan);
            const isHovered = hoveredPerson === lifespan.id;
            const color = lifespan.gender === 'M'
              ? 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500'
              : lifespan.gender === 'K'
              ? 'bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500'
              : 'bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500';

            return (
              <div key={lifespan.id} className="relative h-8 group">
                <Link
                  href={`/personer/${lifespan.id}`}
                  className={`absolute h-6 rounded-full ${color} transition-all cursor-pointer ${isHovered ? 'h-8 z-10' : ''}`}
                  style={style}
                  onMouseEnter={() => setHoveredPerson(lifespan.id)}
                  onMouseLeave={() => setHoveredPerson(null)}
                  title={`${lifespan.name} (${lifespan.birthYear || '?'} – ${lifespan.deathYear || '?'})`}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg whitespace-nowrap z-20">
                      <div className="font-semibold">{lifespan.name}</div>
                      <div className="text-xs opacity-90">
                        {lifespan.birthYear || '?'} – {lifespan.deathYear || '?'}
                      </div>
                      {lifespan.occupation && (
                        <div className="text-xs opacity-75 mt-1">{lifespan.occupation}</div>
                      )}
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 rounded-full bg-blue-500 dark:bg-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Man</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 rounded-full bg-pink-500 dark:bg-pink-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Kvinna</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 rounded-full bg-gray-500 dark:bg-gray-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Okänt kön</span>
          </div>
          <div className="ml-auto text-gray-600 dark:text-gray-400">
            {lifespans.length} person{lifespans.length !== 1 ? 'er' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
