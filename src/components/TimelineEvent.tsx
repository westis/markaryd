import Link from 'next/link';
import type { EventDetailed, GedcomEventType } from '@/types/person';
import { getFullName, formatDate, getEventTypeName } from '@/types/person';

interface TimelineEventProps {
  event: EventDetailed;
  showLocation?: boolean;
}

// Event type icons mapped to GEDCOM codes
const eventTypeIcons: { [key in GedcomEventType]?: JSX.Element } = {
  BIRT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  DEAT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  MARR: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  CHR: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  BAPM: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  BURI: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  RESI: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  EMIG: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  IMMI: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
};

// Event type colors mapped to GEDCOM codes
const eventTypeColors: { [key in GedcomEventType]?: string } = {
  BIRT: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800',
  DEAT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700',
  MARR: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100 border-pink-200 dark:border-pink-800',
  CHR: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800',
  BAPM: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800',
  BURI: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-800',
  RESI: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-800',
  EMIG: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 border-orange-200 dark:border-orange-800',
  IMMI: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100 border-cyan-200 dark:border-cyan-800',
  CONF: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 border-indigo-200 dark:border-indigo-800',
};

export default function TimelineEvent({ event, showLocation = false }: TimelineEventProps) {
  const personName = event.person ? getFullName(event.person) : 'Okänd person';
  const eventTypeName = getEventTypeName(event.event_type);
  const eventIcon = eventTypeIcons[event.event_type];
  const eventColor = eventTypeColors[event.event_type] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
  const dateDisplay = event.event_date_text ? formatDate(event.event_date_text) : (event.event_date ? formatDate(event.event_date) : 'Okänt datum');

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${eventColor}`}>
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {eventIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Event type and date */}
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm">
            {eventTypeName}
          </h4>
          <span className="text-xs opacity-75 historical-date">
            {dateDisplay}
          </span>
        </div>

        {/* Person */}
        {event.person && (
          <Link
            href={`/personer/${event.person.id}`}
            className="text-base font-medium hover:underline block mb-1"
          >
            {personName}
          </Link>
        )}

        {/* Location (if shown) */}
        {showLocation && event.location && (
          <div className="flex items-center text-sm opacity-90 mt-1">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <Link
              href={`/platser/${event.location.id}`}
              className="hover:underline"
            >
              {event.location.name}
            </Link>
          </div>
        )}

        {/* Person details */}
        {event.person && (
          <div className="flex items-center gap-4 text-xs opacity-75 mt-2">
            {event.person.gender && (
              <span>
                {event.person.gender === 'M' ? 'Man' : 'Kvinna'}
              </span>
            )}
            {event.person.occupations?.title && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {event.person.occupations.title}
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <p className="text-sm opacity-75 mt-2 italic">
            {event.notes}
          </p>
        )}

        {/* Confidence level indicator */}
        {event.confidence_level !== 'confirmed' && (
          <div className="text-xs opacity-60 mt-2">
            {event.confidence_level === 'inferred' && '(Härlett från data)'}
            {event.confidence_level === 'estimated' && '(Uppskattat)'}
            {event.confidence_level === 'unknown' && '(Osäkert)'}
          </div>
        )}
      </div>
    </div>
  );
}
