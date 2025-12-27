# Onboarding Website & Profile Sync Fix

## Problem
After completing onboarding, users who entered their website were getting a "Please complete your business profile first" error when trying to generate personalized documents. This was happening for two reasons:

1. **Website not syncing to contacts table**: Website was captured during onboarding and saved to `business_profiles`, but not syncing back to the `contacts` table
2. **Profile completion flag not set**: The `isProfileComplete` flag wasn't being set after onboarding completion

## Root Causes

### 1. Contact Table Missing Website Data
**Flow:**
- Step 1 (Email Capture): Contact created with empty `website` field
- Step 15 (Website Input): Website captured and stored in `answers.website`
- Step 16 (Review Progress): Business profile created with website from `answers.website`
- **Issue**: Contact table never updated with the website

### 2. Profile Completion Flag Not Set
**Flow:**
- Onboarding completes and creates `business_profiles` record
- **Issue**: `isProfileComplete` flag in localStorage not set to `true`
- Document generation checks for `isProfileComplete` before allowing generation
- Users see "Please complete your business profile first" error

## Fixes Applied

### File: `src/pages/wellness/Onboarding.tsx`

#### Fix 1: Sync Website/Phone/Name to Contacts Table
**Location:** `createBusinessProfile` function (lines 155-179)

Added code to update the `contacts` table with data collected during onboarding:

```typescript
// Also update the contact table with additional info collected during onboarding
if (user.email && (answers.website || answers.phone || answers.ownerName)) {
  try {
    const contactUpdate: any = {
      updated_at: new Date().toISOString()
    };

    if (answers.website) contactUpdate.website = answers.website;
    if (answers.phone) contactUpdate.phone = answers.phone;
    if (answers.ownerName) contactUpdate.name = answers.ownerName;

    const { error: contactError } = await supabase
      .from('contacts')
      .update(contactUpdate)
      .eq('email', user.email);

    if (contactError) {
      console.warn('⚠️ Failed to update contact info:', contactError);
    } else {
      console.log('✅ Contact updated with:', contactUpdate);
    }
  } catch (contactUpdateError) {
    console.error('Error updating contact info:', contactUpdateError);
  }
}
```

**What this fixes:**
- Website entered during onboarding now syncs to `contacts` table
- Phone number syncs to `contacts` table
- Owner name syncs to `contacts` table as contact name
- Ensures consistency between `business_profiles` and `contacts` tables

#### Fix 2: Mark Profile as Complete After Onboarding
**Location:** `createBusinessProfile` function (lines 190-197)

Added code to set `isProfileComplete` flag in localStorage:

```typescript
// Mark profile as complete in localStorage for document generation
// This allows users to generate personalized documents immediately after onboarding
const updatedAnswers: UserAnswers = {
  ...answers,
  isProfileComplete: true
};
localStorage.setItem('wellness_onboarding_answers', JSON.stringify(updatedAnswers));
console.log('✅ Profile marked as complete in localStorage');
```

**What this fixes:**
- Profile is now marked as complete immediately after onboarding
- Users can generate personalized documents without seeing "complete your profile" error
- No need to manually complete the profile after onboarding

## Data Flow After Fix

### Onboarding Flow:
1. **Step 1 - Email Capture:**
   - Contact created in `contacts` table with email
   - Website, phone, name are empty at this point

2. **Steps 2-14 - Questions & Identity:**
   - User answers collected in `answers` state
   - Legal entity name, phone, address captured

3. **Step 15 - Website Input:**
   - Website captured and saved to `answers.website`

4. **Step 16 - Review Progress:**
   - `createBusinessProfile()` called
   - Business profile created/updated with all answers including website
   - **NEW:** Contact table updated with website, phone, owner name
   - **NEW:** `isProfileComplete` set to `true` in localStorage

5. **Dashboard:**
   - User can immediately click "Personalize Now"
   - No "complete your profile" error
   - Website is available in both `business_profiles` and `contacts` tables

## Testing Checklist

- [ ] Complete full onboarding with website URL
- [ ] Verify website appears in `business_profiles` table
- [ ] Verify website appears in `contacts` table
- [ ] Verify phone number syncs to both tables
- [ ] Verify owner name syncs to contacts as `name`
- [ ] Click "Personalize Now" on any document immediately after onboarding
- [ ] Verify no "complete your profile" error appears
- [ ] Verify document generates successfully with website/phone/name filled in

## Database Verification Queries

```sql
-- Check business profile
SELECT user_id, website_url, phone, business_name, owner_name
FROM business_profiles
WHERE user_id = '[USER_ID]';

-- Check contact
SELECT email, website, phone, name
FROM contacts
WHERE email = '[USER_EMAIL]';

-- Verify both have matching data
SELECT
  bp.user_id,
  bp.website_url as profile_website,
  c.website as contact_website,
  bp.phone as profile_phone,
  c.phone as contact_phone,
  bp.owner_name as profile_owner,
  c.name as contact_name
FROM business_profiles bp
LEFT JOIN contacts c ON bp.user_id::text = c.user_id
WHERE bp.user_id = '[USER_ID]';
```

## Notes

1. **Backward Compatibility:** This fix only affects new users going through onboarding. Existing users with missing website/phone in contacts will continue to work but won't benefit from the sync unless they re-complete their profile.

2. **Contact Updates:** The contact table update is non-blocking - if it fails, onboarding will continue. Errors are logged but don't prevent profile creation.

3. **Profile Completion:** The `isProfileComplete` flag is checked by `LegalInventoryChecklist.tsx` line 482 before allowing document generation.

4. **Data Sources:**
   - `business_profiles.website_url` - Primary source for business website
   - `contacts.website` - Now synced from onboarding for consistency
   - Both should match after onboarding completion
