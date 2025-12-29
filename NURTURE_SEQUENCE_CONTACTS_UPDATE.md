# Nurture Sequence for Contacts - Update Summary

## Changes Made

### 1. Automatic Scheduling for New Contacts ✅

**Location:** `functions/src/index.ts` - `/api/save-contact` endpoint

When a new contact is created (within the last minute), the system now automatically schedules the nurture sequence emails:
- Day 3: Case Study Email
- Day 5: Risk Scenario Email  
- Day 7: Social Proof Email
- Day 10: Final Reminder Email

**Code Added:**
```typescript
// Schedule nurture sequence emails for new contacts (fire and forget)
if (isNewContact && contact.id) {
  (async () => {
    try {
      console.log("[Save Contact] Scheduling nurture sequence emails for contact:", contact.id);
      const baseUrl = req.get("host")?.includes("localhost")
        ? `http://${req.get("host")}`
        : `https://us-central1-${process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'cc-legal'}.cloudfunctions.net/api`;
      
      await fetch(`${baseUrl}/api/emails/schedule-nurture-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id
        })
      });
      
      console.log("[Save Contact] ✅ Nurture sequence emails scheduled for contact:", contact.id);
    } catch (scheduleError: any) {
      console.error("[Save Contact] ❌ Error scheduling nurture sequence:", scheduleError);
      // Don't throw - we don't want to break the contact save
    }
  })();
}
```

### 2. Improved Fallback Mechanisms ✅

All 4 email workers now have robust fallbacks to handle contacts with missing data:

#### **Name Fallback Chain:**
1. `contact.first_name` (if available)
2. Extract first word from `contact.name`
3. Extract email prefix (before @)
4. Default: `'there'`

#### **Business Name Fallback Chain:**
1. `contact.name` (full name)
2. Email prefix with dots/underscores replaced by spaces
3. Default: `'your business'`

#### **Business Type Fallback Chain:**
1. `profile.business_type` (for users with profiles)
2. Default: `'wellness business'` (for contacts)

#### **Boolean Fields (Risk Scenario Email):**
- All default to `false` for contacts (safe defaults)

### 3. Updated Email Workers

All 4 workers now include:
- ✅ Case Study Email Worker (`/api/workers/send-case-study-email`)
- ✅ Risk Scenario Email Worker (`/api/workers/send-risk-scenario-email`)
- ✅ Social Proof Email Worker (`/api/workers/send-social-proof-email`)
- ✅ Final Reminder Email Worker (`/api/workers/send-final-reminder-email`)

**Key Improvements:**
- Contacts now query `first_name` field for better name extraction
- Multiple fallback layers ensure emails always read properly
- Final safety checks prevent undefined/null values from reaching email templates

## Example Fallback Scenarios

### Scenario 1: Contact with only email
- **Email:** `john.doe@example.com`
- **Name:** `'john'` (from email prefix)
- **Business Name:** `'john doe'` (from email prefix, cleaned)
- **Business Type:** `'wellness business'`

### Scenario 2: Contact with name but no first_name
- **Email:** `sarah@example.com`
- **Name:** `'Sarah Johnson'`
- **Name Used:** `'Sarah'` (extracted from name)
- **Business Name:** `'Sarah Johnson'`
- **Business Type:** `'wellness business'`

### Scenario 3: Contact with first_name
- **Email:** `mike@example.com`
- **Name:** `'Mike Smith'`
- **first_name:** `'Mike'`
- **Name Used:** `'Mike'` (from first_name field)
- **Business Name:** `'Mike Smith'`
- **Business Type:** `'wellness business'`

### Scenario 4: User with incomplete profile
- **User has profile but `business_type` is null**
- **Business Type:** `'wellness business'` (fallback applied)

## Email Template Fallbacks

All React Email templates already have default values:
- `name` → defaults to `'there'` if not provided
- `businessName` → defaults to `'your business'`
- `businessType` → defaults to `'wellness business'`

## Testing Checklist

- [ ] New contact created → nurture sequence scheduled
- [ ] Contact with only email → emails read properly
- [ ] Contact with name → name extracted correctly
- [ ] Contact with first_name → uses first_name
- [ ] User without business_type → uses 'wellness business'
- [ ] All 4 emails sent on schedule (Day 3, 5, 7, 10)
- [ ] No "[business type]" or undefined values in emails

## Next Steps

1. **Deploy Functions:**
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

2. **Test with a new contact:**
   - Create a contact via `/api/save-contact`
   - Verify nurture sequence is scheduled
   - Check Cloud Tasks queue: `gcloud tasks list --queue=email-reminders --location=us-central1 --project=cc-legal`

3. **Monitor logs:**
   ```bash
   firebase functions:log --only api | grep "Nurture Sequence\|Case Study\|Risk Scenario\|Social Proof\|Final Reminder"
   ```

## Notes

- Contacts don't have business profiles, so all business-specific data uses safe defaults
- The system gracefully handles missing data at multiple levels (worker → email service → template)
- All emails will read naturally even with minimal contact information

