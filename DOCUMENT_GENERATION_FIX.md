# Document Generation "Fail to Fetch" Fix

## Problem
When clicking "Personalize Now" to generate documents, users were getting a "Fail to Fetch" error on both local and production environments.

## Root Causes Identified

### 1. Missing Environment Variable (Local Development)
**File:** `.env`
**Issue:** The `VITE_SERVER_URL` was commented out, causing the frontend to try fetching from an empty URL.
**Fix:** Uncommented and set to `http://localhost:3001`

### 2. Environment-Specific Configuration
**Issue:** No separation between local and production environment variables.
**Fix:** Created two new files:
- `.env.development.local` - Sets `VITE_SERVER_URL=http://localhost:3001` for local dev
- `.env.production.local` - Sets `VITE_SERVER_URL=` (empty) for production (Firebase Functions)

### 3. Supabase Client Initialization Timing (Server)
**File:** `server/services/calendlyService.ts`
**Issue:** The service was creating a Supabase client at the module level (top of file), before `dotenv.config()` could load environment variables.
**Fix:** Converted to lazy initialization pattern using `getSupabaseAdmin()` function.

## Changes Made

### 1. Environment Configuration
- Modified `.env` to uncomment `VITE_SERVER_URL=http://localhost:3001`
- Created `.env.development.local` with local backend URL
- Created `.env.production.local` with empty server URL (for same-domain API)

### 2. Server Code Fix
**File:** `server/services/calendlyService.ts`
**Changes:**
```typescript
// Before (initialized at module load):
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// After (lazy initialization):
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseAdmin;
}
```

All usages of `supabaseAdmin` updated to `getSupabaseAdmin()`.

## Testing Locally

1. **Start the backend server:**
   ```bash
   npm run dev:backend
   ```
   You should see:
   ```
   🚀 Server running on http://localhost:3001
   📋 Health check: http://localhost:3001/health
   ```

2. **Start the frontend (in a separate terminal):**
   ```bash
   npm run dev:frontend
   ```

3. **Test document generation:**
   - Log into your app
   - Navigate to the dashboard/vault
   - Click "Personalize Now" on any missing document
   - Document should generate and download successfully

## Production Deployment

For production, the setup is already correct:

1. **Firebase Hosting Configuration:**
   - `/api/**` routes are rewritten to Firebase Functions (see `firebase.json`)
   - Frontend calls API on the same domain
   - No separate server URL needed

2. **Environment Variables:**
   - `.env.production.local` sets `VITE_SERVER_URL=` (empty string)
   - This ensures API calls go to the same domain in production

3. **Deploy to Firebase:**
   ```bash
   npm run build
   firebase deploy
   ```

## Architecture Notes

### Local Development
- **Frontend:** Vite dev server (http://localhost:5173)
- **Backend:** Express server (http://localhost:3001)
- **API Calls:** Frontend → `http://localhost:3001/api/...`

### Production (Firebase)
- **Frontend:** Firebase Hosting
- **Backend:** Firebase Functions
- **API Calls:** Frontend → `/api/...` (rewritten to Functions by Firebase Hosting)

## Verification Checklist

- [x] Backend server starts without errors
- [x] Environment variables load correctly
- [x] Health endpoint responds: `curl http://localhost:3001/health`
- [ ] Frontend can generate documents by clicking "Personalize Now"
- [ ] PDFs are downloaded successfully
- [ ] Documents appear in vault after generation

## Additional Notes

1. **Puppeteer Dependency:** The document generation uses Puppeteer to convert HTML templates to PDF. Ensure all required system dependencies are installed if deploying to a new environment.

2. **Template Files:** HTML templates are located in `server/templates/html/`. These are used for the 18 free customizable documents.

3. **Firebase Functions:** The same Express routes are wrapped in Firebase Functions (see `functions/src/index.ts`) for production deployment.
