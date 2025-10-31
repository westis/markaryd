/**
 * Swedish Name Normalization Utility
 * Based on standards from https://www.rotter.se/faktabanken/personnamn/bakgrund-namnlistan
 *
 * This utility handles bidirectional name normalization for Swedish historical names,
 * accounting for spelling variations, alternative forms, and diminutives.
 */

// Name variation groups - each group contains equivalent names
const NAME_VARIATION_GROUPS = [
  // A
  ['Abraham', 'Abram'],
  ['Adam', 'Addam'],
  ['Adolf', 'Adolph'],
  ['Albert', 'Albrekt'],
  ['Alexander', 'Aleksander'],
  ['Anders', 'Andreas', 'Ander'],
  ['Anna', 'Anne', 'Ann'],
  ['Anton', 'Antonius'],

  // B
  ['Barbro', 'Barbara'],
  ['Bengt', 'Bent', 'Benedikt', 'Benedict'],
  ['Berit', 'Beata', 'Birgitta', 'Britta', 'Brita', 'Birgit'],
  ['Bernhard', 'Bernard'],
  ['Bertil', 'Berthold'],

  // C
  ['Cajsa', 'Kajsa', 'Kaja'],
  ['Carl', 'Karl', 'Carel', 'Karle'],
  ['Carolina', 'Karolina', 'Caroline', 'Carolin'],
  ['Catharina', 'Catarina', 'Katarina', 'Katrina', 'Carin', 'Karin', 'Karna', 'Cajsa', 'Stina', 'Trina'],
  ['Cecilia', 'Cecilie', 'Cilla'],
  ['Charlotta', 'Charlotte', 'Lotta'],
  ['Christian', 'Christer', 'Kristian', 'Krister'],
  ['Christina', 'Kristina', 'Christine', 'Christin', 'Kerstin', 'Stina'],
  ['Christoffer', 'Kristoffer', 'Christopher'],
  ['Clara', 'Klara'],

  // D
  ['Daniel', 'Danijel'],
  ['David', 'Dawid'],

  // E
  ['Edvard', 'Edward'],
  ['Eleonora', 'Leonora'],
  ['Elisabet', 'Elisabeth', 'Elisbeth', 'Elisa', 'Lisa', 'Betta', 'Bettan', 'Lisbet'],
  ['Emanuel', 'Emmanuel'],
  ['Emil', 'Emilie'],
  ['Erik', 'Eric', 'Erich'],
  ['Ester', 'Esther'],
  ['Eva', 'Eve'],

  // F
  ['Fredrika', 'Fredrica', 'Fredrique', 'Fredrique', 'Fricka'],
  ['Fredrik', 'Frederick', 'Fredrich', 'Fricke'],

  // G
  ['Gabriel', 'Gabriell'],
  ['Georg', 'Göran', 'Jöran', 'Jörgen', 'Örjan', 'Yrjö'],
  ['Gertrud', 'Gertrude', 'Trude'],
  ['Gunhild', 'Gunilla', 'Gunnel'],
  ['Gustaf', 'Gustav', 'Gösta'],
  ['Greta', 'Margareta', 'Margaretha', 'Margreta', 'Margit', 'Marit', 'Meta', 'Grete'],

  // H
  ['Hans', 'Hannes', 'Johan', 'Johannes', 'John', 'Jan'],
  ['Harald', 'Harold'],
  ['Helena', 'Helen', 'Elin', 'Lena'],
  ['Henning', 'Hendrik', 'Henrik', 'Henrich', 'Henry'],
  ['Hilda', 'Hildur'],

  // I
  ['Ingeborg', 'Ingaborg', 'Ingebjörg'],
  ['Ingegerd', 'Ingegärd', 'Inger'],
  ['Ingrid', 'Ingri'],
  ['Isabel', 'Isabella', 'Isabell'],
  ['Isak', 'Isaac'],

  // J
  ['Jacob', 'Jakob', 'Jacob'],
  ['Jesper', 'Jasper'],
  ['Johanna', 'Joanna', 'Hanna'],
  ['Jonas', 'Jöns'],
  ['Josef', 'Joseph', 'Jösse'],
  ['Josefina', 'Josephina', 'Josefine', 'Josephine', 'Fina'],
  ['Judith', 'Judit'],

  // K
  ['Kjell', 'Kell'],
  ['Klara', 'Clara'],
  ['Kristian', 'Christian', 'Christer', 'Krister'],
  ['Kristina', 'Christina', 'Christine', 'Kerstin'],
  ['Kristoffer', 'Christoffer', 'Christopher'],

  // L
  ['Lars', 'Larss', 'Laurens', 'Laurentius'],
  ['Lovisa', 'Lovise', 'Louisa', 'Louise'],
  ['Ludvig', 'Ludwig', 'Ludvik'],

  // M
  ['Magdalena', 'Madeleine', 'Malin', 'Lena'],
  ['Magnus', 'Måns', 'Maans'],
  ['Marcus', 'Markus', 'Mars'],
  ['Maria', 'Marie', 'Mary', 'Maja', 'May'],
  ['Marta', 'Martha', 'Märta'],
  ['Mathias', 'Mattias', 'Matts', 'Mats', 'Mathis'],
  ['Mikael', 'Michael', 'Michel', 'Mickel'],

  // N
  ['Niklas', 'Nicolaus', 'Nils', 'Niels', 'Nicolas', 'Nicholas'],

  // O
  ['Olaus', 'Olof', 'Olov', 'Ola', 'Ole'],
  ['Oskar', 'Oscar'],

  // P
  ['Paul', 'Poul', 'Påvel'],
  ['Per', 'Pär', 'Peder', 'Peter', 'Petter', 'Petter', 'Peer'],
  ['Petronella', 'Petronilla', 'Pernilla', 'Nella'],
  ['Philippa', 'Filippa'],

  // R
  ['Rebecka', 'Rebecca', 'Rebekka'],
  ['Regina', 'Regine'],
  ['Rikard', 'Richard'],
  ['Robert', 'Robbert'],

  // S
  ['Samuel', 'Samuell'],
  ['Sara', 'Sarah', 'Sassa'],
  ['Sigrid', 'Sigfrid'],
  ['Sofia', 'Sophia', 'Sophie', 'Sofie'],
  ['Stefan', 'Stephan', 'Staffan', 'Steffen'],
  ['Susanna', 'Susanne', 'Susann', 'Sanna'],
  ['Sven', 'Svend', 'Svein'],
  ['Svea', 'Sveja'],

  // T
  ['Teodor', 'Theodor'],
  ['Thomas', 'Tomas', 'Tommas'],

  // U
  ['Ulrika', 'Ulrica', 'Ulla'],

  // V
  ['Valborg', 'Valburg'],
  ['Vilhelm', 'Wilhelm', 'William'],
  ['Viktor', 'Victor'],

  // W
  ['Walborg', 'Valborg'],
  ['Wilhelmina', 'Vilhelmina', 'Mina'],
];

