# Supabase Setup Checklist

## ✅ Step-by-Step Setup

### 1. Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section
4. Select **URI** format
5. Copy the string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xyzabcdefg.supabase.co:5432/postgres
   ```
6. Note your actual password (you set this when creating the project)

### 2. Update .env.local

Edit `markaryd-registry/.env.local`:

```bash
notepad .env.local
```

Replace the placeholders with your actual values:
```env
DATABASE_URL=postgresql://postgres:YourActualPassword@db.yourprojectref.supabase.co:5432/postgres
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Create Database Tables

**Option A: Supabase Dashboard (Recommended)**

1. In Supabase, click **SQL Editor**
2. Click **New Query**
3. Open `markaryd-registry/scripts/schema.sql` in a text editor
4. Copy ALL the content (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **Run** or press Ctrl+Enter
7. Wait for "Success. No rows returned"

**Option B: Command Line (if you have psql installed)**

```bash
psql 'your-connection-string-here' -f scripts/schema.sql
```

### 4. Verify Tables Were Created

In Supabase dashboard:
1. Click **Table Editor** in sidebar
2. You should see 7 tables:
   - ✓ persons
   - ✓ locations
   - ✓ sources
   - ✓ researchers
   - ✓ occupations
   - ✓ relationships
   - ✓ person_sources

### 5. Import Excel Data

From the `markaryd-registry` directory:

```bash
npm run import
```

You should see:
```
🚀 Starting Excel import...
📁 Reading Excel file
📊 Found 1,041 rows
👥 Importing persons...
   Progress: 1,041/1,041 (100%)
✅ Import complete!

📈 Statistics:
   Persons:     1,041
   Researchers: 7
   Locations:   89
   Occupations: 63
   Sources:     ~900
   Errors:      0
```

This takes about 1-2 minutes.

### 6. Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 7. Test Your Application

1. **Homepage**: Should load with search bar
2. **Search**: Type "Anders" in search bar
3. **Personer**: Click to browse all 1,041 persons
4. **Platser**: Click to see all locations
5. **Person Detail**: Click any person card to see full details

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solution**: Make sure you saved the `.env.local` file with your actual connection string.

### Error: "relation 'persons' does not exist"

**Solution**: The schema wasn't created. Go back to Step 3 and run the SQL in Supabase.

### Error: "password authentication failed"

**Solution**:
1. Check your password in `.env.local`
2. In Supabase, go to Settings → Database → Database Settings
3. Click "Reset Database Password" if needed
4. Update `.env.local` with the new password

### Import shows many errors

**Solution**:
1. Make sure the schema was created successfully
2. Check that your `.env.local` connection string is correct
3. Verify the Excel file is at: `C:\Users\westi\Documents\server\markaryd\Markarydsregistret_attskicka.xlsx`

### Can't connect to database

**Solution**:
1. Check your internet connection
2. Verify the Supabase project is not paused
3. Check the connection string format in `.env.local`

---

## Quick Commands Reference

```bash
# Import data
npm run import

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Verify Import Success

In Supabase:
1. Go to **Table Editor**
2. Click on **persons** table
3. You should see 1,041 rows
4. Click on **locations** table
5. You should see ~89 locations

---

## Next Steps After Import

1. ✅ Browse persons at http://localhost:3000/personer
2. ✅ Search for ancestors
3. ✅ Explore locations at http://localhost:3000/platser
4. ✅ Test the search functionality
5. 🚀 Deploy to production when ready (see SETUP_GUIDE.md)

---

**Need more help?** See `QUICK_START.md` or `SETUP_GUIDE.md` for detailed instructions.
