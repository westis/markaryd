#!/usr/bin/env tsx

// Migration script to convert existing person data into events and location periods
// This enables the timeline feature for place-based history tracking

// Load environment variables from .env.local
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Person {
  id: number;
  birth_date: string | null;
  birth_date_text: string | null;
  birth_location_id: number | null;
  death_date: string | null;
  death_date_text: string | null;
  death_location_id: number | null;
  residence_location_id: number | null;
  first_name: string | null;
  patronymic: string | null;
  surname: string | null;
}

// Statistics tracking
const stats = {
  personsProcessed: 0,
  birthEventsCreated: 0,
  deathEventsCreated: 0,
  residencePeriodsCreated: 0,
  errors: 0,
};

/**
 * Create a birth event for a person
 */
async function createBirthEvent(person: Person): Promise<boolean> {
  if (!person.birth_date && !person.birth_date_text) {
    return false; // No birth date information
  }

  try {
    const { error } = await supabase
      .from('events')
      .insert({
        person_id: person.id,
        location_id: person.birth_location_id,
        event_type: 'BIRT',
        event_date: person.birth_date,
        event_date_text: person.birth_date_text,
        confidence_level: 'inferred',
        notes: 'Auto-migrerad från persondata',
      });

    if (error) {
      console.error(`  ❌ Error creating birth event for person ${person.id}:`, error.message);
      stats.errors++;
      return false;
    }

    stats.birthEventsCreated++;
    return true;
  } catch (error) {
    console.error(`  ❌ Exception creating birth event for person ${person.id}:`, error);
    stats.errors++;
    return false;
  }
}

/**
 * Create a death event for a person
 */
async function createDeathEvent(person: Person): Promise<boolean> {
  if (!person.death_date && !person.death_date_text) {
    return false; // No death date information
  }

  try {
    const { error } = await supabase
      .from('events')
      .insert({
        person_id: person.id,
        location_id: person.death_location_id,
        event_type: 'DEAT',
        event_date: person.death_date,
        event_date_text: person.death_date_text,
        confidence_level: 'inferred',
        notes: 'Auto-migrerad från persondata',
      });

    if (error) {
      console.error(`  ❌ Error creating death event for person ${person.id}:`, error.message);
      stats.errors++;
      return false;
    }

    stats.deathEventsCreated++;
    return true;
  } catch (error) {
    console.error(`  ❌ Exception creating death event for person ${person.id}:`, error);
    stats.errors++;
    return false;
  }
}

/**
 * Create location periods for a person's residences
 * Infers start/end dates from birth/death dates
 */
async function createLocationPeriods(person: Person): Promise<void> {
  const periods: Array<{
    location_id: number;
    period_type: 'birth' | 'residence' | 'death';
    start_date: string | null;
    end_date: string | null;
  }> = [];

  // Birth location period (moment in time)
  if (person.birth_location_id && person.birth_date) {
    periods.push({
      location_id: person.birth_location_id,
      period_type: 'birth',
      start_date: person.birth_date,
      end_date: person.birth_date,
    });
  }

  // Death location period (moment in time)
  if (person.death_location_id && person.death_date) {
    periods.push({
      location_id: person.death_location_id,
      period_type: 'death',
      start_date: person.death_date,
      end_date: person.death_date,
    });
  }

  // Residence location period (inferred from birth to death, or just existence)
  if (person.residence_location_id) {
    // Infer residence start: use birth date if available, otherwise unknown
    const start_date = person.birth_date;
    // Infer residence end: use death date if available, otherwise unknown (still living there or moved)
    const end_date = person.death_date;

    periods.push({
      location_id: person.residence_location_id,
      period_type: 'residence',
      start_date: start_date,
      end_date: end_date,
    });
  }

  // Insert all periods for this person
  for (const period of periods) {
    try {
      const { error } = await supabase
        .from('person_location_periods')
        .insert({
          person_id: person.id,
          location_id: period.location_id,
          start_date: period.start_date,
          start_date_text: period.start_date || null,
          end_date: period.end_date,
          end_date_text: period.end_date || null,
          period_type: period.period_type,
          inferred: true,
          notes: 'Auto-migrated from person location data',
        });

      if (error) {
        console.error(`  ❌ Error creating ${period.period_type} period for person ${person.id}:`, error.message);
        stats.errors++;
      } else {
        stats.residencePeriodsCreated++;
      }
    } catch (error) {
      console.error(`  ❌ Exception creating ${period.period_type} period for person ${person.id}:`, error);
      stats.errors++;
    }
  }
}

/**
 * Process a single person to create events and periods
 */
async function processPerson(person: Person): Promise<void> {
  // Create birth event if data exists
  await createBirthEvent(person);

  // Create death event if data exists
  await createDeathEvent(person);

  // Create location periods (birth, residence, death)
  await createLocationPeriods(person);

  stats.personsProcessed++;
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('🚀 Starting migration: Converting person data to events and location periods\n');

  // Check if tables exist
  console.log('📋 Checking database schema...');
  const { data: tables, error: tablesError } = await supabase
    .from('events')
    .select('id')
    .limit(1);

  if (tablesError) {
    console.error('❌ Error: Events table does not exist!');
    console.error('Please run the schema.sql file first to create the new tables.');
    console.error('Error:', tablesError.message);
    process.exit(1);
  }

  // Check if migration has already been run
  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`⚠️  Warning: Events table already contains ${count} records.`);
    console.log('This migration may create duplicate events.');
    console.log('Continue anyway? Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Fetch all persons from the database
  console.log('📥 Fetching all persons from database...');
  const { data: persons, error: personsError } = await supabase
    .from('persons')
    .select('id, birth_date, birth_date_text, birth_location_id, death_date, death_date_text, death_location_id, residence_location_id, first_name, patronymic, surname')
    .order('id');

  if (personsError) {
    console.error('❌ Error fetching persons:', personsError.message);
    process.exit(1);
  }

  if (!persons || persons.length === 0) {
    console.log('⚠️  No persons found in database. Nothing to migrate.');
    process.exit(0);
  }

  console.log(`✅ Found ${persons.length} persons to process\n`);

  // Process each person
  console.log('⚙️  Processing persons...');
  let processed = 0;
  const batchSize = 50;

  for (const person of persons) {
    await processPerson(person);
    processed++;

    // Show progress every batch
    if (processed % batchSize === 0) {
      const percentage = ((processed / persons.length) * 100).toFixed(1);
      console.log(`  📊 Progress: ${processed}/${persons.length} (${percentage}%)`);
    }
  }

  // Final statistics
  console.log('\n✅ Migration complete!\n');
  console.log('📊 Statistics:');
  console.log(`  - Persons processed: ${stats.personsProcessed}`);
  console.log(`  - Birth events created: ${stats.birthEventsCreated}`);
  console.log(`  - Death events created: ${stats.deathEventsCreated}`);
  console.log(`  - Location periods created: ${stats.residencePeriodsCreated}`);
  console.log(`  - Errors: ${stats.errors}`);
  console.log('');

  if (stats.errors > 0) {
    console.log('⚠️  Some errors occurred during migration. Please review the logs above.');
  } else {
    console.log('🎉 All data migrated successfully!');
  }
}

// Run the migration
migrate()
  .then(() => {
    console.log('\n✨ Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  });
