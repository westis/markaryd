import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-database';
import type { PersonDetailed } from '@/types/person';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id);

    if (isNaN(personId)) {
      return NextResponse.json(
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }

    // Get person with all related data
    const { data: person, error: personError } = await supabase
      .from('persons')
      .select(`
        *,
        occupations!persons_occupation_id_fkey(title),
        residence_location:locations!persons_residence_location_id_fkey(name),
        birth_location:locations!persons_birth_location_id_fkey(name),
        death_location:locations!persons_death_location_id_fkey(name)
      `)
      .eq('id', personId)
      .single();

    if (personError || !person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    // Format the person data
    const formattedPerson: PersonDetailed = {
      ...person,
      occupation_title: person.occupations?.title || null,
      residence_location_name: person.residence_location?.name || null,
      birth_location_name: person.birth_location?.name || null,
      death_location_name: person.death_location?.name || null,
      sources: [],
      relationships: [],
    };

    // Get sources for this person
    const { data: personSources, error: sourcesError } = await supabase
      .from('person_sources')
      .select(`
        source_order,
        sources(
          *,
          researchers(name)
        )
      `)
      .eq('person_id', personId)
      .order('source_order');

    if (!sourcesError && personSources) {
      formattedPerson.sources = personSources.map((ps) => ({
        ...ps.sources,
        researcher_name: ps.sources.researchers?.name || null,
        source_order: ps.source_order,
      }));
    }

    // Get relationships (we need to manually construct this since Supabase doesn't support complex CASE statements easily)
    const { data: relationships1, error: rel1Error } = await supabase
      .from('relationships')
      .select(`
        *,
        related_person:persons!relationships_person2_id_fkey(*)
      `)
      .eq('person1_id', personId);

    const { data: relationships2, error: rel2Error } = await supabase
      .from('relationships')
      .select(`
        *,
        related_person:persons!relationships_person1_id_fkey(*)
      `)
      .eq('person2_id', personId);

    const allRelationships = [
      ...(relationships1 || []),
      ...(relationships2 || []),
    ];

    // Sort by relationship type priority
    const typeOrder: { [key: string]: number } = {
      father: 1,
      mother: 2,
      spouse: 3,
      child: 4,
    };

    formattedPerson.relationships = allRelationships.sort((a, b) => {
      const aOrder = typeOrder[a.relationship_type] || 999;
      const bOrder = typeOrder[b.relationship_type] || 999;
      return aOrder - bOrder;
    });

    return NextResponse.json(formattedPerson);
  } catch (error) {
    console.error('API Error in /api/persons/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person details' },
      { status: 500 }
    );
  }
}
