import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { EventDetailed } from '@/types/person';

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

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const eventTypes = searchParams.get('event_types')?.split(',').filter(Boolean);
    const personId = searchParams.get('person_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query
    let query = supabase
      .from('events')
      .select(`
        *,
        person:persons!events_person_id_fkey(
          id,
          first_name,
          patronymic,
          surname,
          normalized_first_name,
          normalized_patronymic,
          normalized_surname,
          birth_date,
          death_date,
          gender,
          occupation_id,
          occupations!persons_occupation_id_fkey(title)
        ),
        location:locations!events_location_id_fkey(
          id,
          name,
          type
        ),
        source:sources!events_source_id_fkey(
          id,
          source_type,
          source_citation,
          source_date
        )
      `)
      .eq('location_id', locationId);

    // Apply filters
    if (startDate) {
      query = query.gte('event_date', startDate);
    }
    if (endDate) {
      query = query.lte('event_date', endDate);
    }
    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }
    if (personId) {
      query = query.eq('person_id', parseInt(personId));
    }

    // Order by date (oldest first) and apply pagination
    query = query
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      console.error('Error fetching timeline events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch timeline events', details: eventsError.message },
        { status: 500 }
      );
    }

    // Get total count for pagination (without filters for now to keep it simple)
    const { count, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId);

    if (countError) {
      console.error('Error counting events:', countError);
    }

    // Transform the data to match EventDetailed interface
    const timelineEvents: EventDetailed[] = (events || []).map(event => ({
      ...event,
      person: event.person ? {
        ...event.person,
        occupation_title: event.person.occupations?.title || null,
      } : null,
    }));

    return NextResponse.json({
      events: timelineEvents,
      pagination: {
        offset,
        limit,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      },
      filters: {
        start_date: startDate,
        end_date: endDate,
        event_types: eventTypes,
        person_id: personId,
      },
    });
  } catch (error) {
    console.error('API Error in /api/locations/[id]/timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline', details: String(error) },
      { status: 500 }
    );
  }
}
