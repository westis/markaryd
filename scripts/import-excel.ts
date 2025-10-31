#!/usr/bin/env tsx

// Load environment variables from .env.local
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import * as XLSX from 'xlsx';
import { Pool } from 'pg';
import * as fs from 'fs';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/markaryd_registry',
});

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
const sourceCache = new Map<string, number>();

// Statistics
let stats = {
  persons: 0,
  researchers: 0,
  locations: 0,
  occupations: 0,
  sources: 0,
  relationships: 0,
  errors: 0,
};

// Helper functions
function cleanValue(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  // Remove Excel formula artifacts
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

function parseDateText(dateText: string | null): { date: Date | null; text: string | null } {
  if (!dateText) return { date: null, text: null };

  const cleaned = cleanValue(dateText);
  if (!cleaned) return { date: null, text: null };

  try {
    // Store original text
    const originalText = cleaned;

    // Remove circa notation for parsing
    let parseText = cleaned.replace(/\s*\(ca\)/g, '').replace(/^ca\s+/, '').trim();

    // Handle YYYY-00-00 format (year only)
    if (/^\d{4}-00-00$/.test(parseText)) {
      const year = parseInt(parseText.substring(0, 4));
      return { date: new Date(year, 0, 1), text: originalText };
    }

    // Handle YYYY-MM-00 format (year and month)
    if (/^\d{4}-\d{2}-00$/.test(parseText)) {
      const [year, month] = parseText.split('-').map(n => parseInt(n));
      return { date: new Date(year, month - 1, 1), text: originalText };
    }

    // Try parsing as regular date
    const date = new Date(parseText);
    if (isNaN(date.getTime())) {
      return { date: null, text: originalText };
    }

    return { date, text: originalText };
  } catch (error) {
    return { date: null, text: cleaned };
  }
}

// Get or create researcher
async function getOrCreateResearcher(name: string): Promise<number> {
  const cleanName = cleanValue(name);
  if (!cleanName) {
    // Return default "Okänd forskare" researcher
    return 1;
  }

  if (researcherCache.has(cleanName)) {
    return researcherCache.get(cleanName)!;
  }

  const result = await pool.query(
    'INSERT INTO researchers (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [cleanName]
  );

  const id = result.rows[0].id;
  researcherCache.set(cleanName, id);
  stats.researchers++;
  return id;
}

// Get or create location
async function getOrCreateLocation(name: string, type: string = 'address'): Promise<number> {
  const cleanName = cleanValue(name);
  if (!cleanName) return null as any;

  const cacheKey = `${cleanName}:${type}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }

  const result = await pool.query(
    'INSERT INTO locations (name, type) VALUES ($1, $2) ON CONFLICT (name, type) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [cleanName, type]
  );

  const id = result.rows[0].id;
  locationCache.set(cacheKey, id);
  stats.locations++;
  return id;
}

// Get or create occupation
async function getOrCreateOccupation(title: string): Promise<number> {
  const cleanTitle = cleanValue(title);
  if (!cleanTitle) return null as any;

  if (occupationCache.has(cleanTitle)) {
    return occupationCache.get(cleanTitle)!;
  }

  const result = await pool.query(
    'INSERT INTO occupations (title) VALUES ($1) ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title RETURNING id',
    [cleanTitle]
  );

  const id = result.rows[0].id;
  occupationCache.set(cleanTitle, id);
  stats.occupations++;
  return id;
}

// Create source and link to person
async function createSource(
  sourceType: string,
  sourceTypeSpec: string | null,
  sourceCitation: string,
  sourceDate: Date | null,
  researcherId: number,
  personId: number,
  sourceOrder: number
): Promise<void> {
  const cleanCitation = cleanValue(sourceCitation);
  if (!cleanCitation) return;

  // Create cache key
  const cacheKey = `${sourceType}:${sourceTypeSpec}:${cleanCitation}`;

  let sourceId: number;

  if (sourceCache.has(cacheKey)) {
    sourceId = sourceCache.get(cacheKey)!;
  } else {
    const result = await pool.query(
      `INSERT INTO sources (source_type, source_type_spec, source_citation, source_date, researcher_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [cleanValue(sourceType), cleanValue(sourceTypeSpec), cleanCitation, sourceDate, researcherId]
    );
    sourceId = result.rows[0].id;
    sourceCache.set(cacheKey, sourceId);
    stats.sources++;
  }

  // Link source to person
  await pool.query(
    'INSERT INTO person_sources (person_id, source_id, source_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [personId, sourceId, sourceOrder]
  );
}

