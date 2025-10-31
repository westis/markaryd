import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Type definitions
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
  created_at: string;
}

// Helper functions for common queries
export async function getPersonById(id: number) {
  const { data, error } = await supabase
    .from('persons')
    .select(`
      *,
      occupation:occupations(title),
      birth_location:locations!birth_location_id(name),
      residence_location:locations!residence_location_id(name),
      death_location:locations!death_location_id(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function searchPersons(
  searchTerm: string,
  limit: number = 50,
  offset: number = 0
) {
  // Use text search on name fields
  const { data, error } = await supabase
    .from('persons')
    .select(`
      *,
      occupation:occupations(title),
      residence_location:locations!residence_location_id(name),
      birth_location:locations!birth_location_id(name),
      death_location:locations!death_location_id(name)
    `)
    .or(`normalized_first_name.ilike.%${searchTerm}%,normalized_patronymic.ilike.%${searchTerm}%,normalized_surname.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`)
    .order('normalized_first_name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getPersonsByLocation(
  locationId: number,
  limit: number = 50
) {
  const { data, error } = await supabase
    .from('persons')
    .select(`
      *,
      occupation:occupations(title)
    `)
    .or(`residence_location_id.eq.${locationId},birth_location_id.eq.${locationId},death_location_id.eq.${locationId}`)
    .order('normalized_first_name')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getAllLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPersonRelationships(personId: number) {
  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .or(`person1_id.eq.${personId},person2_id.eq.${personId}`)
    .order('relationship_type');

  if (error) throw error;
  return data || [];
}
