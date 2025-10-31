#!/usr/bin/env tsx

// Load environment variables from .env.local
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExcelRow {
  'Kommentar': string;
  'Källdatum': string;
  'Födelsedatum': string;
  'Döddatum': string;
  'Dat. ändrat civilstånd': string;
  'Kön': string;
  'Civilst.': string;
  'Titel/yrke': string;
  'Förnamn': string;
  'Patronymikon': string;
  'Tillnamn/efternamn': string;
  'Tidigare efternamn': string;
  'Norm. förnamn': string;
  'Norm. patronymikon': string;
  'Norm. efternamn': string;
  'Boendeadress': string;
  'Födelseadress': string;
  'Födelsefsg/-län/-landskap': string;
  'Dödadress': string;
  'Dödförsamling': string;
  'Fad. titel': string;
  'Fad. förnamn': string;
  'Fad. efternamn': string;
  'Mod. titel': string;
  'Mod. förnamn': string;
  'Mod. efternamn': string;
  'Hushållsföreståndare (mantal)': string;
  'Anhörig (make/maka om inte annat anges)': string;
  'Barn/arvinge': string;
  'Extra text': string;
  'Kommentar (om mantalslängd/jordebok: husfader)': string;
  'År (enl. källa)': number;
  'Månader (vid död)': number;
  'Veckor (vid död)': number;
  'Dagar (vid död)': number;
  'Forskare': string;
  'Källtyp': string;
  'Källtyp spec': string;
  'Källa 1': string;
  'Källa 2': string;
  'Källa 3': string;
  'Källa 4': string;
  'Källa 5': string;
  'Källa 6': string;
  'Nr': number;
  'Post nr.': number;
  [key: string]: any;
}

// Cache for IDs to avoid redundant queries
const researcherCache = new Map<string, number>();
const locationCache = new Map<string, number>();
const occupationCache = new Map<string, number>();

// Statistics
let stats = {
  persons: 0,
  researchers: 0,
  locations: 0,
  occupations: 0,
  sources: 0,
  errors: 0,
};

// Helper functions
function cleanValue(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  if (str.startsWith('=')) return null;
  return str || null;
}

function normalizeGender(gender: string | null): string | null {
  if (!gender) return null;
  const g = gender.trim().toUpperCase();
  if (g === 'M') return 'M';
  if (g === 'K' || g === 'K ') return 'K';
  return null;
}

function parseDateText(dateText: string | null): { date: string | null; text: string | null } {
  if (!dateText) return { date: null, text: null };

  const cleaned = cleanValue(dateText);
  if (!cleaned) return { date: null, text: null };

  try {
    const originalText = cleaned;
    let parseText = cleaned.replace(/\s*\(ca\)/g, '').replace(/^ca\s+/, '').trim();

    // Handle YYYY-00-00 format
    if (/^\d{4}-00-00$/.test(parseText)) {
      const year = parseInt(parseText.substring(0, 4));
      return { date: `${year}-01-01`, text: originalText };
    }

    // Handle YYYY-MM-00 format
    if (/^\d{4}-\d{2}-00$/.test(parseText)) {
      const [year, month] = parseText.split('-').map(n => parseInt(n));
      return { date: `${year}-${String(month).padStart(2, '0')}-01`, text: originalText };
    }

    // Try parsing as regular date
    return { date: parseText, text: originalText };
  } catch (error) {
    return { date: null, text: cleaned };
  }
}

// Get or create researcher
async function getOrCreateResearcher(name: string): Promise<number> {
  const cleanName = cleanValue(name);
  if (!cleanName) return 1; // Default researcher

  if (researcherCache.has(cleanName)) {
    return researcherCache.get(cleanName)!;
  }

  const { data, error } = await supabase
    .from('researchers')
    .upsert({ name: cleanName }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating researcher:', error);
    return 1;
  }

  researcherCache.set(cleanName, data.id);
  stats.researchers++;
  return data.id;
}

