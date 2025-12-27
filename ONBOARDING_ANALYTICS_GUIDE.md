# Onboarding Analytics Guide

## Current State

### What Tables Mean What:

1. **`contacts` table** = **Started Onboarding**
   - Created when: Landing page form OR onboarding email entry
   - This is your "top of funnel" - everyone who enters their email

2. **`auth.users` table** = **Email Submitted**
   - Created when: They enter email in onboarding
   - Has temp password initially

3. **`business_profiles` table** = **Completed Onboarding** ✅
   - Created when: They set their password (or skip password)
   - This is your completion marker - they made it through!

4. **`users` table** = **Has Password**
   - Created when: Password is set
   - Links auth user to application-level user record

### Current Completion Rate Query:

```sql
-- Overall completion rate
SELECT 
  COUNT(DISTINCT c.email) as total_started,
  COUNT(DISTINCT bp.user_id) as total_completed,
  ROUND(COUNT(DISTINCT bp.user_id)::numeric / NULLIF(COUNT(DISTINCT c.email), 0) * 100, 2) as completion_rate_percent
FROM contacts c
LEFT JOIN business_profiles bp ON c.user_id = bp.user_id;
```

## Recommended Solution: Step-by-Step Tracking

### Why You Need It:

Right now you can only see:
- ✅ Started (contacts)
- ✅ Completed (business_profiles)

But you CAN'T see:
- ❌ Where people drop off (which step?)
- ❌ How long each step takes
- ❌ Which questions cause the most abandonment
- ❌ Entry point performance (landing page vs direct)

### Setup Steps:

#### 1. Create the Analytics Table

Run this SQL in Supabase SQL Editor:
```bash
supabase_onboarding_analytics.sql
```

This creates:
- `onboarding_events` table to track each step
- Helpful views for analytics:
  - `onboarding_funnel_summary` - completion rates per step
  - `onboarding_completion_by_source` - landing page vs direct
  - `onboarding_dropoff_points` - where people abandon

#### 2. Add Tracking to Onboarding Component

The tracking service is already created at:
```
src/lib/onboardingAnalytics.ts
```

You'll need to:
1. Import it in `Onboarding.tsx`
2. Call `trackOnboardingEvent()` when steps start/complete
3. Track abandonment when users leave

#### 3. Create API Endpoint (Optional)

For reliable abandonment tracking, create:
```
/api/track-onboarding-event
```

This allows tracking even when users close the browser.

## How to Use the Analytics

### View Completion Funnel:

```sql
SELECT * FROM onboarding_funnel_summary
ORDER BY step_number;
```

Shows:
- How many started each step
- How many completed each step
- Completion rate per step
- Average time spent

### Find Drop-off Points:

```sql
SELECT * FROM onboarding_dropoff_points
ORDER BY abandoned_count DESC;
```

Shows which steps have the highest abandonment.

### Compare Entry Points:

```sql
SELECT * FROM onboarding_completion_by_source;
```

Shows if landing page or direct onboarding performs better.

### Daily Funnel Report:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) FILTER (WHERE step_number = 1 AND event_type = 'started') as started,
  COUNT(DISTINCT session_id) FILTER (WHERE step_number = 19 AND event_type = 'completed') as completed,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE step_number = 19 AND event_type = 'completed')::numeric / 
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE step_number = 1 AND event_type = 'started'), 0) * 100, 
    2
  ) as completion_rate
FROM onboarding_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Quick Answer to Your Question

**"How many people are making it through onboarding?"**

Right now, you can check with:

```sql
-- Simple completion rate
SELECT 
  (SELECT COUNT(*) FROM contacts) as started,
  (SELECT COUNT(*) FROM business_profiles) as completed,
  ROUND(
    (SELECT COUNT(*) FROM business_profiles)::numeric / 
    NULLIF((SELECT COUNT(*) FROM contacts), 0) * 100, 
    2
  ) as completion_rate_percent;
```

**"What signifies completion?"**

✅ **`business_profiles` table** = They completed onboarding
- Created when they set password (or skip password)
- This means they answered all questions and got to the dashboard

**Best Next Step:**

1. Run the SQL to create the analytics table
2. Add tracking calls to the onboarding component
3. Use the views to see exactly where people drop off
4. Optimize the steps with highest abandonment

This will give you the full picture of your onboarding funnel!
