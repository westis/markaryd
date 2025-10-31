# Markaryd Parish Registry - Setup Guide

## 🎉 Congratulations! Your Application is Built

This guide will help you get your Markaryd parish genealogical registry application up and running.

## What's Been Built

### ✅ Completed Features

1. **Next.js 15 with TypeScript** - Latest features including:
   - App Router architecture
   - Server Components
   - Optimized builds with Turbopack support

2. **Tailwind CSS 4** - Modern styling with:
   - CSS-first configuration (@import "tailwindcss")
   - Swedish theme colors (blue #0058a3 and yellow)
   - Responsive design system

3. **PostgreSQL Database** - Complete schema with:
   - 7 normalized tables
   - Full-text search (Swedish language support)
   - Relationships tracking
   - Optimized indexes

4. **API Routes** - RESTful endpoints:
   - `/api/persons` - Browse and filter persons
   - `/api/persons/[id]` - Person details
   - `/api/locations` - Browse locations
   - `/api/locations/[id]` - Location details
   - `/api/search` - Advanced full-text search

5. **UI Components**:
   - Navigation with mobile menu
   - SearchBar with live results
   - PersonCard for displaying persons
   - Footer with information

6. **Pages**:
   - **Homepage** (`/`) - Beautiful landing page with search
   - **Browse Persons** (`/personer`) - Paginated list with filters
   - **Person Detail** (`/personer/[id]`) - Complete person information
   - **Browse Locations** (`/platser`) - Alphabetical location list
   - **Location Detail** (`/platser/[id]`) - All persons at a location
   - **Search** (`/sok`) - Advanced search page

7. **Excel Import Script** - Automated data migration
8. **Responsive Design** - Works on mobile, tablet, and desktop

### 🔜 Future Enhancements (Optional)

- Family tree visualization with interactive diagrams
- GEDCOM export functionality
- PDF report generation
- Statistics dashboard

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL 14+** installed (or a Supabase account)
- The Excel file `Markarydsregistret_attskicka.xlsx` in the parent directory

---

## Step-by-Step Setup

### Step 1: Verify Installation

All dependencies are already installed. You can verify by running:

```bash
cd markaryd-registry
npm list --depth=0
```

### Step 2: Set Up Database

#### Option A: Local PostgreSQL

1. **Create Database**:
   ```bash
   psql -U postgres
   CREATE DATABASE markaryd_registry;
   \q
   ```

2. **Run Schema**:
   ```bash
   psql -U postgres -d markaryd_registry -f scripts/schema.sql
   ```

#### Option B: Supabase (Cloud Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** in the dashboard
4. Copy and paste the contents of `scripts/schema.sql`
5. Click **Run** to execute the schema
6. Go to **Settings** → **Database** to get your connection string

### Step 3: Configure Environment

1. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your database URL**:

   For local PostgreSQL:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/markaryd_registry
   ```

   For Supabase:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 4: Import Data

Make sure the Excel file is in the parent directory:

```
server/
├── markaryd/
│   ├── Markarydsregistret_attskicka.xlsx  ← File should be here
│   └── markaryd-registry/                  ← Your project
```

Then run the import:

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
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing the Application

### 1. Homepage
- Visit `http://localhost:3000`
- You should see the landing page with search bar
- Try the search bar (e.g., search for "Anders")

### 2. Browse Persons
- Click "Personer" in navigation
- Filter by gender, sort by name/date
- Click on any person card

### 3. Person Detail
- View complete person information
- See family relationships
- Check source citations

### 4. Locations
- Click "Platser" in navigation
- Browse alphabetically
- Click on any location

### 5. Search
- Click "Sök" or use the global search
- Try searching for:
  - Names: "Anders", "Maria"
  - Places: "Agghult", "Berg"
  - Occupations: "soldat", "piga"

---

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates an optimized production build.

### 2. Test Production Build Locally

```bash
npm start
```

Visit `http://localhost:3000` to test the production build.

---

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier Available)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd markaryd-registry
   vercel
   ```

3. **Add Environment Variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` with your connection string

