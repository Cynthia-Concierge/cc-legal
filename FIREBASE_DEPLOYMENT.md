# Firebase Deployment Guide

This project is configured for Firebase Hosting (frontend) and Firebase Functions (backend API).

## Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase project (if not already done):
   ```bash
   firebase init
   ```
   - Select: Hosting and Functions
   - Use existing project or create new one
   - Project ID: `cc-legal` (or your project ID)
   - Follow prompts for configuration

## Project Structure

- **Frontend**: Built with Vite, output to `dist/` directory
- **Backend**: Express server in `server/` directory
- **Firebase Functions**: Wrapper in `functions/` directory

## Setup Steps

### 1. Install Dependencies

```bash
# Root dependencies (frontend)
npm install

# Functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Environment Variables

**For Local Development:**
Create `.env` file in the root directory:
```
FIRECRAWL_API_KEY=your-firecrawl-api-key
OPENAI_API_KEY=your-openai-api-key
INSTANTLY_AI_API_KEY=your-instantly-api-key (optional)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key (optional)
GEMINI_API_KEY=your-gemini-api-key (optional)
USE_AUTOGEN=true (optional, defaults to true)
```

**For Firebase Functions (Production):**

The project is now connected to Firebase project `cc-legal`. You have two options:

**Option 1: Firebase Secrets (Recommended - Modern Approach)**

Secrets are automatically available as environment variables. This is the recommended approach:

```bash
# Set secrets (you'll be prompted to enter the values securely)
firebase functions:secrets:set FIRECRAWL_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_ANON_KEY
firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
firebase functions:secrets:set INSTANTLY_AI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
```

After setting secrets, update your function to use them:
```bash
# Edit functions/src/index.ts and add secrets to the function definition
# Then deploy: firebase deploy --only functions
```

**Option 2: Legacy Config (Deprecated - Works until March 2026)**

⚠️ **Warning:** This method is deprecated and will stop working in March 2026. Migrate to secrets when possible.

```bash
# Using Firebase Functions config (legacy)
firebase functions:config:set \
  firecrawl.api_key="your-firecrawl-api-key" \
  openai.api_key="your-openai-api-key" \
  supabase.url="your-supabase-url" \
  supabase.anon_key="your-supabase-anon-key" \
  supabase.service_role_key="your-supabase-service-role-key" \
  instantly.api_key="your-instantly-api-key" \
  gemini.api_key="your-gemini-api-key" \
  autogen.use="true"
```

**Note:** The current implementation supports both methods for backward compatibility. Secrets take precedence over legacy config if both are set.

### 3. Build Frontend

```bash
npm run build
```

This creates the `dist/` directory with static files for Firebase Hosting.

### 4. Build Functions

```bash
cd functions
npm run build
cd ..
```

### 5. Deploy

Deploy everything:
```bash
firebase deploy
```

Deploy only hosting:
```bash
firebase deploy --only hosting
```

Deploy only functions:
```bash
firebase deploy --only functions
```

## Development

### Local Development

For local development, you can run the Express server directly:

```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:backend
```

Or use the combined dev command:
```bash
npm run dev
```

### Firebase Emulators

To test Firebase Functions locally:

```bash
firebase emulators:start
```

This starts:
- Firebase Hosting emulator (frontend)
- Firebase Functions emulator (backend API)

Access:
- Frontend: http://localhost:5000
- Functions: http://localhost:5001

## API Endpoints

Once deployed, API endpoints will be available at:
- Production: `https://your-project.web.app/api/*`
- Functions URL: `https://your-region-your-project.cloudfunctions.net/api/*`

Firebase Hosting automatically rewrites `/api/*` requests to the Firebase Function.

## Important Notes

1. **Server Integration**: The Firebase Functions wrapper in `functions/src/index.ts` now properly integrates with the Express server from `server/` using dynamic ES module imports. The functions will lazily initialize routes on first request.

2. **Environment Variables**: Make sure all required environment variables are set in Firebase Functions configuration using `firebase functions:config:set` or `firebase functions:secrets:set`.

3. **Route Coverage**: The current implementation includes the most critical routes (`/api/scrape-and-analyze`, `/api/cold-leads`, `/api/save-contact`). Additional routes from `server/index.ts` can be added to `functions/src/index.ts` as needed.

3. **Function Timeout**: Firebase Functions have a default timeout of 60 seconds (can be increased to 540 seconds for 2nd gen functions). Long-running workflows may need optimization.

4. **Cold Starts**: Firebase Functions may experience cold starts. Consider using:
   - Function warm-up strategies
   - Minimum instances (paid feature)
   - Regional deployment for better performance

## Troubleshooting

### Functions not deploying
- Check that `functions/lib/index.js` exists after building
- Verify TypeScript compilation: `cd functions && npm run build`

### API routes returning 404
- Verify `firebase.json` has correct rewrite rules
- Check that functions are deployed: `firebase functions:list`

### Environment variables not working
- Use `firebase functions:config:get` to verify config
- For secrets, use `firebase functions:secrets:access SECRET_NAME`

### Build errors
- Ensure all dependencies are installed in both root and functions directories
- Check Node.js version matches (should be 20)

## Next Steps

1. ✅ Firebase project connected (`cc-legal`)
2. ✅ Firebase Functions implementation completed
3. Set up environment variables (see step 2 above)
4. Test locally with Firebase emulators: `firebase emulators:start`
5. Deploy to Firebase: `firebase deploy`
6. Verify API endpoints are working at your Firebase Hosting URL

## Current Status

- ✅ Project connected to Firebase (`cc-legal`)
- ✅ Firebase Functions wrapper implemented
- ✅ Basic API routes integrated
- ⏳ Environment variables need to be configured
- ⏳ Ready for deployment after environment setup

