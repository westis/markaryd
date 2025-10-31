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
