# Vercel Deployment Guide

## Vercel Configuration Settings

When deploying to Vercel, use these settings:

### Basic Settings:
- **Framework Preset:** Vite (should auto-detect)
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `dist` (default)
- **Install Command:** `npm install` (default)

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `FIRECRAWL_API_KEY` - Your Firecrawl API key
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional (if using these features):**
- `INSTANTLY_AI_API_KEY` - Instantly.ai API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Important Notes:

1. **API Routes:** The Express server has been converted to Vercel Serverless Functions in the `api/` directory
2. **Function Timeout:** API functions are set to 300 seconds (5 minutes) max duration for long-running workflows
3. **Frontend:** The Vite frontend will be built and served as static files
4. **API Proxy:** In production, the frontend will call `/api/*` routes which are handled by Vercel Serverless Functions

### Deployment Steps:

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will auto-detect Vite framework
4. Add all environment variables
5. Deploy!

### Testing After Deployment:

- Frontend: `https://your-project.vercel.app`
- API Health: `https://your-project.vercel.app/api/health`
- API Endpoint: `https://your-project.vercel.app/api/scrape-and-analyze`

### Troubleshooting:

- If API routes return 404, check that `api/` directory is in the root
- If functions timeout, increase `maxDuration` in `vercel.json`
- Check Vercel function logs for detailed error messages

