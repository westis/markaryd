import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { PaginatedResponse } from '@/types/person';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    if (!q || q.length < 2) {
      return NextResponse.json({
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
    }

    const offset = (page - 1) * limit;

    // Search across name fields
    const searchPattern = `%${q}%`;

    // Map sort fields to database columns
    const sortFieldMap: { [key: string]: string } = {
      'name': 'normalized_first_name',
      'gender': 'gender',
      'birth_date': 'birth_date',
      'death_date': 'death_date',
      'occupation': 'occupation_id',
      'location': 'residence_location_id',
    };

    const sortField = sortFieldMap[sortBy] || 'normalized_first_name';
    const ascending = sortOrder === 'asc';

    // Get total count
    const { count } = await supabase
      .from('persons')
      .select('*', { count: 'exact', head: true })
      .or(`normalized_first_name.ilike.${searchPattern},normalized_patronymic.ilike.${searchPattern},normalized_surname.ilike.${searchPattern},first_name.ilike.${searchPattern},patronymic.ilike.${searchPattern}`);

    // Get persons with related data
    const { data: persons, error } = await supabase
      .from('persons')
      .select(`
        *,
        occupations!persons_occupation_id_fkey(title),
        locations!persons_residence_location_id_fkey(name),
        birth_location:locations!persons_birth_location_id_fkey(name),
        death_location:locations!persons_death_location_id_fkey(name)
      `)
      .or(`normalized_first_name.ilike.${searchPattern},normalized_patronymic.ilike.${searchPattern},normalized_surname.ilike.${searchPattern},first_name.ilike.${searchPattern},patronymic.ilike.${searchPattern}`)
      .order(sortField, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Search failed', details: error.message },
        { status: 500 }
      );
    }

    // Format the data
    const formattedPersons = persons?.map(p => ({
      ...p,
      occupation_title: p.occupations?.title || null,
      residence_location_name: p.locations?.name || null,
      birth_location_name: p.birth_location?.name || null,
      death_location_name: p.death_location?.name || null,
    })) || [];

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<any> = {
      data: formattedPersons,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error in /api/search:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}
