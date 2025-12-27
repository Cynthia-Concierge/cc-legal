# Calendly Booking Tracking - Complete Implementation

## Overview
This system tracks when users book calls via Calendly from **anywhere** in the application (onboarding, dashboard, widgets, etc.) and stores this information in both the `contacts` and `users` tables.

## Database Migrations

### 1. Contacts Table Migration
Run `migration_add_calendly_booking_tracking.sql`:
- Adds `calendly_booked_at` column to `contacts` table
- Creates index for faster queries

### 2. Users Table Migration
Run `migration_add_calendly_booking_tracking_users.sql`:
- Adds `calendly_booked_at` column to `users` table
- Creates index for faster queries

## Where Bookings Are Tracked

### ✅ Onboarding Flow
- **Component**: `LawyerBookingCard.tsx`
- **Location**: Step 18 of onboarding
- **Tracking**: ✅ Implemented

### ✅ Dashboard (All Locations)
- **Component**: `CalendlyModal.tsx` (used globally)
- **Locations**:
  - Sidebar "Book Strategy Call" button
  - Dashboard home "Book Free Call" button
  - Widget "Book Strategy Call" buttons
  - Trademark page "Book Attorney Review Call"
  - Protection Journey "Book Legal Review Call"
  - And any other place using `CalendlyModal`
- **Tracking**: ✅ Implemented

## How It Works

1. **User books call** in any Calendly widget
2. **Calendly sends event** via `postMessage` API with event type `calendly.event_scheduled`
3. **Component detects event** and calls server endpoint
4. **Server updates both tables**:
   - Updates `contacts` table (by email)
   - Updates `users` table (by email, if user exists)
5. **Admin dashboard** shows count of booked calls

## Email Detection

The system tries multiple sources for the user's email:
1. **Authenticated user's email** (from Supabase auth) - Most reliable
2. **Calendly event payload** (fallback if user not logged in)

## Server Endpoint

**Endpoint**: `POST /api/contacts/update-calendly-booking`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Calendly booking status updated",
  "data": {
    "contact": { ... },  // Updated contact record (if found)
    "user": { ... }      // Updated user record (if found)
  }
}
```

**Behavior**:
- Updates `contacts` table by email
- Updates `users` table by email (if user exists)
- Returns success if at least one record is updated
- Returns 404 if neither contact nor user is found

## Admin Dashboard

The admin dashboard now shows:
- **"Booked a Call"** metric card (orange)
- Count of contacts who have `calendly_booked_at IS NOT NULL`
- Clicking the card filters contacts table to show only booked contacts
- Contacts table shows "Booked Call" column with status and date

## Querying Booked Calls

### Find all contacts who booked
```sql
SELECT * FROM contacts 
WHERE calendly_booked_at IS NOT NULL
ORDER BY calendly_booked_at DESC;
```

### Find all users who booked
```sql
SELECT * FROM users 
WHERE calendly_booked_at IS NOT NULL
ORDER BY calendly_booked_at DESC;
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

1. **Run both migrations** in Supabase SQL Editor
2. **Book a call** from any location:
   - Onboarding flow (Step 18)
   - Dashboard sidebar
   - Dashboard widgets
   - Any other Calendly widget
3. **Check database**:
   - `contacts.calendly_booked_at` should be set
   - `users.calendly_booked_at` should be set (if user exists)
4. **Check admin dashboard**:
   - "Booked a Call" count should increase
   - Clicking the card should filter to booked contacts

## Notes

- Tracking works for both authenticated users and contacts
- If a user doesn't exist in `users` table yet, only `contacts` is updated
- If a contact doesn't exist, only `users` is updated (if user exists)
- The system is resilient - if one update fails, the other still succeeds
- All tracking is "fire and forget" - doesn't block the user experience
