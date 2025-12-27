# Calendly Booking Tracking Setup

## Overview
This feature tracks when users book a call via Calendly during the onboarding flow and stores this information in the `contacts` table.

## Database Changes

### Migration: `migration_add_calendly_booking_tracking.sql`

Run this SQL in your Supabase SQL Editor to add the tracking column:

```sql
-- Add calendly_booked_at column (timestamp - NULL if not booked, has value if booked)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS calendly_booked_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_calendly_booked_at ON contacts(calendly_booked_at) 
WHERE calendly_booked_at IS NOT NULL;
```

## How It Works

1. **User schedules call** in Calendly widget during onboarding (Step 18)
2. **Calendly sends event** via `postMessage` API with event type `calendly.event_scheduled`
3. **Component detects event** and calls server endpoint
4. **Server updates contact** record with `calendly_booked_at` timestamp
5. **User is redirected** to password creation step (Step 19)

## Code Changes

### Frontend: `LawyerBookingCard.tsx`
- Listens for `calendly.event_scheduled` event
- Calls `/api/contacts/update-calendly-booking` endpoint when appointment is scheduled
- Passes user's email to the endpoint

### Backend: `server/index.ts`
- New endpoint: `POST /api/contacts/update-calendly-booking`
- Updates `calendly_booked_at` timestamp in contacts table
- Uses service role key to bypass RLS (allows updating by email even if user_id not set yet)

## Querying Booked Contacts

### Find all contacts who booked a call
```sql
SELECT * FROM contacts 
WHERE calendly_booked_at IS NOT NULL
ORDER BY calendly_booked_at DESC;
```

### Find contacts who haven't booked yet
```sql
SELECT * FROM contacts 
WHERE calendly_booked_at IS NULL;
```

### Count bookings by date
```sql
SELECT 
  DATE(calendly_booked_at) as booking_date,
  COUNT(*) as bookings
FROM contacts
WHERE calendly_booked_at IS NOT NULL
GROUP BY DATE(calendly_booked_at)
ORDER BY booking_date DESC;
```

## Testing

1. **Run the migration** in Supabase SQL Editor
2. **Go through onboarding** to Step 18 (Lawyer Booking)
3. **Schedule a call** in the Calendly widget
4. **Check contacts table** - `calendly_booked_at` should be set to current timestamp
5. **Verify redirect** - Should automatically go to Step 19 (Password Creation)

## Notes

- The timestamp is set when the appointment is scheduled, not when the call actually happens
- If a user books multiple times, the timestamp will be updated to the most recent booking
- The endpoint uses service role key to bypass RLS, allowing updates even if user_id isn't set yet
- If contact doesn't exist, the endpoint returns 404 (this shouldn't happen in normal flow)