4. **Redeploy** to apply environment variables

**Pros**: Free, automatic HTTPS, CDN, continuous deployment
**Cons**: Requires GitHub/GitLab account

### Option 2: Self-Hosted (VPS/Dedicated Server)

1. **Install Node.js** on your server

2. **Copy files** to server:
   ```bash
   scp -r markaryd-registry user@your-server.com:/var/www/
   ```

3. **Install dependencies** on server:
   ```bash
   cd /var/www/markaryd-registry
   npm ci --production
   npm run build
   ```

4. **Set up environment**:
   ```bash
   nano .env
   # Add DATABASE_URL
   ```

5. **Use PM2** to keep it running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "markaryd-registry" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx** as reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 3: Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t markaryd-registry .
docker run -p 3000:3000 -e DATABASE_URL="your_connection_string" markaryd-registry
```

---

## Database Maintenance

### Backup Database

```bash
# PostgreSQL
pg_dump -U postgres markaryd_registry > backup.sql

# Restore
psql -U postgres markaryd_registry < backup.sql
```

### Update Data

If you receive an updated Excel file:

```bash
npm run import
```

This will replace all existing data with the new data.

---

## Troubleshooting

### Issue: "DATABASE_URL environment variable is not set"

**Solution**: Make sure you created the `.env` file with your database connection string.

### Issue: Import script fails

**Solutions**:
1. Check that Excel file is in the correct location
2. Verify database connection works
3. Ensure database schema has been created

### Issue: Search not working

**Solution**: The database needs Swedish full-text search support. Check that PostgreSQL has the Swedish language pack installed.

### Issue: Pages show 404

**Solution**: Make sure the development server is running and you're accessing the correct URL.

---

## Performance Tips

1. **Database Indexes**: Already created in schema for optimal performance

2. **Caching**: Consider adding Redis for caching search results

3. **CDN**: Use Vercel or Cloudflare for static assets

4. **Database Connection Pooling**: Already configured with pg Pool

---

## Support and Customization

### Changing Colors

Edit `src/app/globals.css`:

```css
:root {
  --color-swedish-blue: #0058a3;  /* Change this */
  --color-swedish-yellow: #ffc72c; /* Change this */
}
```

### Adding New Fields

1. Update database schema in `scripts/schema.sql`
2. Update TypeScript types in `src/types/person.ts`
3. Update API routes to return new fields
4. Update UI components to display new fields

### Translations

The app is currently in Swedish. To add English:

1. Use `next-intl` or similar i18n library
2. Create translation files
3. Update all text strings

---

## Project Structure

```
markaryd-registry/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── personer/           # Person pages
│   │   ├── platser/            # Location pages
│   │   ├── sok/                # Search page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── Navigation.tsx
│   │   ├── SearchBar.tsx
│   │   ├── PersonCard.tsx
│   │   └── Footer.tsx
│   ├── lib/                    # Utilities
│   │   └── database.ts         # Database connection
│   └── types/                  # TypeScript types
│       └── person.ts
├── scripts/
│   ├── schema.sql              # Database schema
│   └── import-excel.ts         # Data import script
├── public/                     # Static files
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **SQL Injection**: All queries use parameterized statements (safe)
3. **HTTPS**: Always use HTTPS in production
4. **Database Access**: Restrict database access to application server only
5. **Rate Limiting**: Consider adding rate limiting for API routes

---

## Next Steps

Now that your application is running, you can:

1. ✅ Test all features thoroughly
2. ✅ Customize colors and branding
3. ✅ Deploy to production
4. ⬜ Add family tree visualization (optional)
5. ⬜ Add GEDCOM export (optional)
6. ⬜ Add user authentication for editors (optional)

---

## Congratulations! 🎉

You now have a fully functional genealogical registry application for Markaryd parish. The application is modern, responsive, and easy to use.

For questions or issues, refer to:
- Next.js documentation: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- PostgreSQL: https://www.postgresql.org/docs/