// Build normalization maps (bidirectional)
const nameToVariants = new Map<string, Set<string>>();
const normalizedNameMap = new Map<string, string>();

// Initialize the maps
NAME_VARIATION_GROUPS.forEach(group => {
  // The first name in each group is considered the "canonical" form
  const canonical = group[0].toLowerCase();

  group.forEach(name => {
    const lowerName = name.toLowerCase();

    // Map each name to its canonical form
    normalizedNameMap.set(lowerName, canonical);

    // Build a set of all variants for each name
    if (!nameToVariants.has(lowerName)) {
      nameToVariants.set(lowerName, new Set());
    }

    // Add all names in the group as variants
    group.forEach(variant => {
      nameToVariants.get(lowerName)!.add(variant.toLowerCase());
    });
  });
});

/**
 * Normalize a Swedish name to its canonical form
 * @param name The name to normalize
 * @returns The canonical form of the name, or the original if no normalization exists
 */
export function normalizeName(name: string): string {
  const lowerName = name.toLowerCase().trim();
  return normalizedNameMap.get(lowerName) || lowerName;
}

/**
 * Get all known variations of a Swedish name
 * @param name The name to get variations for
 * @returns Array of all known variations (including the original)
 */
export function getNameVariations(name: string): string[] {
  const lowerName = name.toLowerCase().trim();
  const variants = nameToVariants.get(lowerName);

  if (variants) {
    return Array.from(variants);
  }

  // If no variations found, check if this is a canonical form
  for (const [key, variantSet] of nameToVariants.entries()) {
    if (variantSet.has(lowerName)) {
      return Array.from(variantSet);
    }
  }

  // No variations found, return original
  return [lowerName];
}

/**
 * Generate SQL conditions for searching name variations in PostgreSQL
 * This creates an OR condition that searches for all variations of a name
 * @param name The name to search for
 * @param fields Array of database field names to search
 * @returns SQL-like string for use with Supabase or PostgREST
 */
export function generateNameSearchConditions(name: string, fields: string[]): string {
  const variations = getNameVariations(name);
  const conditions: string[] = [];

  variations.forEach(variant => {
    fields.forEach(field => {
      conditions.push(`${field}.ilike.%${variant}%`);
    });
  });

  return conditions.join(',');
}

/**
 * Check if two names are equivalent (considering variations)
 * @param name1 First name
 * @param name2 Second name
 * @returns true if names are equivalent
 */
export function areNamesEquivalent(name1: string, name2: string): boolean {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  return normalized1 === normalized2;
}

/**
 * Normalize a full name (handles multiple parts)
 * @param fullName The full name to normalize (e.g., "Carl Johan Andersson")
 * @returns Normalized full name
 */
export function normalizeFullName(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map(part => normalizeName(part))
    .join(' ');
}
