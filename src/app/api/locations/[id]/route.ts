import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { Location, Person } from '@/types/person';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const locationId = parseInt(id);

    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Get persons at this location - need to query separately for each location type
    // and then merge results to handle OR condition
    const [residenceResult, birthResult, deathResult] = await Promise.all([
      supabase
        .from('persons')
        .select(`
          *,
          occupations!persons_occupation_id_fkey(title)
        `)
        .eq('residence_location_id', locationId),
      supabase
        .from('persons')
        .select(`
          *,
          occupations!persons_occupation_id_fkey(title)
        `)
        .eq('birth_location_id', locationId),
      supabase
        .from('persons')
        .select(`
          *,
          occupations!persons_occupation_id_fkey(title)
        `)
        .eq('death_location_id', locationId),
    ]);

    // Merge and deduplicate persons by ID
    const personsMap = new Map<number, Person>();

    [residenceResult.data, birthResult.data, deathResult.data].forEach(resultData => {
      (resultData || []).forEach(person => {
        if (!personsMap.has(person.id)) {
          personsMap.set(person.id, {
            ...person,
            occupation_title: person.occupations?.title || null,
          });
        }
      });
    });

    // Sort persons by name and birth date
    const persons = Array.from(personsMap.values()).sort((a, b) => {
      const nameCompare = (a.normalized_first_name || '').localeCompare(b.normalized_first_name || '');
      if (nameCompare !== 0) return nameCompare;
      return (a.birth_date || '').localeCompare(b.birth_date || '');
    });

    return NextResponse.json({
      location,
      persons,
    });
  } catch (error) {
    console.error('API Error in /api/locations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location details', details: String(error) },
      { status: 500 }
    );
  }
}
