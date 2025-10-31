import Link from 'next/link';
import type { PersonDetailed } from '@/types/person';
import { getFullName, getLifeSpan } from '@/types/person';

interface PersonCardProps {
  person: PersonDetailed;
  showDetails?: boolean;
}

export default function PersonCard({ person, showDetails = true }: PersonCardProps) {
  const fullName = getFullName(person);
  const lifeSpan = getLifeSpan(person);

  return (
    <Link
      href={`/personer/${person.id}`}
      className="block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-[#0058a3] dark:hover:border-blue-500 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Name */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {fullName}
          </h3>

          {/* Life Span */}
          {lifeSpan && (
            <p className="text-sm text-gray-600 dark:text-gray-400 historical-date mb-2">
              {lifeSpan}
            </p>
          )}

          {showDetails && (
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {/* Occupation */}
              {person.occupation_title && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {person.occupation_title}
                </div>
              )}

              {/* Location */}
              {person.residence_location_name && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {person.residence_location_name}
                </div>
              )}

              {/* Gender & Marital Status */}
              <div className="flex items-center space-x-4">
                {person.gender && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {person.gender === 'M' ? 'Man' : 'Kvinna'}
                  </span>
                )}
                {person.marital_status && (
                  <span className="text-gray-500 dark:text-gray-500">
                    {person.marital_status}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Arrow icon */}
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
