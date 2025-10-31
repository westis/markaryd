import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    // Build location query
    let locationQuery = supabase
      .from('locations')
      .select('*');

    if (type) {
      locationQuery = locationQuery.eq('type', type);
    }

    if (search) {
      locationQuery = locationQuery.ilike('name', `%${search}%`);
    }

    const { data: locations, error: locError } = await locationQuery
      .order('type')
      .order('name');

    if (locError) {
      console.error('Supabase error fetching locations:', locError);
      return NextResponse.json(
        { error: 'Failed to fetch locations', details: locError.message },
        { status: 500 }
      );
    }

    // Fetch all persons with their location associations
    const { data: persons, error: persError } = await supabase
      .from('persons')
      .select('id, residence_location_id, birth_location_id, death_location_id');

    if (persError) {
      console.error('Supabase error fetching persons:', persError);
      return NextResponse.json(
        { error: 'Failed to fetch persons', details: persError.message },
        { status: 500 }
      );
    }

    // Count unique persons per location using Sets to avoid duplicates
    const locationPersonCount = new Map<number, Set<number>>();

    (persons || []).forEach(person => {
      // Add person to residence location
      if (person.residence_location_id) {
        if (!locationPersonCount.has(person.residence_location_id)) {
          locationPersonCount.set(person.residence_location_id, new Set());
        }
        locationPersonCount.get(person.residence_location_id)!.add(person.id);
      }

      // Add person to birth location
      if (person.birth_location_id) {
        if (!locationPersonCount.has(person.birth_location_id)) {
          locationPersonCount.set(person.birth_location_id, new Set());
        }
        locationPersonCount.get(person.birth_location_id)!.add(person.id);
      }

      // Add person to death location
      if (person.death_location_id) {
        if (!locationPersonCount.has(person.death_location_id)) {
          locationPersonCount.set(person.death_location_id, new Set());
        }
        locationPersonCount.get(person.death_location_id)!.add(person.id);
      }
    });

    // Merge location data with person counts
    const locationsWithCount = (locations || []).map(location => ({
      ...location,
      person_count: locationPersonCount.get(location.id)?.size || 0,
    }));

    return NextResponse.json(locationsWithCount);
  } catch (error) {
    console.error('API Error in /api/locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: String(error) },
      { status: 500 }
    );
  }
}
