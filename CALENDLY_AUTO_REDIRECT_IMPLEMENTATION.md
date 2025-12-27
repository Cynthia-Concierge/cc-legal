# Calendly Auto-Redirect Implementation

## Overview
The onboarding flow now automatically detects when users schedule a call via Calendly and redirects them to the dashboard, eliminating the need for users to click "Skip call" after booking.

## What Was Changed

### File: `src/components/wellness/onboarding/LawyerBookingCard.tsx`

**Added Features:**
1. **Event Listener**: Listens for `calendly.event_scheduled` events from the Calendly widget
2. **Auto-Redirect**: Automatically redirects to dashboard 3 seconds after appointment is scheduled
3. **Success Message**: Shows a confirmation overlay when appointment is scheduled

## How It Works

1. **User schedules appointment** in the Calendly widget (Step 18 of onboarding)
2. **Calendly sends event** via `postMessage` API with event type `calendly.event_scheduled`
3. **Component detects event** and shows success message
4. **Auto-redirects** to dashboard after 3 seconds

## Technical Details

### Event Detection
```typescript
// Listens for messages from Calendly domain
const isCalendlyEvent = (e: MessageEvent) => {
    return e.origin === "https://calendly.com" && 
           e.data?.event && 
           e.data.event.startsWith("calendly.");
};

// Detects when appointment is scheduled
if (e.data.event === "calendly.event_scheduled") {
    // Show success state and redirect
}
```

### User Experience Flow
1. User sees Calendly widget on Step 18
2. User selects time and fills out form
3. User clicks "Schedule Event"
4. Calendly shows confirmation
5. **NEW**: Success overlay appears: "Appointment Scheduled! 🎉"
6. **NEW**: After 3 seconds, automatically redirects to dashboard
7. User no longer needs to click "Skip / I'll Book Later"

## Benefits

✅ **Better UX**: Users don't need to manually skip after booking  
✅ **Clear Feedback**: Success message confirms appointment was scheduled  
✅ **Seamless Flow**: Automatic redirect keeps momentum going  
✅ **No Confusion**: Eliminates the "why do I need to click skip?" question  

## Testing

To test this:
1. Go through onboarding flow to Step 18 (Lawyer Booking)
2. Schedule an appointment in the Calendly widget
3. Verify that:
   - Success message appears
   - After 3 seconds, redirects to dashboard
   - No need to click "Skip" button

## Notes

- The "Skip / I'll Book Later" button is still available if users want to skip without booking
- The 3-second delay allows Calendly's confirmation message to be visible
- This only applies to the onboarding flow (`LawyerBookingCard`), not the general `CalendlyModal` used elsewhere in the app

## Future Enhancements (Optional)

If you want to track this in analytics:
- Add event tracking when appointment is scheduled
- Save to database that user booked a call
- Send notification to admin
- Add to user's onboarding completion data
