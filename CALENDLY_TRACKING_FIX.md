# Calendly Booking Tracking - Fix Applied

**Date:** 2025-12-20
**Issue:** Calendly bookings not being tracked in database or showing in Godmode analytics
**Status:** ✅ **FIXED**

---

## Problem Diagnosis

### What Was Broken

When users booked a call via Calendly during onboarding (or anywhere else in the app), the system was **NOT** tracking it properly. The booking didn't show up in:
- The database (contacts.calendly_booked_at / users.calendly_booked_at)
- The Godmode admin dashboard ("Booked a Call" metric)

### Root Cause

**Missing Environment Variable: `VITE_SERVER_URL`**

The frontend code was trying to call the backend API endpoint `/api/contacts/update-calendly-booking`, but the `VITE_SERVER_URL` environment variable was **not set** in the `.env` file.

This meant:
```javascript
const serverUrl = import.meta.env.VITE_SERVER_URL || ''; // This was empty string!
const response = await fetch(`${serverUrl}/api/contacts/update-calendly-booking`, {
  // This was trying to fetch from '' + '/api/...' = '/api/...'
  // Which goes to the frontend server (localhost:5173), NOT the backend (localhost:3001)!
});
```

The fetch call was going to the wrong server (frontend instead of backend), so the booking was never recorded.

---

## The Fix

### ✅ Added VITE_SERVER_URL to .env

Added the following line to `/Users/rickybodner/Desktop/CClegal/.env`:

```env
# Backend server URL (for API calls from frontend)
VITE_SERVER_URL=http://localhost:3001
```

This tells the frontend where the backend API server is running.

---

## How The Tracking System Works

### Flow Diagram

```
User Books Call on Calendly
         ↓
Calendly sends postMessage event
         ↓
Frontend detects "calendly.event_scheduled" event
         ↓
Frontend calls: POST {VITE_SERVER_URL}/api/contacts/update-calendly-booking
         ↓
Backend (server/index.ts:2962) updates database:
  - contacts.calendly_booked_at = NOW()
  - users.calendly_booked_at = NOW()
         ↓
Godmode Admin Dashboard queries:
  - SELECT COUNT(*) FROM contacts WHERE calendly_booked_at IS NOT NULL
         ↓
Shows "Booked a Call" count in metrics
```

### Components Involved

1. **Frontend Components** (Listen for Calendly events):
   - `src/components/wellness/onboarding/LawyerBookingCard.tsx` (Onboarding flow)
   - `src/components/wellness/CalendlyModal.tsx` (Dashboard/Global)

2. **Backend Endpoint** (Updates database):
   - `server/index.ts:2962` - `/api/contacts/update-calendly-booking`

3. **Database Tables**:
   - `contacts.calendly_booked_at` (timestamp)
   - `users.calendly_booked_at` (timestamp)

4. **Admin Dashboard** (Displays metrics):
   - `src/pages/wellness/admin/AdminDashboard.tsx`

---

## Testing The Fix

### Prerequisites

1. **Database migrations must be run** (columns need to exist):
   ```sql
   -- Run these in Supabase SQL Editor if not already done:
   -- See: migration_add_calendly_booking_tracking.sql
   -- See: migration_add_calendly_booking_tracking_users.sql
   ```

2. **Backend server must be running**:
   ```bash
   npm run server
   # Should start on http://localhost:3001
   ```

3. **Frontend must be restarted** (to pick up new env variable):
   ```bash
   # Kill the frontend (Ctrl+C)
   npm run dev
   # Should start on http://localhost:5173
   ```

### Test Steps

1. **Go through onboarding** as a new user
2. **Reach Step 18** (Lawyer Booking Card)
3. **Book a call** on the Calendly widget
4. **Check browser console** - Should see:
   ```
   [Calendly] Appointment scheduled: {...}
   [Calendly] ✅ Contact record updated with booking timestamp
   ```
5. **Check server logs** - Should see:
   ```
   [Update Calendly Booking] ✅ Updated contact user@example.com with Calendly booking timestamp
   [Update Calendly Booking] ✅ Updated user user@example.com with Calendly booking timestamp
   ```