// Import a single person from Excel row
async function importPerson(row: ExcelRow): Promise<number | null> {
  try {
    // Get or create related entities
    const researcherId = await getOrCreateResearcher(row['Forskare']);

    let occupationId: number | null = null;
    if (row['Titel/yrke']) {
      occupationId = await getOrCreateOccupation(row['Titel/yrke']);
    }

    let birthLocationId: number | null = null;
    if (row['Födelseadress']) {
      birthLocationId = await getOrCreateLocation(row['Födelseadress'], 'address');
    }

    let residenceLocationId: number | null = null;
    if (row['Boendeadress']) {
      residenceLocationId = await getOrCreateLocation(row['Boendeadress'], 'address');
    }

    let deathLocationId: number | null = null;
    if (row['Dödadress']) {
      deathLocationId = await getOrCreateLocation(row['Dödadress'], 'address');
    }

    // Parse dates
    const birthDate = parseDateText(cleanValue(row['Födelsedatum']));
    const deathDate = parseDateText(cleanValue(row['Döddatum']));
    const maritalStatusChangeDate = parseDateText(cleanValue(row['Dat. ändrat civilstånd']));
    const sourceDate = parseDateText(cleanValue(row['Källdatum']));

    // Insert person
    const personResult = await pool.query(
      `INSERT INTO persons (
        record_number, post_number, gender, marital_status,
        first_name, patronymic, surname, previous_surname,
        normalized_first_name, normalized_patronymic, normalized_surname,
        occupation_id,
        birth_date, birth_date_text,
        death_date, death_date_text,
        marital_status_change_date,
        age_years, age_months, age_weeks, age_days,
        birth_location_id, residence_location_id, death_location_id,
        birth_parish, death_parish,
        household_head, relative_info, children_info,
        comment, extra_text, tax_record_comment
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
      ) RETURNING id`,
      [
        cleanValue(row['Nr']),
        cleanValue(row['Post nr.']),
        normalizeGender(cleanValue(row['Kön'])),
        cleanValue(row['Civilst.']),
        cleanValue(row['Förnamn']),
        cleanValue(row['Patronymikon']),
        cleanValue(row['Tillnamn/efternamn']),
        cleanValue(row['Tidigare efternamn']),
        cleanValue(row['Norm. förnamn']),
        cleanValue(row['Norm. patronymikon']),
        cleanValue(row['Norm. efternamn']),
        occupationId,
        birthDate.date,
        birthDate.text,
        deathDate.date,
        deathDate.text,
        maritalStatusChangeDate.date,
        row['År (enl. källa)'] || null,
        row['Månader (vid död)'] || null,
        row['Veckor (vid död)'] || null,
        row['Dagar (vid död)'] || null,
        birthLocationId,
        residenceLocationId,
        deathLocationId,
        cleanValue(row['Födelsefsg/-län/-landskap']),
        cleanValue(row['Dödförsamling']),
        cleanValue(row['Hushållsföreståndare (mantal)']),
        cleanValue(row['Anhörig (make/maka om inte annat anges)']),
        cleanValue(row['Barn/arvinge']),
        cleanValue(row['Kommentar']),
        cleanValue(row['Extra text']),
        cleanValue(row['Kommentar (om mantalslängd/jordebok: husfader)']),
      ]
    );

    const personId = personResult.rows[0].id;
    stats.persons++;

    // Create sources (1-6)
    const sources = [
      { order: 1, citation: row['Källa 1'] },
      { order: 2, citation: row['Källa 2'] },
      { order: 3, citation: row['Källa 3'] },
      { order: 4, citation: row['Källa 4'] },
      { order: 5, citation: row['Källa 5'] },
      { order: 6, citation: row['Källa 6'] },
    ];

    for (const source of sources) {
      if (source.citation) {
        await createSource(
          row['Källtyp'],
          row['Källtyp spec'],
          source.citation,
          sourceDate.date,
          researcherId,
          personId,
          source.order
        );
      }
    }

    return personId;
  } catch (error) {
    console.error('Error importing person:', error);
    console.error('Row data:', row);
    stats.errors++;
    return null;
  }
}

// Main import function
async function main() {
  console.log('🚀 Starting Excel import...\n');

  try {
    // Find the Excel file
    const excelPath = path.join(process.cwd(), '..', 'Markarydsregistret_attskicka.xlsx');

    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Excel file not found at: ${excelPath}`);
      console.log('Please make sure the file Markarydsregistret_attskicka.xlsx is in the parent directory.');
      process.exit(1);
    }

    console.log(`📁 Reading Excel file: ${excelPath}`);

    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} rows in Excel file\n`);

    // Clear existing data (optional - comment out if you want to append)
    console.log('🗑️  Clearing existing data...');
    await pool.query('TRUNCATE TABLE person_sources, relationships, persons, sources, locations, occupations, researchers RESTART IDENTITY CASCADE');

    // Re-insert default researcher
    await pool.query("INSERT INTO researchers (name) VALUES ('Okänd forskare')");

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

    if (stats.errors > 0) {
      console.log('\n⚠️  Some errors occurred during import. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
main();
