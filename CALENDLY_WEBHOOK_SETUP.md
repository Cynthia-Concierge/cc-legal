# Calendly Webhook Integration - Setup Guide

## Overview

This system now tracks **full appointment details** from Calendly using webhooks, including:
- ✅ Appointment date/time
- ✅ Event ID
- ✅ Invitee details (name, email, phone)
- ✅ Cancellations and reschedules
- ✅ Questions/answers from booking form
- ✅ UTM parameters

---

## Quick Setup Checklist

- [ ] Run database migration
- [ ] Get Calendly API token
- [ ] Add environment variable
- [ ] Configure webhook in Calendly
- [ ] Test webhook
- [ ] Deploy to production

---

## 1. Run Database Migration

First, create the `calendly_appointments` table in your Supabase database:

```bash
# In Supabase SQL Editor, run:
/Users/rickybodner/Desktop/CClegal/migration_calendly_appointments.sql
```

This creates:
- `calendly_appointments` table with full appointment data
- Indexes for performance
- RLS policies for security

---

## 2. Get Calendly API Token

### Step 1: Log in to Calendly
Go to https://calendly.com and log in to your account.

### Step 2: Generate Personal Access Token
1. Go to **Integrations** → **API & Webhooks**
2. Or visit: https://calendly.com/integrations/api_webhooks
3. Click **"Get a token"** or **"Create a Personal Access Token"**
4. Give it a name (e.g., "Conscious Counsel Webhook")
5. Copy the token (starts with `eyJ...`)

**IMPORTANT**: Save this token securely - you won't be able to see it again!

### Step 3: Get Your Calendly User URI
You'll need your user URI for webhook setup. You can find it by:
1. Making a GET request to: `https://api.calendly.com/users/me`
2. With header: `Authorization: Bearer YOUR_TOKEN`
3. The response will contain your `uri` (e.g., `https://api.calendly.com/users/AAAAAAA...`)

---

## 3. Add Environment Variables

Add to your `.env` file:

```env
# Calendly API Token (for creating webhooks via API)
CALENDLY_API_TOKEN=eyJhbGc...your-token-here

# Calendly Webhook Signing Key (OPTIONAL - for signature verification)
# You'll get this when you create the webhook subscription
CALENDLY_WEBHOOK_SIGNING_KEY=your-signing-key-here
```

**Note**: The signing key is optional but recommended for production to verify webhook authenticity.

---

## 4. Configure Webhook in Calendly

You have two options to set up the webhook:

### Option A: Via Calendly API (Recommended)

Use this curl command (replace the values):

```bash
curl -X POST https://api.calendly.com/webhook_subscriptions \
  -H "Authorization: Bearer YOUR_CALENDLY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-production-domain.com/api/webhooks/calendly",
    "events": [
      "invitee.created",
      "invitee.canceled"
    ],
    "organization": "https://api.calendly.com/organizations/YOUR_ORG_ID",
    "user": "https://api.calendly.com/users/YOUR_USER_ID",
    "scope": "user"
  }'
```

**What to replace**:
- `YOUR_CALENDLY_API_TOKEN` - Your personal access token
- `your-production-domain.com` - Your production server URL
- `YOUR_ORG_ID` - Your Calendly organization ID (get from API)
- `YOUR_USER_ID` - Your Calendly user ID (get from `/users/me` endpoint)

**For local development**, use ngrok:
```bash
# Start ngrok
ngrok http 3001

# Use the ngrok URL in the webhook:
# https://abc123.ngrok.io/api/webhooks/calendly
```

### Option B: Via Calendly Dashboard

1. Go to https://calendly.com/integrations/api_webhooks
2. Click **"Create a Webhook"**
3. Enter your webhook URL:
   - Production: `https://your-domain.com/api/webhooks/calendly`
   - Development: `https://your-ngrok-url.ngrok.io/api/webhooks/calendly`
4. Select events to subscribe to:
   - ✅ `invitee.created` (when someone books)
   - ✅ `invitee.canceled` (when someone cancels)
5. Click **"Create Webhook"**
6. Copy the **Signing Key** and add it to your `.env` file

---

