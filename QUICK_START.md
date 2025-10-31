# Quick Start Guide

Get your Markaryd Parish Registry running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed (or Supabase account)
- Excel file `Markarydsregistret_attskicka.xlsx` in parent directory

## Steps

### 1. Set Up Database

**PostgreSQL:**
```bash
psql -U postgres
CREATE DATABASE markaryd_registry;
\q
psql -U postgres -d markaryd_registry -f scripts/schema.sql
```

**OR Supabase:**
- Create account at supabase.com
- Create new project
- Run `scripts/schema.sql` in SQL Editor

### 2. Configure Environment

```bash
cp .env.example .env
nano .env  # Add your DATABASE_URL
```

Example:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/markaryd_registry
```

### 3. Import Data

```bash
npm run import
```

Wait for "✅ Import complete!"

### 4. Start Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

## Test It

1. Search for "Anders" in the search bar
2. Click "Personer" to browse all persons
3. Click any person to see their details
4. Click "Platser" to browse locations
5. Try advanced search at "/sok"

## Deploy (Optional)

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
```

Add `DATABASE_URL` in Vercel dashboard.

### Build for Production
```bash
npm run build
npm start
```

---

**Need help?** See `SETUP_GUIDE.md` for detailed instructions.

**Everything working?** Your genealogical registry is ready! 🎉
