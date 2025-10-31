import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { LocationStats } from '@/types/person';

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

    // Fetch all events for this location
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_type, event_date')
      .eq('location_id', locationId)
      .not('event_date', 'is', null)
      .order('event_date');

    if (eventsError) {
      console.error('Error fetching events for stats:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: eventsError.message },
        { status: 500 }
      );
    }

    // Initialize statistics
    const stats: LocationStats = {
      total_events: events?.length || 0,
      births: 0,
      deaths: 0,
      marriages: 0,
      births_by_decade: {},
      deaths_by_decade: {},
      population_by_year: {},
    };

    if (!events || events.length === 0) {
      return NextResponse.json(stats);
    }

    // Count event types and organize by decade (using GEDCOM codes)
    events.forEach(event => {
      // Count by type
      if (event.event_type === 'BIRT') {
        stats.births++;
      } else if (event.event_type === 'DEAT') {
        stats.deaths++;
      } else if (event.event_type === 'MARR') {
        stats.marriages++;
      }

      // Organize by decade
      if (event.event_date) {
        const year = new Date(event.event_date).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        const decadeKey = `${decade}s`;

        if (event.event_type === 'BIRT') {
          stats.births_by_decade[decadeKey] = (stats.births_by_decade[decadeKey] || 0) + 1;
        } else if (event.event_type === 'DEAT') {
          stats.deaths_by_decade[decadeKey] = (stats.deaths_by_decade[decadeKey] || 0) + 1;
        }
      }
    });

    // Calculate population estimates by year
    // This is a simplified calculation: births add to population, deaths subtract
    // Start from the earliest event year to the latest
    if (events.length > 0) {
      const firstYear = new Date(events[0].event_date!).getFullYear();
      const lastYear = new Date(events[events.length - 1].event_date!).getFullYear();

      let population = 0;
      const yearlyEvents: { [year: number]: { births: number; deaths: number } } = {};

      // Group events by year
      events.forEach(event => {
        const year = new Date(event.event_date!).getFullYear();
        if (!yearlyEvents[year]) {
          yearlyEvents[year] = { births: 0, deaths: 0 };
        }

        if (event.event_type === 'BIRT') {
          yearlyEvents[year].births++;
        } else if (event.event_type === 'DEAT') {
          yearlyEvents[year].deaths++;
        }
      });

      // Calculate cumulative population for each year
      for (let year = firstYear; year <= lastYear; year++) {
        if (yearlyEvents[year]) {
          population += yearlyEvents[year].births;
          population -= yearlyEvents[year].deaths;
        }
        // Only record years with events or significant population
        if (yearlyEvents[year] || population > 0) {
          stats.population_by_year[year] = Math.max(0, population);
        }
      }
    }

    // Sort the decades for easier consumption
    const sortedBirthsByDecade: { [decade: string]: number } = {};
    Object.keys(stats.births_by_decade)
      .sort()
      .forEach(decade => {
        sortedBirthsByDecade[decade] = stats.births_by_decade[decade];
      });
    stats.births_by_decade = sortedBirthsByDecade;

    const sortedDeathsByDecade: { [decade: string]: number } = {};
    Object.keys(stats.deaths_by_decade)
      .sort()
      .forEach(decade => {
        sortedDeathsByDecade[decade] = stats.deaths_by_decade[decade];
      });
    stats.deaths_by_decade = sortedDeathsByDecade;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('API Error in /api/locations/[id]/stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: String(error) },
      { status: 500 }
    );
  }
}
