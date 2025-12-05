# Meta Pixel Conversions API Setup

This guide explains how to set up the Meta (Facebook) Pixel Conversions API to track lead events when users submit the landing page form.

## What's Been Set Up

1. **Meta Service** (`server/services/metaService.ts`): Handles sending conversion events to Meta's Conversions API
2. **API Endpoint** (`/api/track-meta-lead`): Server endpoint that receives form data and sends it to Meta
3. **Frontend Integration**: The landing page form now automatically sends lead events to Meta when submitted

## Configuration

### For Local Development

Add these environment variables to your `.env` file in the root directory:

```env
META_ACCESS_TOKEN=EAALZC1ffXMosBPZBWwj4zcpd6u5CZBOpr2xVroOxQII2gP4lqUcUvtDlJANtiHLjbZBeO8LJ8I6PSzDgFUZBZBZCQx34qUQ7QKZBTMktZAKIa6eeP2qDRJk9bQ7RqRQ05ZCbpNaTyZCgvRDku4l25HkfyAfmoefr1IH4EUGyrBTfznrhYf9gYikAMns4ZBTkLIEiNoSVigZDZD
META_PIXEL_ID=3661852843939894
```

### For Firebase Functions (Production)

Set the secrets using Firebase CLI:

```bash
firebase functions:secrets:set META_ACCESS_TOKEN
# When prompted, enter: EAALZC1ffXMosBPZBWwj4zcpd6u5CZBOpr2xVroOxQII2gP4lqUcUvtDlJANtiHLjbZBeO8LJ8I6PSzDgFUZBZBZCQx34qUQ7RqRQ05ZCbpNaTyZCgvRDku4l25HkfyAfmoefr1IH4EUGyrBTfznrhYf9gYikAMns4ZBTkLIEiNoSVigZDZD

firebase functions:secrets:set META_PIXEL_ID
# When prompted, enter: 3661852843939894
```

Or use the updated script:

```bash
./set-firebase-secrets.sh
```

After setting secrets, deploy:

```bash
firebase deploy --only functions
```

## How It Works

1. **User submits form** on the landing page (`/`)
2. **Event ID Generation**: A unique `event_id` is generated using `crypto.randomUUID()` (format: `lead_<uuid>`)
3. **Client-side tracking**: The Meta Pixel (already in `index.html`) tracks the Lead event via browser with the `event_id`:
   ```javascript
   fbq('track', 'Lead', {...}, { eventID: eventId })
   ```
4. **Server-side tracking**: The form submission also sends data to `/api/track-meta-lead` with the same `event_id`:
   - Hashes PII (email, phone, name) using SHA-256 (required by Meta)
   - Sends the Lead event to Meta's Conversions API with the matching `event_id`
   - Meta automatically deduplicates events with the same `event_id` and `event_name`
5. **Deduplication**: Meta sees both events share the same `event_id` and counts them as ONE conversion, not two

## Event Details

When a form is submitted, the following data is sent to Meta:

- **Event Name**: `Lead` (must match on both Pixel and CAPI)
- **Event ID**: `lead_<uuid>` (generated once, shared by both Pixel and CAPI for deduplication)
- **User Data** (hashed):
  - Email (SHA-256)
  - Phone number (SHA-256, digits only)
  - First name (SHA-256)
  - Last name (SHA-256)
- **Event Metadata**:
  - Event time (Unix timestamp)
  - Event source URL (the page where the form was submitted)
  - Action source: `website`

### Deduplication

The same `event_id` is sent to both:
- **Browser Pixel**: `fbq('track', 'Lead', {...}, { eventID: eventId })`
- **Conversions API**: `{ event_name: "Lead", event_id: eventId, ... }`

Meta automatically deduplicates events with matching `event_id` + `event_name` within a short time window, ensuring you see ONE conversion, not two.

## Testing

1. Make sure your `.env` file has the Meta credentials
2. Restart your server: `npm run server`
3. Submit the form on the landing page
4. Check the server logs for confirmation messages
5. Verify in Meta Events Manager that the Lead event is being received

### Testing Deduplication

1. **Browser DevTools**: Open Network tab → filter "pixel" → submit form
   - Look for the Pixel request containing `&eventID=lead_...`
   - Note the event_id value

2. **Server Logs**: Check your server console
   - Should show the same event_id being sent to Conversions API

3. **Meta Events Manager**: 
   - Go to Events → Diagnostics Tab → Deduplication
   - You should see "Events Matching" with green checkmarks
   - If you see "Browser event missing event_id" or "Server event not deduplicated", there's an issue

4. **Quick Test**: Submit the form and check Meta Events Manager
   - You should see ONE Lead event, not two
   - Both Pixel and CAPI events should show as "Matched" in deduplication diagnostics

## Troubleshooting

### "META_ACCESS_TOKEN or META_PIXEL_ID is not set"
- Make sure you've added the environment variables to your `.env` file
- Restart your server after adding them

### "Meta API authentication failed"
- Verify your access token is correct and hasn't expired
- Access tokens can expire; you may need to generate a new one in Meta Business Settings

### "Invalid request to Meta API"
- Check that the pixel ID matches your Meta Pixel ID
- Verify the event data format is correct

## Notes

- The Meta Pixel tracking code is already set up in `index.html` (client-side)
- This setup adds server-side tracking via the Conversions API for better accuracy
- Both client-side and server-side tracking work together for optimal results
- PII (Personally Identifiable Information) is automatically hashed using SHA-256 before sending to Meta