// Get or create location
async function getOrCreateLocation(name: string, type: string = 'address'): Promise<number | null> {
  const cleanName = cleanValue(name);
  if (!cleanName) return null;

  const cacheKey = `${cleanName}:${type}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }

  const { data, error } = await supabase
    .from('locations')
    .upsert({ name: cleanName, type }, { onConflict: 'name,type' })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating location:', error);
    return null;
  }

  locationCache.set(cacheKey, data.id);
  stats.locations++;
  return data.id;
}

// Get or create occupation
async function getOrCreateOccupation(title: string): Promise<number | null> {
  const cleanTitle = cleanValue(title);
  if (!cleanTitle) return null;

  if (occupationCache.has(cleanTitle)) {
    return occupationCache.get(cleanTitle)!;
  }

  const { data, error } = await supabase
    .from('occupations')
    .upsert({ title: cleanTitle }, { onConflict: 'title' })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating occupation:', error);
    return null;
  }

  occupationCache.set(cleanTitle, data.id);
  stats.occupations++;
  return data.id;
}

// Import a single person
async function importPerson(row: ExcelRow): Promise<number | null> {
  try {
    const researcherId = await getOrCreateResearcher(row['Forskare']);
    const occupationId = row['Titel/yrke'] ? await getOrCreateOccupation(row['Titel/yrke']) : null;

    const birthLocationId = row['Födelseadress'] ? await getOrCreateLocation(row['Födelseadress'], 'address') : null;
    const residenceLocationId = row['Boendeadress'] ? await getOrCreateLocation(row['Boendeadress'], 'address') : null;
    const deathLocationId = row['Dödadress'] ? await getOrCreateLocation(row['Dödadress'], 'address') : null;

    const birthDate = parseDateText(cleanValue(row['Födelsedatum']));
    const deathDate = parseDateText(cleanValue(row['Döddatum']));
    const maritalStatusChangeDate = parseDateText(cleanValue(row['Dat. ändrat civilstånd']));
    const sourceDate = parseDateText(cleanValue(row['Källdatum']));

    // Insert person
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert({
        record_number: cleanValue(row['Nr']),
        post_number: cleanValue(row['Post nr.']),
        gender: normalizeGender(cleanValue(row['Kön'])),
        marital_status: cleanValue(row['Civilst.']),
        first_name: cleanValue(row['Förnamn']),
        patronymic: cleanValue(row['Patronymikon']),
        surname: cleanValue(row['Tillnamn/efternamn']),
        previous_surname: cleanValue(row['Tidigare efternamn']),
        normalized_first_name: cleanValue(row['Norm. förnamn']),
        normalized_patronymic: cleanValue(row['Norm. patronymikon']),
        normalized_surname: cleanValue(row['Norm. efternamn']),
        occupation_id: occupationId,
        birth_date: birthDate.date,
        birth_date_text: birthDate.text,
        death_date: deathDate.date,
        death_date_text: deathDate.text,
        marital_status_change_date: maritalStatusChangeDate.date,
        age_years: row['År (enl. källa)'] || null,
        age_months: row['Månader (vid död)'] || null,
        age_weeks: row['Veckor (vid död)'] || null,
        age_days: row['Dagar (vid död)'] || null,
        birth_location_id: birthLocationId,
        residence_location_id: residenceLocationId,
        death_location_id: deathLocationId,
        birth_parish: cleanValue(row['Födelsefsg/-län/-landskap']),
        death_parish: cleanValue(row['Dödförsamling']),
        household_head: cleanValue(row['Hushållsföreståndare (mantal)']),
        relative_info: cleanValue(row['Anhörig (make/maka om inte annat anges)']),
        children_info: cleanValue(row['Barn/arvinge']),
        comment: cleanValue(row['Kommentar']),
        extra_text: cleanValue(row['Extra text']),
        tax_record_comment: cleanValue(row['Kommentar (om mantalslängd/jordebok: husfader)']),
      })
      .select('id')
      .single();

    if (personError || !person) {
      console.error('Error creating person:', personError);
      stats.errors++;
      return null;
    }

    stats.persons++;

    // Create sources
    const sources = [
      { order: 1, citation: row['Källa 1'] },
      { order: 2, citation: row['Källa 2'] },
      { order: 3, citation: row['Källa 3'] },
      { order: 4, citation: row['Källa 4'] },
      { order: 5, citation: row['Källa 5'] },
      { order: 6, citation: row['Källa 6'] },
    ];

    for (const source of sources) {
      const citation = cleanValue(source.citation);
      if (!citation) continue;

      const { data: sourceData, error: sourceError } = await supabase
        .from('sources')
        .insert({
          source_type: row['Källtyp'],
          source_type_spec: cleanValue(row['Källtyp spec']),
          source_citation: citation,
          source_date: sourceDate.date,
          researcher_id: researcherId,
        })
        .select('id')
        .single();

      if (sourceError || !sourceData) continue;

      stats.sources++;

      await supabase
        .from('person_sources')
        .insert({
          person_id: person.id,
          source_id: sourceData.id,
          source_order: source.order,
        });
    }

    return person.id;
  } catch (error) {
    console.error('Error importing person:', error);
    stats.errors++;
    return null;
  }
}

// Main import function
async function main() {
  console.log('🚀 Starting Excel import...\n');

  try {
    const excelPath = path.join(process.cwd(), '..', 'Markarydsregistret_attskicka.xlsx');

    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Excel file not found at: ${excelPath}`);
      process.exit(1);
    }

    console.log(`📁 Reading Excel file: ${excelPath}`);

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} rows in Excel file\n`);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await supabase.from('person_sources').delete().neq('person_id', 0);
    await supabase.from('relationships').delete().neq('id', 0);
    await supabase.from('persons').delete().neq('id', 0);
    await supabase.from('sources').delete().neq('id', 0);
    await supabase.from('locations').delete().neq('id', 0);
    await supabase.from('occupations').delete().neq('id', 0);
    await supabase.from('researchers').delete().neq('id', 0);

    // Re-insert default researcher
    await supabase.from('researchers').insert({ name: 'Okänd forskare' });

    console.log('✅ Database cleared\n');

    // Import all persons
    console.log('👥 Importing persons...');
    let progress = 0;
    const total = data.length;

    for (const row of data) {
      await importPerson(row);
      progress++;

      if (progress % 50 === 0 || progress === total) {
        console.log(`   Progress: ${progress}/${total} (${Math.round(progress / total * 100)}%)`);
      }
    }

    console.log('\n✅ Import complete!\n');
    console.log('📈 Statistics:');
    console.log(`   Persons:     ${stats.persons}`);
    console.log(`   Researchers: ${stats.researchers}`);
    console.log(`   Locations:   ${stats.locations}`);
    console.log(`   Occupations: ${stats.occupations}`);
    console.log(`   Sources:     ${stats.sources}`);
    console.log(`   Errors:      ${stats.errors}`);

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
main();
