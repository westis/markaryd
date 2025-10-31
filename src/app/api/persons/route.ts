import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { PaginatedResponse } from '@/types/person';
import { generateNameSearchConditions } from '@/lib/name-normalization';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Column-specific filters
    const filterFirstName = searchParams.get('filterFirstName') || '';
    const filterSurname = searchParams.get('filterSurname') || '';
    const filterBirthDate = searchParams.get('filterBirthDate') || '';
    const filterDeathDate = searchParams.get('filterDeathDate') || '';
    const filterOccupation = searchParams.get('filterOccupation') || '';
    const filterLocation = searchParams.get('filterLocation') || '';
    const filterMaritalStatus = searchParams.get('filterMaritalStatus') || '';
    const filterGender = searchParams.get('filterGender') || '';

    const offset = (page - 1) * limit;

    // Map sort fields to database columns
    const sortFieldMap: { [key: string]: string } = {
      'name': 'normalized_first_name',
      'birth_date': 'birth_date',
      'death_date': 'death_date',
      'location': 'residence_location_id',
    };

    const sortField = sortFieldMap[sortBy] || 'normalized_first_name';
    const ascending = sortOrder === 'asc';

    // Build query
    let query = supabase
      .from('persons')
      .select(`
        *,
        occupations!persons_occupation_id_fkey(title),
        locations!persons_residence_location_id_fkey(name),
        birth_location:locations!persons_birth_location_id_fkey(name),
        death_location:locations!persons_death_location_id_fkey(name)
      `, { count: 'exact' });

    // Apply global search filter (searches across all name fields with normalization)
    if (search) {
      const nameFields = ['first_name', 'normalized_first_name', 'patronymic', 'normalized_patronymic', 'surname', 'normalized_surname'];
      const searchConditions = generateNameSearchConditions(search, nameFields);
      query = query.or(searchConditions);
    }

    // Apply global gender filter (from filter panel)
    if (gender && (gender === 'M' || gender === 'K')) {
      query = query.eq('gender', gender);
    }

    // Apply column-specific filters (from table view) with name normalization
    if (filterFirstName) {
      const firstNameFields = ['first_name', 'normalized_first_name', 'patronymic', 'normalized_patronymic'];
      const firstNameConditions = generateNameSearchConditions(filterFirstName, firstNameFields);
      query = query.or(firstNameConditions);
    }

    if (filterSurname) {
      const surnameFields = ['surname', 'normalized_surname'];
      const surnameConditions = generateNameSearchConditions(filterSurname, surnameFields);
      query = query.or(surnameConditions);
    }

    if (filterBirthDate) {
      query = query.ilike('birth_date_text', `%${filterBirthDate}%`);
    }

    if (filterDeathDate) {
      query = query.ilike('death_date_text', `%${filterDeathDate}%`);
    }

    if (filterGender && (filterGender === 'M' || filterGender === 'K')) {
      query = query.eq('gender', filterGender);
    }

    if (filterMaritalStatus) {
      query = query.ilike('marital_status', `%${filterMaritalStatus}%`);
    }

    if (filterOccupation) {
      query = query.filter('occupations.title', 'ilike', `%${filterOccupation}%`);
    }

    if (filterLocation) {
      query = query.filter('locations.name', 'ilike', `%${filterLocation}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortField, { ascending })
      .range(offset, offset + limit - 1);

    const { data: persons, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch persons', details: error.message },
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
    console.error('API Error in /api/persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persons', details: String(error) },
      { status: 500 }
    );
  }
}
