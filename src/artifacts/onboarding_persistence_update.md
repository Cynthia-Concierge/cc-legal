# Workflow Update: Onboarding Data Persistence

## Objective
Ensure that user data collected during the onboarding flow—specifically website URL and scan status—is immediately saved to the `business_profiles` Supabase table upon account creation. This ensures that the Dashboard works correctly (showing "Website Scanned") and that critical business data is not lost if the user drops off before manually saving the Business Profile form.

## Changes Implemented

### 1. `src/pages/wellness/Onboarding.tsx`
*   **Modified `handlePasswordSubmit` (Step 13):**
    *   Added logic to immediately `upsert` a record into `business_profiles` after successful user creation.
    *   Maps `answers.website` to `website_url`.
    *   Derives `has_scanned_website` from the presence of a valid website URL (logic: if they reached this step with a website, they passed the scan).
    *   Maps other onboarding answers (`services`, `primaryBusinessType`, `hasEmployees`, etc.) to their respective DB columns.
    *   Updates `wellness_onboarding_progress` in `localStorage` to ensure the Dashboard UI reflects the "Scanned" state immediately.
*   **Cleaned up `handleEmailSubmit` (Step 1):**
    *   Verified that premature profile creation logic was removed from this step, ensuring we wait for the user to actually answer the questions.

### 2. Data Flow
1.  **User enters Website (Step 12):** `WebsiteInputForm` saves URL to `answers` state.
2.  **User sets Password (Step 13):**
    *   User created in `auth`.
    *   User added to `users` table.
    *   **NEW:** `business_profiles` record created with `website_url` and `has_scanned_website = true`.
3.  **User lands on Dashboard:**
    *   Reads `localStorage` (updated by Onboarding) to show correct state.
    *   Future logins/refreshes will read from DB/LocalStorage as configured, keeping data in sync.

## Verification
*   **Build Status:** Passed (`npm run build` success).
*   **Logic Check:** Review of `Onboarding.tsx` confirms the `handlePasswordSubmit` function now contains the full profile creation payload inside the success block of user creation.

## Next Steps
*   Test the full flow manually in the browser to confirm the "Website" tab on the Dashboard is checked off after onboarding.
