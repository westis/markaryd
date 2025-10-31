import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';

export async function GET() {
  try {
    // Get total count of persons
    const { count: totalPersons } = await supabase
      .from('persons')
      .select('*', { count: 'exact', head: true });

    // Get earliest birth date
    const { data: earliest } = await supabase
      .from('persons')
      .select('birth_date')
      .not('birth_date', 'is', null)
      .order('birth_date', { ascending: true })
      .limit(1)
      .single();

    // Get latest death date
    const { data: latestDeath } = await supabase
      .from('persons')
      .select('death_date')
      .not('death_date', 'is', null)
      .order('death_date', { ascending: false })
      .limit(1)
      .single();

    // Get latest birth date (for people potentially still living in records)
    const { data: latestBirth } = await supabase
      .from('persons')
      .select('birth_date')
      .not('birth_date', 'is', null)
      .order('birth_date', { ascending: false })
      .limit(1)
      .single();

    const earliestYear = earliest?.birth_date ? new Date(earliest.birth_date).getFullYear() : null;
    const latestDeathYear = latestDeath?.death_date ? new Date(latestDeath.death_date).getFullYear() : null;
    const latestBirthYear = latestBirth?.birth_date ? new Date(latestBirth.birth_date).getFullYear() : null;

    const latestYear = Math.max(latestDeathYear || 0, latestBirthYear || 0);

    return NextResponse.json({
      totalPersons: totalPersons || 0,
      dateRange: {
        earliest: earliestYear,
        latest: latestYear,
        earliestDate: earliest?.birth_date,
        latestDeathDate: latestDeath?.death_date,
        latestBirthDate: latestBirth?.birth_date,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
