import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { Person } from '@/types/person';

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Construct the query date
    let queryDate: string;
    if (year) {
      queryDate = `${year}-01-01`;
    } else if (startDate && endDate) {
      // For date ranges, we'll use a different approach below
      queryDate = startDate;
    } else {
      return NextResponse.json(
        { error: 'Please provide either "year" or both "start_date" and "end_date"' },
        { status: 400 }
      );
    }

    // Query strategy: Find all persons who have events or periods at this location
    // and were alive during the specified time

    // Method 1: Use person_location_periods table if available
    const { data: periods, error: periodsError } = await supabase
      .from('person_location_periods')
      .select(`
        person_id,
        start_date,
        end_date,
        period_type,
        persons!person_location_periods_person_id_fkey(
          *,
          occupations!persons_occupation_id_fkey(title)
        )
      `)
      .eq('location_id', locationId);

    let residents: Person[] = [];

    if (!periodsError && periods && periods.length > 0) {
      // Filter periods that overlap with the query date/range
      residents = periods
        .filter(period => {
          // Person was at location during this time if:
          // 1. Period start is before or on query date (or null)
          // 2. Period end is after or on query date (or null)
          const periodStart = period.start_date ? new Date(period.start_date) : null;
          const periodEnd = period.end_date ? new Date(period.end_date) : null;
          const query = new Date(queryDate);

          const startOk = !periodStart || periodStart <= query;
          const endOk = !periodEnd || periodEnd >= query;

          return startOk && endOk && period.period_type === 'residence';
        })
        .map(period => ({
          ...period.persons,
          occupation_title: period.persons?.occupations?.title || null,
        }))
        .filter((person, index, self) =>
          // Deduplicate by person ID
          index === self.findIndex(p => p.id === person.id)
        );
    } else {
      // Fallback: Use events table to find residents
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          person_id,
          event_date,
          event_type,
          persons!events_person_id_fkey(
            *,
            occupations!persons_occupation_id_fkey(title)
          )
        `)
        .eq('location_id', locationId)
        .in('event_type', ['BIRT', 'RESI', 'DEAT'])
        .not('event_date', 'is', null);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return NextResponse.json(
          { error: 'Failed to fetch residents', details: eventsError.message },
          { status: 500 }
        );
      }

      // Group events by person
      const personEventsMap = new Map<number, any[]>();
      (events || []).forEach(event => {
        if (!personEventsMap.has(event.person_id)) {
          personEventsMap.set(event.person_id, []);
        }
        personEventsMap.get(event.person_id)!.push(event);
      });

      // Filter persons who were at this location during the query date
      const query = new Date(queryDate);
      residents = Array.from(personEventsMap.entries())
        .filter(([personId, personEvents]) => {
          // Find residence or birth/death events (GEDCOM codes)
          const residenceStart = personEvents.find(e => e.event_type === 'RESI' || e.event_type === 'BIRT');
          const residenceEnd = personEvents.find(e => e.event_type === 'RESI' || e.event_type === 'DEAT');

          const startDate = residenceStart ? new Date(residenceStart.event_date) : null;
          const endDate = residenceEnd ? new Date(residenceEnd.event_date) : null;

          const startOk = !startDate || startDate <= query;
          const endOk = !endDate || endDate >= query;

          return startOk && endOk;
        })
        .map(([personId, personEvents]) => {
          const person = personEvents[0].persons;
          return {
            ...person,
            occupation_title: person?.occupations?.title || null,
          };
        });
    }

    // Alternative method: Simple query for persons alive during the year
    // who have any connection to this location
    if (residents.length === 0) {
      // Fallback to simple query: anyone with birth/residence/death at this location
      // who was alive during the query year
      const yearNum = parseInt(year || queryDate.substring(0, 4));

      const { data: simplePersons, error: simpleError } = await supabase
        .from('persons')
        .select(`
          *,
          occupations!persons_occupation_id_fkey(title)
        `)
        .or(`residence_location_id.eq.${locationId},birth_location_id.eq.${locationId},death_location_id.eq.${locationId}`)
        .or(`birth_date.is.null,birth_date.lte.${yearNum}-12-31`)
        .or(`death_date.is.null,death_date.gte.${yearNum}-01-01`);

      if (!simpleError && simplePersons) {
        residents = simplePersons.map(person => ({
          ...person,
          occupation_title: person.occupations?.title || null,
        }));
      }
    }

    // Sort residents by name
    residents.sort((a, b) => {
      const nameA = a.normalized_first_name || a.first_name || '';
      const nameB = b.normalized_first_name || b.first_name || '';
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({
      residents,
      query: {
        location_id: locationId,
        year: year || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
      count: residents.length,
    });
  } catch (error) {
    console.error('API Error in /api/locations/[id]/residents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch residents', details: String(error) },
      { status: 500 }
    );
  }
}
