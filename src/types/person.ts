// Type definitions for the application

export interface Person {
  id: number;
  record_number: string | null;
  post_number: string | null;
  gender: 'M' | 'K' | null;
  marital_status: string | null;
  first_name: string | null;
  patronymic: string | null;
  surname: string | null;
  previous_surname: string | null;
  normalized_first_name: string | null;
  normalized_patronymic: string | null;
  normalized_surname: string | null;
  occupation_id: number | null;
  birth_date: string | null;
  birth_date_text: string | null;
  death_date: string | null;
  death_date_text: string | null;
  marital_status_change_date: string | null;
  age_years: number | null;
  age_months: number | null;
  age_weeks: number | null;
  age_days: number | null;
  birth_location_id: number | null;
  residence_location_id: number | null;
  death_location_id: number | null;
  birth_parish: string | null;
  death_parish: string | null;
  household_head: string | null;
  relative_info: string | null;
  children_info: string | null;
  comment: string | null;
  extra_text: string | null;
  tax_record_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonDetailed extends Person {
  occupation_title: string | null;
  birth_location_name: string | null;
  residence_location_name: string | null;
  death_location_name: string | null;
  researcher_name: string | null;
  source_count: number;
  sources?: Source[];
  relationships?: PersonRelationship[];
}

export interface Location {
  id: number;
  name: string;
  type: string | null;
  parent_id: number | null;
  created_at: string;
}

export interface Source {
  id: number;
  source_type: string;
  source_type_spec: string | null;
  source_citation: string;
  source_date: string | null;
  researcher_id: number | null;
  researcher_name?: string;
  created_at: string;
  source_order?: number;
}

export interface Researcher {
  id: number;
  name: string;
  created_at: string;
}

export interface Occupation {
  id: number;
  title: string;
  normalized_title: string | null;
  created_at: string;
}

export interface Relationship {
  id: number;
  person1_id: number;
  person2_id: number;
  relationship_type: 'father' | 'mother' | 'spouse' | 'child';
  notes: string | null;
  created_at: string;
}

export interface PersonRelationship extends Relationship {
  related_person: Person | null;
}

// GEDCOM 5.5.5 event types
export type GedcomEventType =
  | 'BIRT' // Birth
  | 'DEAT' // Death
  | 'MARR' // Marriage
  | 'BAPM' // Baptism (LDS)
  | 'CHR'  // Christening
  | 'BURI' // Burial
  | 'RESI' // Residence
  | 'EMIG' // Emigration
  | 'IMMI' // Immigration
  | 'NATU' // Naturalization
  | 'CENS' // Census
  | 'OCCU' // Occupation
  | 'GRAD' // Graduation
  | 'CONF' // Confirmation
  | 'ORDN' // Ordination
  | 'ADOP' // Adoption
  | 'CREM' // Cremation
  | 'PROB' // Probate
  | 'WILL' // Will
  | 'EVEN'; // Generic event

export interface Event {
  id: number;
  person_id: number;
  location_id: number | null;
  event_type: GedcomEventType;
  event_date: string | null;
  event_date_text: string | null;
  source_id: number | null;
  notes: string | null;
  confidence_level: 'confirmed' | 'inferred' | 'estimated' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface EventDetailed extends Event {
  person: Person | null;
  location: Location | null;
  source: Source | null;
}

export interface PersonLocationPeriod {
  id: number;
  person_id: number;
  location_id: number;
  start_date: string | null;
  start_date_text: string | null;
  end_date: string | null;
  end_date_text: string | null;
  period_type: 'birth' | 'residence' | 'death';
  inferred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonLocationPeriodDetailed extends PersonLocationPeriod {
  person: Person | null;
  location: Location | null;
}

export interface RelationshipSuggestion {
  id: number;
  person_id: number;
  suggested_relative_id: number | null;
  relationship_type: 'father' | 'mother' | 'spouse' | 'child';
  suggested_name: string | null;
  source_text: string | null;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface RelationshipSuggestionDetailed extends RelationshipSuggestion {
  person: Person | null;
  suggested_relative: Person | null;
}

export interface TimelineFilters {
  start_date?: string;
  end_date?: string;
  event_types?: string[];
  person_id?: number;
}

export interface LocationStats {
  total_events: number;
  births: number;
  deaths: number;
  marriages: number;
  births_by_decade: { [decade: string]: number };
  deaths_by_decade: { [decade: string]: number };
  population_by_year: { [year: string]: number };
}

export interface SearchFilters {
  query?: string;
  gender?: 'M' | 'K';
  birth_year_from?: number;
  birth_year_to?: number;
  death_year_from?: number;
  death_year_to?: number;
  location?: string;
  occupation?: string;
  marital_status?: string;
  source_type?: string;
  researcher?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper function to format person's full name
export function getFullName(person: Partial<Person>): string {
  const parts = [
    person.first_name || person.normalized_first_name,
    person.patronymic || person.normalized_patronymic,
    person.surname || person.normalized_surname,
  ].filter(Boolean);

  return parts.join(' ') || 'Okänd';
}

// Helper function to format dates
export function formatDate(dateText: string | null): string {
  if (!dateText) return 'Okänt datum';

  // Handle partial dates
  if (dateText.includes('-00-00')) {
    return dateText.substring(0, 4); // Just the year
  }
  if (dateText.includes('-00')) {
    const [year, month] = dateText.split('-');
    return `${year}-${month}`; // Year and month
  }

  return dateText;
}

// Helper function to get life span text
export function getLifeSpan(person: Partial<Person>): string {
  const birth = person.birth_date_text ? formatDate(person.birth_date_text) : null;
  const death = person.death_date_text ? formatDate(person.death_date_text) : null;

  if (birth && death) {
    return `${birth} – ${death}`;
  } else if (birth) {
    return `f. ${birth}`;
  } else if (death) {
    return `d. ${death}`;
  }

  return '';
}

// Helper to format age at death
export function formatAgeAtDeath(person: Partial<Person>): string {
  const parts: string[] = [];

  if (person.age_years) parts.push(`${person.age_years} år`);
  if (person.age_months) parts.push(`${person.age_months} mån`);
  if (person.age_weeks) parts.push(`${person.age_weeks} v`);
  if (person.age_days) parts.push(`${person.age_days} d`);

  return parts.join(', ');
}

// GEDCOM event type to Swedish display name mapping
export const gedcomEventNames: Record<GedcomEventType, string> = {
  'BIRT': 'Födelse',
  'DEAT': 'Död',
  'MARR': 'Vigsel',
  'BAPM': 'Dop (LDS)',
  'CHR': 'Kristning',
  'BURI': 'Begravning',
  'RESI': 'Bosättning',
  'EMIG': 'Emigration',
  'IMMI': 'Immigration',
  'NATU': 'Naturalisering',
  'CENS': 'Folkräkning',
  'OCCU': 'Yrke',
  'GRAD': 'Examen',
  'CONF': 'Konfirmation',
  'ORDN': 'Prästvigning',
  'ADOP': 'Adoption',
  'CREM': 'Kremering',
  'PROB': 'Bouppteckning',
  'WILL': 'Testamente',
  'EVEN': 'Händelse',
};

// Helper to get GEDCOM event display name
export function getEventTypeName(eventType: GedcomEventType): string {
  return gedcomEventNames[eventType] || eventType;
}

// Helper to build hierarchical location path following GEDCOM PLAC structure
// GEDCOM format: Address, City, County, State, Country
// Swedish format: Address/Gård, By/Samhälle, Socken/Parish, Län, Country
export function getLocationPath(location: Location | null, hideCountryIfSweden: boolean = true): string {
  if (!location) return '';

  const parts: string[] = [];
  parts.push(location.name);

  // TODO: Fetch parent locations from database
  // For now, return just the location name
  // Future: Build full path like "Traryd, Markaryd, Kronobergs län"
  // and hide "Sverige" if hideCountryIfSweden is true

  return parts.join(', ');
}
