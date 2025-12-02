# Quick Fix for 500 Error

## The Problem
Your request is going to `http://localhost:5173/api/save-contact` but the Firebase Functions emulator isn't running, or the proxy isn't configured correctly.

## Solution

### Step 1: Stop Everything
Press `Ctrl+C` in ALL terminal windows running dev servers.

### Step 2: Kill All Processes
```bash
pkill -f "firebase.*emulator"
pkill -f "vite"
pkill -f "tsx.*server"
```

### Step 3: Make Sure Functions Are Built
```bash
cd functions
npm run build
cd ..
```

### Step 4: Start Dev Server (This Will Start Firebase Emulators)
```bash
npm run dev
```

This should:
1. Kill old processes
2. Start Firebase emulators on port 5001
3. Start Vite on port 5173 (which proxies `/api/*` to Firebase Functions)

### Step 5: Verify It's Working

1. **Check Firebase Emulator UI**: http://localhost:4000
2. **Check Functions Health**: http://localhost:5001/cc-legal/us-central1/api/health
3. **Check Debug Endpoint**: http://localhost:5001/cc-legal/us-central1/api/debug/env
   - Should show: `"usingKeyType": "service_role"`

### Step 6: Test the Form
Submit the form - it should work now!

## If It Still Doesn't Work

Check the Firebase emulator logs in the terminal. You should see:
```
[Firebase Functions] Using Supabase key type: service_role
[Save Contact] Request received: ...
```

If you see errors about missing environment variables, make sure your `.env` file has:
```
SUPABASE_URL=https://pwwdihmajwbhrjmfathm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Alternative: Use Express Server Instead

If you prefer to use the Express server (not Firebase emulators), you can run:
```bash
npm run dev:frontend  # In one terminal
npm run dev:backend  # In another terminal
```

But you'll need to update `vite.config.ts` to proxy to `http://localhost:3001` instead.

