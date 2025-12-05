# Fix: Production API URL Error

## Problem

In production, the frontend was trying to connect to `http://localhost:3001` instead of using Firebase Hosting rewrites, causing:
- `ERR_CONNECTION_REFUSED` errors
- `502 Bad Gateway` errors
- Workflow config fetch failures

## Root Cause

The API URL logic was incorrect:
```typescript
// ❌ WRONG - defaults to localhost:3001 in production
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "" : "http://localhost:3001");
```

## Solution

Changed to use empty string (relative URLs) which works for both:
- **Development**: Vite proxy handles `/api/*` → `localhost:3001`
- **Production**: Firebase Hosting rewrites `/api/*` → Firebase Function

```typescript
// ✅ CORRECT - uses relative URLs
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  ""; // Empty string uses Firebase Hosting rewrites in production, Vite proxy in dev
```

## Files Fixed

1. ✅ `src/components/WorkflowVisualization.tsx`
2. ✅ `src/components/NodeDetailModal.tsx`
3. ✅ `src/pages/WebsiteRedesign.tsx`

## Files Already Correct

- ✅ `src/pages/LeadScraper.tsx` - Already using empty string
- ✅ `src/components/DatabaseTables.tsx` - Already using empty string
- ✅ `src/components/VoiceWidget.tsx` - Already using empty string
- ✅ `src/pages/BusinessWidget.tsx` - Already using empty string

## Deployment Steps

### Step 1: Build Frontend

```bash
npm run build
```

### Step 2: Deploy to Firebase

```bash
firebase deploy --only hosting
```

Or deploy everything:

```bash
firebase deploy
```

## How It Works

### Development (Local)
- Vite dev server runs on `localhost:5173`
- Vite proxy rewrites `/api/*` → `http://localhost:3001/api/*`
- Empty string `API_BASE_URL` = relative URLs work via proxy

### Production (Firebase)
- Frontend served from Firebase Hosting
- Firebase Hosting rewrites `/api/*` → Firebase Function `api`
- Empty string `API_BASE_URL` = relative URLs work via rewrite

## Testing After Deployment

1. **Check production site**: https://free.consciouscounsel.ca
2. **Try running a workflow** - should connect to API successfully
3. **Check browser console** - no more `ERR_CONNECTION_REFUSED` errors
4. **Verify API calls** - should go to `/api/*` (relative URLs)

## Summary

- ✅ **Fixed**: API URL logic in 3 files
- ⚠️ **Needs Deployment**: Frontend build + Firebase Hosting deploy
- 🎯 **Result**: Production will use Firebase Hosting rewrites correctly

