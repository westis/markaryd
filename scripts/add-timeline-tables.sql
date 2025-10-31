-- ============================================
-- TIMELINE FEATURE - NEW TABLES ONLY
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- Events table - ALL life events following GEDCOM standards
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id),
  event_type VARCHAR(50) NOT NULL,
  -- GEDCOM event types: BIRT, DEAT, MARR, BAPM, CHR, BURI, RESI, EMIG, IMMI,
  -- NATU, CENS, OCCU, GRAD, CONF, ORDN, etc.
  event_date DATE,
  event_date_text VARCHAR(50), -- Original text like "ca 1850" or "1850-00-00"
  source_id INTEGER REFERENCES sources(id),
  notes TEXT,
  confidence_level VARCHAR(20) DEFAULT 'confirmed', -- confirmed, inferred, estimated, unknown
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_person ON events(person_id);
CREATE INDEX idx_events_location ON events(location_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_location_date ON events(location_id, event_date);

-- Person location periods (for tracking residence over time)
CREATE TABLE IF NOT EXISTS person_location_periods (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  start_date DATE,
  start_date_text VARCHAR(50),
  end_date DATE,
  end_date_text VARCHAR(50),
  period_type VARCHAR(50) NOT NULL, -- residence, military_service, employment, etc.
  inferred BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_periods_person ON person_location_periods(person_id);
CREATE INDEX idx_periods_location ON person_location_periods(location_id);
CREATE INDEX idx_periods_dates ON person_location_periods(start_date, end_date);
CREATE INDEX idx_periods_location_dates ON person_location_periods(location_id, start_date, end_date);

-- Relationship suggestions (auto-parsed from Excel text fields)
CREATE TABLE IF NOT EXISTS relationship_suggestions (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  suggested_relative_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- father, mother, spouse, child
  suggested_name VARCHAR(500),
  source_text TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suggestions_person ON relationship_suggestions(person_id);
CREATE INDEX idx_suggestions_relative ON relationship_suggestions(suggested_relative_id);
CREATE INDEX idx_suggestions_status ON relationship_suggestions(status);
CREATE INDEX idx_suggestions_type ON relationship_suggestions(relationship_type);

-- Comments
COMMENT ON TABLE events IS 'All life events following GEDCOM standards (birth, death, marriage, baptism, residence, etc.)';
COMMENT ON TABLE person_location_periods IS 'Time-bounded location associations (residence periods, etc.)';
COMMENT ON TABLE relationship_suggestions IS 'Auto-parsed family relationship suggestions for review';
