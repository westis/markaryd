import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { PersonDetailed } from '@/types/person';
import { getFullName, formatDate, formatAgeAtDeath } from '@/types/person';

async function getPerson(id: string): Promise<PersonDetailed | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/persons/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching person:', error);
    return null;
  }
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPerson(id);

  if (!person) {
    notFound();
  }

  const fullName = getFullName(person);
  const ageAtDeath = formatAgeAtDeath(person);

  // Group relationships by type
  const fathers = person.relationships?.filter(r => r.relationship_type === 'father') || [];
  const mothers = person.relationships?.filter(r => r.relationship_type === 'mother') || [];
  const spouses = person.relationships?.filter(r => r.relationship_type === 'spouse') || [];
  const children = person.relationships?.filter(r => r.relationship_type === 'child') || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/personer"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-[#0058a3] dark:hover:text-blue-400 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tillbaka till Personer
        </Link>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0058a3] to-blue-600 dark:from-blue-700 dark:to-blue-800 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
            <div className="flex items-center space-x-4 text-blue-100 dark:text-blue-200">
              {person.birth_date_text && (
                <span>Född: {formatDate(person.birth_date_text)}</span>
              )}
              {person.death_date_text && (
                <span>Död: {formatDate(person.death_date_text)}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Personal Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personuppgifter
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.gender && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kön</dt>
                    <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                      {person.gender === 'M' ? 'Man' : 'Kvinna'}
                    </dd>
                  </div>
                )}
                {person.marital_status && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Civilstånd</dt>
                    <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{person.marital_status}</dd>
                  </div>
                )}
                {person.occupation_title && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Yrke/Titel</dt>
                    <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{person.occupation_title}</dd>
                  </div>
                )}
                {ageAtDeath && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ålder vid döden</dt>
                    <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{ageAtDeath}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Life Events Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Livshändelser
              </h2>

              <div className="space-y-6">
                {/* Birth Event */}
                {(person.birth_date_text || person.birth_location_name || person.birth_parish) && (
                  <div className="border-l-4 border-green-500 dark:border-green-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Födelse</h3>
                    <dl className="space-y-2">
                      {person.birth_date_text && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Datum</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{formatDate(person.birth_date_text)}</dd>
                        </div>
                      )}
                      {person.birth_location_name && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plats</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                            {person.birth_location_id ? (
                              <Link href={`/platser/${person.birth_location_id}`} className="text-[#0058a3] dark:text-blue-400 hover:underline">
                                {person.birth_location_name}
                              </Link>
                            ) : (
                              person.birth_location_name
                            )}
                            {person.birth_parish && <span className="text-gray-600 dark:text-gray-400"> ({person.birth_parish})</span>}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Residence Event */}
                {person.residence_location_name && (
                  <div className="border-l-4 border-blue-500 dark:border-blue-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Boende</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plats</dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {person.residence_location_id ? (
                            <Link href={`/platser/${person.residence_location_id}`} className="text-[#0058a3] dark:text-blue-400 hover:underline">
                              {person.residence_location_name}
                            </Link>
                          ) : (
                            person.residence_location_name
                          )}
                        </dd>
                      </div>
                      {(person.birth_date_text || person.death_date_text) && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Period</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                            {person.birth_date_text && person.death_date_text
                              ? `${formatDate(person.birth_date_text)} – ${formatDate(person.death_date_text)}`
                              : person.birth_date_text
                              ? `från ${formatDate(person.birth_date_text)}`
                              : person.death_date_text
                              ? `till ${formatDate(person.death_date_text)}`
                              : 'Okänd period'}
                          </dd>
                        </div>
                      )}
                      {person.household_head && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hushållsföreståndare</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{person.household_head}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Death Event */}
                {(person.death_date_text || person.death_location_name || person.death_parish) && (
                  <div className="border-l-4 border-gray-500 dark:border-gray-600 pl-4 py-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Död</h3>
                    <dl className="space-y-2">
                      {person.death_date_text && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Datum</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{formatDate(person.death_date_text)}</dd>
                        </div>
                      )}
                      {person.death_location_name && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plats</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">
                            {person.death_location_id ? (
                              <Link href={`/platser/${person.death_location_id}`} className="text-[#0058a3] dark:text-blue-400 hover:underline">
                                {person.death_location_name}
                              </Link>
                            ) : (
                              person.death_location_name
                            )}
                            {person.death_parish && <span className="text-gray-600 dark:text-gray-400"> ({person.death_parish})</span>}
                          </dd>
                        </div>
                      )}
                      {ageAtDeath && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ålder</dt>
                          <dd className="mt-1 text-base text-gray-900 dark:text-gray-100">{ageAtDeath}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </section>

            {/* Family Relationships */}
            {(fathers.length > 0 || mothers.length > 0 || spouses.length > 0 || children.length > 0 ||
              person.relative_info || person.children_info) && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Familj
                </h2>
                <div className="space-y-4">
                  {fathers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Fader</h3>
                      {fathers.map((rel) => rel.related_person && (
                        <Link
                          key={rel.id}
                          href={`/personer/${rel.related_person.id}`}
                          className="block text-[#0058a3] dark:text-blue-400 hover:underline"
                        >
                          {getFullName(rel.related_person)}
                        </Link>
                      ))}
                    </div>
                  )}

                  {mothers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Moder</h3>
                      {mothers.map((rel) => rel.related_person && (
                        <Link
                          key={rel.id}
                          href={`/personer/${rel.related_person.id}`}
                          className="block text-[#0058a3] dark:text-blue-400 hover:underline"
                        >
                          {getFullName(rel.related_person)}
                        </Link>
                      ))}
                    </div>
                  )}

                  {(spouses.length > 0 || person.relative_info) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Make/Maka</h3>
                      {spouses.map((rel) => rel.related_person && (
                        <Link
                          key={rel.id}
                          href={`/personer/${rel.related_person.id}`}
                          className="block text-[#0058a3] dark:text-blue-400 hover:underline mb-1"
                        >
                          {getFullName(rel.related_person)}
                        </Link>
                      ))}
                      {person.relative_info && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm genealogical-note">{person.relative_info}</p>
                      )}
                    </div>
                  )}

                  {(children.length > 0 || person.children_info) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Barn</h3>
                      {children.map((rel) => rel.related_person && (
                        <Link
                          key={rel.id}
                          href={`/personer/${rel.related_person.id}`}
                          className="block text-[#0058a3] dark:text-blue-400 hover:underline mb-1"
                        >
                          {getFullName(rel.related_person)}
                        </Link>
                      ))}
                      {person.children_info && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm genealogical-note">{person.children_info}</p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Comments */}
            {(person.comment || person.extra_text || person.tax_record_comment) && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Anteckningar
                </h2>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  {person.comment && (
                    <p className="text-sm leading-relaxed">{person.comment}</p>
                  )}
                  {person.extra_text && (
                    <p className="text-sm leading-relaxed genealogical-note">{person.extra_text}</p>
                  )}
                  {person.tax_record_comment && (
                    <p className="text-sm leading-relaxed genealogical-note">{person.tax_record_comment}</p>
                  )}
                </div>
              </section>
            )}

            {/* Sources */}
            {person.sources && person.sources.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Källor
                </h2>
                <div className="space-y-3">
                  {person.sources.map((source) => (
                    <div key={source.id} className="border-l-4 border-blue-200 dark:border-blue-700 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {source.source_type} {source.source_type_spec && `(${source.source_type_spec})`}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{source.source_citation}</div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {source.source_date && (
                              <span>Datum: {source.source_date}</span>
                            )}
                            {source.researcher_name && (
                              <span>Forskare: {source.researcher_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
