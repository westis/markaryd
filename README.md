# Markaryd Parish Genealogical Registry

A modern web application for exploring the genealogical records of Markaryd parish, particularly for the years when the church records (kyrkoböcker) were lost in fire.

## Features

- **Person Search**: Search by name, occupation, location, and more
- **Family Views**: Explore family trees and relationships
- **Location Browser**: Browse by village, address, and parish
- **Timeline**: View historical events chronologically
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Swedish Language Support**: Full Swedish text search and localization

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL
- **Data**: 1,041 persons from source materials (1572-2023)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Supabase account)

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set up Database

#### Option A: Local PostgreSQL

1. Install PostgreSQL if not already installed
2. Create a new database:

\`\`\`bash
psql -U postgres
CREATE DATABASE markaryd_registry;
\\q
\`\`\`

3. Run the schema:

\`\`\`bash
psql -U postgres -d markaryd_registry -f scripts/schema.sql
\`\`\`

#### Option B: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and paste the contents of \`scripts/schema.sql\`
3. Run the SQL script

### 3. Configure Environment

1. Copy \`.env.example\` to \`.env\`:

\`\`\`bash
cp .env.example .env
\`\`\`

2. Edit \`.env\` and add your database connection string:

\`\`\`
# For local PostgreSQL:
DATABASE_URL=postgresql://postgres:password@localhost:5432/markaryd_registry

# For Supabase:
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
\`\`\`

### 4. Import Data

Make sure the Excel file \`Markarydsregistret_attskicka.xlsx\` is in the parent directory, then run:

\`\`\`bash
npm run import
\`\`\`

This will import all 1,041 person records into the database.

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run import\` - Import Excel data into database

## Database Schema

### Main Tables

- **persons**: All person records with biographical data
- **locations**: Hierarchical location data (villages, parishes, counties)
- **sources**: Source citations and documents
- **researchers**: Researchers who contributed data
- **occupations**: Historical occupations and titles
- **relationships**: Family relationships (parent-child, spouse)

### Views

- **persons_detailed**: Persons with all related data joined
- **family_tree**: Hierarchical family relationships

## Project Structure

\`\`\`
markaryd-registry/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions and database
│   │   └── database.ts   # PostgreSQL connection and queries
│   └── types/            # TypeScript type definitions
├── scripts/
│   ├── schema.sql        # Database schema
│   └── import-excel.ts   # Excel import script
├── public/               # Static assets
└── package.json
\`\`\`

## Future Enhancements

- [ ] Family tree visualization
- [ ] GEDCOM export
- [ ] Advanced search filters
- [ ] Statistics dashboard
- [ ] PDF report generation
- [ ] Multi-language support (English)

## Contributing

This is a genealogical research project for Markaryd parish. Contributions and corrections are welcome.

## License

This project is for educational and research purposes.
