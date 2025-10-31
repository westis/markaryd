import { Pool, QueryResult, QueryResultRow } from 'pg';

// Create a singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Close the pool (useful for cleanup in scripts)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Type definitions for our database tables
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
  birth_date: Date | null;
  birth_date_text: string | null;
  death_date: Date | null;
  death_date_text: string | null;
  marital_status_change_date: Date | null;
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
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: number;
  name: string;
  type: string | null;
  parent_id: number | null;
  created_at: Date;
}

export interface Source {
  id: number;
  source_type: string;
  source_type_spec: string | null;
  source_citation: string;
  source_date: Date | null;
  researcher_id: number | null;
  created_at: Date;
}

export interface Researcher {
  id: number;
  name: string;
  created_at: Date;
}

export interface Occupation {
  id: number;
  title: string;
  normalized_title: string | null;
  created_at: Date;
}

export interface Relationship {
  id: number;
  person1_id: number;
  person2_id: number;
  relationship_type: 'father' | 'mother' | 'spouse' | 'child';
  notes: string | null;
  created_at: Date;
}

// Helper functions for common queries
export async function getPersonById(id: number): Promise<Person | null> {
  const result = await query<Person>(
    'SELECT * FROM persons WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function searchPersons(
  searchTerm: string,
  limit: number = 50,
  offset: number = 0
): Promise<Person[]> {
  const result = await query<Person>(
    `SELECT * FROM persons
     WHERE to_tsvector('swedish',
       COALESCE(first_name, '') || ' ' ||
       COALESCE(patronymic, '') || ' ' ||
       COALESCE(surname, '') || ' ' ||
       COALESCE(normalized_first_name, '')
     ) @@ plainto_tsquery('swedish', $1)
     ORDER BY normalized_first_name, birth_date
     LIMIT $2 OFFSET $3`,
    [searchTerm, limit, offset]
  );
  return result.rows;
}

export async function getPersonsByLocation(
  locationId: number,
  limit: number = 50
): Promise<Person[]> {
  const result = await query<Person>(
    `SELECT * FROM persons
     WHERE residence_location_id = $1
     OR birth_location_id = $1
     OR death_location_id = $1
     ORDER BY normalized_first_name
     LIMIT $2`,
    [locationId, limit]
  );
  return result.rows;
}

export async function getAllLocations(): Promise<Location[]> {
  const result = await query<Location>(
    'SELECT * FROM locations ORDER BY type, name'
  );
  return result.rows;
}

export async function getPersonRelationships(
  personId: number
): Promise<Relationship[]> {
  const result = await query<Relationship>(
    `SELECT * FROM relationships
     WHERE person1_id = $1 OR person2_id = $1
     ORDER BY relationship_type`,
    [personId]
  );
  return result.rows;
}