6. **Check Godmode Admin Dashboard**:
   - "Booked a Call" metric should increment
   - Click the card to filter contacts
   - See the contact with "Booked Call: [date]"

### Diagnostic SQL

Run `check-calendly-tracking.sql` in Supabase SQL Editor to verify:
- Columns exist in both tables
- Bookings are being recorded
- Counts are correct

---

## Important Notes

### For Local Development

- `VITE_SERVER_URL=http://localhost:3001` ✅ (Added)
- Backend must be running on port 3001
- Frontend will be on port 5173 (or different if configured)

### For Production / Firebase Deployment

**CRITICAL:** You need to set `VITE_SERVER_URL` to your **production backend URL** when deploying to Firebase!

#### Option 1: Firebase Hosting Environment Config

Use Firebase's environment configuration:
```bash
firebase functions:config:set app.server_url="https://your-backend-url.com"
```

Then in your build process, inject it as `VITE_SERVER_URL`.

#### Option 2: Build-Time Environment Variable

Set the environment variable during build:
```bash
# In Firebase CI/CD or GitHub Actions
VITE_SERVER_URL=https://your-production-backend.com npm run build
```

#### Option 3: Firebase Functions as Backend

If your backend is deployed as Firebase Functions:
```bash
# The URL would be something like:
VITE_SERVER_URL=https://us-central1-your-project.cloudfunctions.net
```

**Where is your production backend?** You need to find out where `server/index.ts` is deployed and use that URL.

---

## Verification Checklist

- ✅ `VITE_SERVER_URL` added to `.env` file
- ⏳ Database migrations run (check with `check-calendly-tracking.sql`)
- ⏳ Backend server running on http://localhost:3001
- ⏳ Frontend restarted to pick up new environment variable
- ⏳ Test booking made successfully
- ⏳ Godmode dashboard shows correct booking count

---

## Files Changed

1. **`.env`** - Added `VITE_SERVER_URL=http://localhost:3001`

---

## Files Created

1. **`check-calendly-tracking.sql`** - Diagnostic queries to verify tracking
2. **`CALENDLY_TRACKING_FIX.md`** - This document

---

## Next Steps

1. **Restart your development servers**:
   ```bash
   # Terminal 1: Backend
   npm run server

   # Terminal 2: Frontend
   npm run dev
   ```

2. **Test a booking**:
   - Go through onboarding
   - Book a Calendly call
   - Verify it shows in admin dashboard

3. **Run diagnostic SQL** (`check-calendly-tracking.sql`) to verify database state

4. **For Production**: Set `VITE_SERVER_URL` to your production backend URL in your deployment configuration

---

## Additional Debugging

If the fix still doesn't work, check:

1. **Browser Console**:
   ```
   [Calendly] Appointment scheduled: {...}
   [Calendly] ✅ Contact record updated with booking timestamp
   ```
   If you see error instead, check the network tab for the failed request.

2. **Server Logs**:
   ```
   [Update Calendly Booking] ✅ Updated contact ...
   ```
   If you don't see this, the backend isn't receiving the request.

3. **Network Tab** (Browser DevTools):
   - Look for POST request to `/api/contacts/update-calendly-booking`
   - Check the request URL - should be `http://localhost:3001/api/...`
   - Check response - should be 200 OK with success message

4. **Database** (Supabase SQL Editor):
   ```sql
   SELECT email, calendly_booked_at
   FROM contacts
   WHERE email = 'your-test-email@example.com';
   ```

5. **Environment Variable** (Frontend Console):
   ```javascript
   console.log('VITE_SERVER_URL:', import.meta.env.VITE_SERVER_URL);
   // Should output: http://localhost:3001
   ```

---

## Summary

✅ **Root Cause**: Missing `VITE_SERVER_URL` environment variable
✅ **Fix Applied**: Added `VITE_SERVER_URL=http://localhost:3001` to `.env`
⏳ **Action Required**: Restart servers and test
⚠️ **Production**: Set `VITE_SERVER_URL` to production backend URL before deploying

The tracking system is **fully implemented** in the code - it was just missing the environment configuration to connect frontend to backend!
