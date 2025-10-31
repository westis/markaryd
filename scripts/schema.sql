-- Markaryd Parish Registry Database Schema
-- PostgreSQL Database

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS relationship_suggestions CASCADE;
DROP TABLE IF EXISTS person_location_periods CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS person_sources CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS researchers CASCADE;
DROP TABLE IF EXISTS occupations CASCADE;

-- Researchers table
CREATE TABLE researchers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Source types and citations
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(100) NOT NULL, -- FVD, Soldatregistret, etc.
  source_type_spec VARCHAR(255), -- Specification
  source_citation TEXT NOT NULL, -- The actual source citation
  source_date DATE, -- Date of the source document
  researcher_id INTEGER REFERENCES researchers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on source_type for faster filtering
CREATE INDEX idx_sources_type ON sources(source_type);
CREATE INDEX idx_sources_date ON sources(source_date);

-- Locations with hierarchical structure
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- address, by, parish, län, etc.
  parent_id INTEGER REFERENCES locations(id), -- For hierarchical structure
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, type)
);

-- Create index for location searches
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_type ON locations(type);

-- Occupations/Titles
CREATE TABLE occupations (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  normalized_title VARCHAR(255), -- Standardized version
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_occupations_title ON occupations(title);

-- Main persons table
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,

  -- Record identifiers
  record_number VARCHAR(50), -- "Nr" from Excel
  post_number VARCHAR(50), -- "Post nr." from Excel

  -- Personal information
  gender CHAR(1), -- M or K
  marital_status VARCHAR(50), -- gift, änk., barn, ogift, etc.

  -- Names (all variants)
  first_name VARCHAR(255),
  patronymic VARCHAR(255),
  surname VARCHAR(255),
  previous_surname VARCHAR(255),
  normalized_first_name VARCHAR(255),
  normalized_patronymic VARCHAR(255),
  normalized_surname VARCHAR(255),

  -- Occupation
  occupation_id INTEGER REFERENCES occupations(id),

  -- Vital dates (stored as DATE, with partial date support via text)
  birth_date DATE,
  birth_date_text VARCHAR(50), -- Original text like "1699-00-00" or "ca 1699"
  death_date DATE,
  death_date_text VARCHAR(50),
  marital_status_change_date DATE,

  -- Age at death
  age_years INTEGER,
  age_months INTEGER,
  age_weeks INTEGER,
  age_days INTEGER,

  -- Locations (foreign keys)
  birth_location_id INTEGER REFERENCES locations(id),
  residence_location_id INTEGER REFERENCES locations(id),
  death_location_id INTEGER REFERENCES locations(id),
  birth_parish VARCHAR(255), -- "Födelsefsg/-län/-landskap"
  death_parish VARCHAR(255), -- "Dödförsamling"

  -- Family information (text fields from original)
  household_head VARCHAR(255), -- "Hushållsföreståndare"
  relative_info TEXT, -- "Anhörig (make/maka om inte annat anges)"
  children_info TEXT, -- "Barn/arvinge"

  -- Comments and extra information
  comment TEXT,
  extra_text TEXT,
  tax_record_comment TEXT, -- "Kommentar (om mantalslängd/jordebok: husfader)"

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_persons_first_name ON persons(normalized_first_name);
CREATE INDEX idx_persons_patronymic ON persons(normalized_patronymic);
CREATE INDEX idx_persons_surname ON persons(normalized_surname);
CREATE INDEX idx_persons_gender ON persons(gender);
CREATE INDEX idx_persons_birth_date ON persons(birth_date);
CREATE INDEX idx_persons_death_date ON persons(death_date);
CREATE INDEX idx_persons_residence ON persons(residence_location_id);
CREATE INDEX idx_persons_occupation ON persons(occupation_id);

-- Full-text search index (Swedish language support)
CREATE INDEX idx_persons_fulltext ON persons USING GIN(
  to_tsvector('swedish',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(patronymic, '') || ' ' ||
    COALESCE(surname, '') || ' ' ||
    COALESCE(normalized_first_name, '') || ' ' ||
    COALESCE(comment, '') || ' ' ||
    COALESCE(extra_text, '')
  )
);

-- Many-to-many relationship between persons and sources
CREATE TABLE person_sources (
  person_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
  source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
  source_order INTEGER DEFAULT 1, -- 1-6 for the six source fields
  PRIMARY KEY (person_id, source_id, source_order)
);

CREATE INDEX idx_person_sources_person ON person_sources(person_id);
CREATE INDEX idx_person_sources_source ON person_sources(source_id);

-- Relationships between persons (parent-child, spouse, etc.)
CREATE TABLE relationships (
  id SERIAL PRIMARY KEY,
  person1_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
  person2_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'father', 'mother', 'spouse', 'child'
  notes TEXT, -- Any additional information
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(person1_id, person2_id, relationship_type)
);

CREATE INDEX idx_relationships_person1 ON relationships(person1_id);
CREATE INDEX idx_relationships_person2 ON relationships(person2_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- Events table for timeline functionality
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id),
  event_type VARCHAR(50) NOT NULL, -- birth, death, residence_start, residence_end, marriage, baptism, etc.
  event_date DATE,
  event_date_text VARCHAR(50), -- Original text like "ca 1850" or "1850-00-00"
  source_id INTEGER REFERENCES sources(id),
  notes TEXT, -- Additional information about the event
  confidence_level VARCHAR(20) DEFAULT 'confirmed', -- confirmed, inferred, estimated, unknown
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for timeline queries
CREATE INDEX idx_events_person ON events(person_id);
CREATE INDEX idx_events_location ON events(location_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_date ON events(event_date);
-- Composite index for location timeline queries (most common query)
CREATE INDEX idx_events_location_date ON events(location_id, event_date);

-- Person location periods for tracking residence over time
CREATE TABLE person_location_periods (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  start_date DATE,
  start_date_text VARCHAR(50), -- Original text representation
  end_date DATE,
  end_date_text VARCHAR(50),
  period_type VARCHAR(50) NOT NULL, -- birth, residence, death
  inferred BOOLEAN DEFAULT false, -- true if auto-calculated, false if confirmed
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for period queries
CREATE INDEX idx_periods_person ON person_location_periods(person_id);
CREATE INDEX idx_periods_location ON person_location_periods(location_id);
CREATE INDEX idx_periods_dates ON person_location_periods(start_date, end_date);
CREATE INDEX idx_periods_location_dates ON person_location_periods(location_id, start_date, end_date);

-- Relationship suggestions from auto-parsing Excel text fields
CREATE TABLE relationship_suggestions (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  suggested_relative_id INTEGER REFERENCES persons(id) ON DELETE CASCADE, -- NULL if no match found
  relationship_type VARCHAR(50) NOT NULL, -- father, mother, spouse, child
  suggested_name VARCHAR(500), -- The name extracted from Excel text
  source_text TEXT, -- Original Excel text that this suggestion came from
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0, how confident the match is
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  reviewed_by VARCHAR(255), -- Researcher who reviewed this
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for suggestions queries
CREATE INDEX idx_suggestions_person ON relationship_suggestions(person_id);
CREATE INDEX idx_suggestions_relative ON relationship_suggestions(suggested_relative_id);
CREATE INDEX idx_suggestions_status ON relationship_suggestions(status);
CREATE INDEX idx_suggestions_type ON relationship_suggestions(relationship_type);

-- Helper function to parse partial dates from text like "1699-00-00"
CREATE OR REPLACE FUNCTION parse_partial_date(date_text VARCHAR)
RETURNS DATE AS $$
BEGIN
  -- Try to parse the date, return NULL for unparseable dates
  IF date_text IS NULL OR date_text = '' THEN
    RETURN NULL;
  END IF;

  -- Remove circa notation
  date_text := REPLACE(date_text, ' (ca)', '');
  date_text := REPLACE(date_text, 'ca ', '');
  date_text := TRIM(date_text);

  -- Replace 00 with 01 for parsing (we'll store original in text field)
  IF date_text ~ '^\d{4}-00-00$' THEN
    -- Year only
    RETURN (SUBSTRING(date_text, 1, 4) || '-01-01')::DATE;
  ELSIF date_text ~ '^\d{4}-\d{2}-00$' THEN
    -- Year and month
    RETURN (SUBSTRING(date_text, 1, 7) || '-01')::DATE;
  ELSE
    -- Try to parse as-is
    BEGIN
      RETURN date_text::DATE;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for easy person querying with all related data
CREATE OR REPLACE VIEW persons_detailed AS
SELECT
  p.*,
  o.title as occupation_title,
  bl.name as birth_location_name,
  rl.name as residence_location_name,
  dl.name as death_location_name,
  r.name as researcher_name,
  -- Count of sources
  (SELECT COUNT(*) FROM person_sources ps WHERE ps.person_id = p.id) as source_count
FROM persons p
LEFT JOIN occupations o ON p.occupation_id = o.id
LEFT JOIN locations bl ON p.birth_location_id = bl.id
LEFT JOIN locations rl ON p.residence_location_id = rl.id
LEFT JOIN locations dl ON p.death_location_id = dl.id
LEFT JOIN person_sources ps1 ON ps1.person_id = p.id AND ps1.source_order = 1
LEFT JOIN sources s1 ON s1.id = ps1.source_id
LEFT JOIN researchers r ON s1.researcher_id = r.id;

-- View for family relationships
CREATE OR REPLACE VIEW family_tree AS
SELECT
  p.id as person_id,
  p.first_name || ' ' || COALESCE(p.patronymic, '') || ' ' || COALESCE(p.surname, '') as person_name,
  p.birth_date,
  p.death_date,
  -- Father
  (SELECT p2.id FROM persons p2
   JOIN relationships r ON r.person2_id = p2.id
   WHERE r.person1_id = p.id AND r.relationship_type = 'father' LIMIT 1) as father_id,
  (SELECT p2.first_name || ' ' || COALESCE(p2.patronymic, '') FROM persons p2
   JOIN relationships r ON r.person2_id = p2.id
   WHERE r.person1_id = p.id AND r.relationship_type = 'father' LIMIT 1) as father_name,
  -- Mother
  (SELECT p2.id FROM persons p2
   JOIN relationships r ON r.person2_id = p2.id
   WHERE r.person1_id = p.id AND r.relationship_type = 'mother' LIMIT 1) as mother_id,
  (SELECT p2.first_name || ' ' || COALESCE(p2.patronymic, '') FROM persons p2
   JOIN relationships r ON r.person2_id = p2.id
   WHERE r.person1_id = p.id AND r.relationship_type = 'mother' LIMIT 1) as mother_name,
  -- Children count
  (SELECT COUNT(*) FROM relationships r
   WHERE r.person2_id = p.id AND r.relationship_type IN ('father', 'mother')) as children_count
FROM persons p;

-- Insert default/unknown researcher
INSERT INTO researchers (name) VALUES ('Okänd forskare');

COMMENT ON TABLE persons IS 'Main table containing all person records from Markaryd parish';
COMMENT ON TABLE locations IS 'Hierarchical location data (addresses, villages, parishes)';
COMMENT ON TABLE relationships IS 'Family relationships between persons';
COMMENT ON TABLE sources IS 'Source citations and documents';
COMMENT ON TABLE researchers IS 'Researchers who contributed data';
COMMENT ON TABLE events IS 'Timeline events (births, deaths, marriages, etc.) for place-based history';
COMMENT ON TABLE person_location_periods IS 'Time-bounded associations between persons and locations';
COMMENT ON TABLE relationship_suggestions IS 'Auto-parsed relationship suggestions from Excel text fields for researcher review';