## 5. Test the Webhook

### Development Testing (with ngrok)

1. **Start your backend server**:
   ```bash
   npm run server
   # Should be running on http://localhost:3001
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 3001
   ```

3. **Configure webhook with ngrok URL** (see Option A above)

4. **Book a test appointment**:
   - Go to your Calendly booking page
   - Book an appointment
   - Check your server logs for:
     ```
     [Calendly Webhook] Received webhook event
     [CalendlyService] Processing webhook event: invitee.created
     [CalendlyService] ✅ Appointment created for user@example.com
     ```

5. **Verify in database**:
   ```sql
   SELECT * FROM calendly_appointments
   ORDER BY created_at DESC
   LIMIT 1;
   ```

6. **Test cancellation**:
   - Cancel the appointment in Calendly
   - Check logs and database for cancellation tracking

### Production Testing

After deploying to production:

1. Update webhook URL in Calendly to production domain
2. Book a real appointment
3. Verify in production database
4. Check production server logs

---

## 6. Webhook Event Types

The system handles these events:

### `invitee.created`
Triggered when someone books an appointment.

**What gets stored**:
- Event ID
- Appointment date/time
- Invitee details (name, email, phone)
- Location (Zoom link, etc.)
- Questions/answers
- UTM parameters
- Full raw payload

**Actions taken**:
- Creates record in `calendly_appointments` table
- Updates `contacts.calendly_booked_at` (legacy field)
- Updates `users.calendly_booked_at` (legacy field)

### `invitee.canceled`
Triggered when someone cancels an appointment.

**What gets updated**:
- Sets `status = 'canceled'`
- Records `canceled_at` timestamp
- Stores cancellation reason

---

## 7. API Endpoints

Your backend now has these endpoints:

### POST `/api/webhooks/calendly`
Receives webhooks from Calendly (internal use).

### GET `/api/appointments/:email`
Get all appointments for a specific email.

**Example**:
```bash
curl http://localhost:3001/api/appointments/user@example.com
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "calendly_event_id": "AAAAAAA...",
      "event_name": "Connection Call with Chad",
      "start_time": "2025-12-23T15:00:00Z",
      "end_time": "2025-12-23T15:30:00Z",
      "status": "active",
      "invitee_email": "user@example.com",
      "invitee_name": "John Doe",
      "invitee_phone": "+1234567890",
      "created_at": "2025-12-22T12:00:00Z"
    }
  ]
}
```

### GET `/api/appointments/upcoming?limit=50`
Get upcoming appointments (next 50 by default).

**Example**:
```bash
curl http://localhost:3001/api/appointments/upcoming?limit=10
```

---

## 8. Database Schema

### `calendly_appointments` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `calendly_event_id` | TEXT | Unique event ID from Calendly |
| `event_type` | TEXT | Webhook event type |
| `event_name` | TEXT | Name of the event type |
| `start_time` | TIMESTAMPTZ | Appointment start time |
| `end_time` | TIMESTAMPTZ | Appointment end time |
| `status` | TEXT | 'active' or 'canceled' |
| `location` | TEXT | Meeting location/link |
| `invitee_email` | TEXT | Invitee's email |
| `invitee_name` | TEXT | Invitee's name |
| `invitee_phone` | TEXT | Invitee's phone |
| `canceled_at` | TIMESTAMPTZ | When canceled |
| `cancellation_reason` | TEXT | Why canceled |
| `rescheduled_from_event_id` | TEXT | Original event if rescheduled |
| `questions_answers` | JSONB | Booking form responses |
| `utm_parameters` | JSONB | Tracking parameters |
| `raw_payload` | JSONB | Full webhook payload |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

## 9. Querying Appointments

### Get all booked appointments
```sql
SELECT
  invitee_email,
  invitee_name,
  start_time,
  status
FROM calendly_appointments
WHERE status = 'active'
ORDER BY start_time ASC;
```

### Get appointments by email
```sql
SELECT * FROM calendly_appointments
WHERE invitee_email = 'user@example.com'
ORDER BY start_time DESC;
```

### Get canceled appointments
```sql
SELECT
  invitee_email,
  canceled_at,
  cancellation_reason
FROM calendly_appointments
WHERE status = 'canceled'
ORDER BY canceled_at DESC;
```

### Get appointment count by date
```sql
SELECT
  DATE(start_time) as appointment_date,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled
FROM calendly_appointments
GROUP BY DATE(start_time)
ORDER BY appointment_date DESC;
```

### Extract phone numbers from questions
```sql
SELECT
  invitee_email,
  invitee_phone,
  questions_answers->0->>'answer' as phone_from_form
FROM calendly_appointments
WHERE questions_answers IS NOT NULL;
```

---

## 10. Troubleshooting

### Webhook not receiving events

1. **Check webhook is active in Calendly**:
   - Go to https://calendly.com/integrations/api_webhooks
   - Verify webhook is listed and active

2. **Check webhook URL is correct**:
   - Should be `https://your-domain.com/api/webhooks/calendly`
   - Must be HTTPS in production (HTTP only works with ngrok for dev)

3. **Check server logs**:
   ```bash
   npm run server
   # Look for: [Calendly Webhook] Received webhook event
   ```

4. **Test webhook manually**:
   ```bash
   curl -X POST http://localhost:3001/api/webhooks/calendly \
     -H "Content-Type: application/json" \
     -d '{"event": "invitee.created", "payload": {...}}'
   ```

### Signature verification failing

1. **Check signing key is correct**:
   - Get signing key from Calendly webhook settings
   - Add to `.env` as `CALENDLY_WEBHOOK_SIGNING_KEY`

2. **Restart server** after adding env var

3. **Disable signature verification for testing**:
   - Remove `CALENDLY_WEBHOOK_SIGNING_KEY` from `.env`
   - Webhook will still work but without verification

### Appointments not saving to database

1. **Check migration was run**:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_name = 'calendly_appointments'
   );
   ```

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'calendly_appointments';
   ```

3. **Check service role key is set**:
   - Backend needs `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS

---

## 11. Production Deployment

### Environment Variables for Production

Add these to your production environment (Firebase, Railway, Vercel, etc.):

```env
# Required
CALENDLY_API_TOKEN=eyJhbGc...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Recommended (for webhook signature verification)
CALENDLY_WEBHOOK_SIGNING_KEY=your-signing-key
```

### Update Webhook URL

After deploying, update your webhook URL in Calendly:

```bash
# Via API
curl -X PUT https://api.calendly.com/webhook_subscriptions/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-production-domain.com/api/webhooks/calendly"
  }'

# Or via Calendly dashboard
# Go to: https://calendly.com/integrations/api_webhooks
# Edit the webhook and update the URL
```

---

## 12. Backward Compatibility

The system maintains backward compatibility with the old tracking:

- ✅ Old browser-based `postMessage` tracking still works
- ✅ `contacts.calendly_booked_at` still gets updated
- ✅ `users.calendly_booked_at` still gets updated
- ✅ Admin dashboard "Booked a Call" metric still works

**New webhook system adds**:
- Full appointment details in `calendly_appointments` table
- Cancellation tracking
- Server-to-server reliability (no browser dependency)

---

## 13. Next Steps

After setup is complete:

1. **Monitor webhook events**:
   - Check server logs for webhook activity
   - Query `calendly_appointments` table regularly

2. **Add to admin dashboard** (optional):
   - Display upcoming appointments
   - Show cancellation rates
   - Track no-shows

3. **Integrate with email workflows** (optional):
   - Send confirmation emails
   - Send reminders before appointments
   - Send follow-ups after appointments

4. **Set up alerts** (optional):
   - Get notified when someone books
   - Alert when cancellation happens
   - Track appointment attendance

---

## Summary

You now have:
- ✅ Full appointment tracking with webhooks
- ✅ Database storage for all appointment details
- ✅ Cancellation and reschedule tracking
- ✅ API endpoints to query appointments
- ✅ Backward compatibility with existing system
- ✅ Production-ready webhook handling

**Key Benefit**: Your system now tracks appointments reliably via server-to-server webhooks instead of browser events, giving you complete visibility into your call booking funnel!
