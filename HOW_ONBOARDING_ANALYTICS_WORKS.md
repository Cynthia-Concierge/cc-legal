# How Onboarding Analytics Works

## The Big Picture

**One table stores everything** → **Three views make it easy to analyze**

```
User goes through onboarding
    ↓
Events get tracked (started/completed/abandoned)
    ↓
Saved to: onboarding_events table
    ↓
Query via views for insights
```

## 1. The Table: `onboarding_events`

**What it stores:** Every action a user takes during onboarding

**Key Fields:**
- `session_id` - Links all events from one user's journey
- `step_number` - Which step (0-19)
- `step_name` - Human-readable name ("Email Collection", "Question 1", etc.)
- `event_type` - "started", "completed", or "abandoned"
- `entry_point` - "landing_page" or "onboarding_direct"
- `time_spent_seconds` - How long they spent on that step
- `email`, `user_id`, `contact_id` - Links to other tables

**Example Data:**
```
session_id: "onboarding_abc123"
step_number: 1
step_name: "Email Collection"
event_type: "started"
entry_point: "onboarding_direct"
created_at: "2024-01-15 10:30:00"
```

## 2. How Tracking Works

### Session ID
- Generated once when user starts onboarding
- Stored in browser's `sessionStorage`
- Links all their events together
- Example: `"onboarding_abc-123-def-456"`

### Event Types
- **`started`** - User reaches a step
- **`completed`** - User finishes a step (moves to next)
- **`abandoned`** - User leaves without completing

### Example Flow:
```
Step 1: Email Collection
  → Event: step=1, type="started", time=0
  → User enters email
  → Event: step=1, type="completed", time=45 seconds

Step 2: Question 1
  → Event: step=2, type="started", time=0
  → User answers question
  → Event: step=2, type="completed", time=12 seconds

Step 3: Question 2
  → Event: step=3, type="started", time=0
  → User closes browser ❌
  → Event: step=3, type="abandoned", time=5 seconds
```

## 3. The Views (Pre-Built Queries)

### View 1: `onboarding_funnel_summary`
**What it shows:** Completion rates for each step

```sql
SELECT * FROM onboarding_funnel_summary;
```

**Output:**
```
step_number | step_name              | started_count | completed_count | completion_rate_percent | avg_time_seconds
------------|------------------------|----------------|-----------------|------------------------|------------------
1           | Email Collection      | 100            | 95              | 95.00                  | 42.5
2           | Question 1             | 95             | 88              | 92.63                  | 15.2
3           | Question 2             | 88             | 75              | 85.23                  | 18.7
...
```

**Use it to:** See which steps have the lowest completion rates

### View 2: `onboarding_completion_by_source`
**What it shows:** Landing page vs direct onboarding performance

```sql
SELECT * FROM onboarding_completion_by_source;
```

**Output:**
```
entry_point        | source            | total_sessions | completed_onboarding | completion_rate_percent
-------------------|-------------------|----------------|----------------------|------------------------
landing_page       | wellness          | 50             | 35                   | 70.00
onboarding_direct  | onboarding_direct | 30             | 18                   | 60.00
```

**Use it to:** Compare which entry point converts better

### View 3: `onboarding_dropoff_points`
**What it shows:** Where people abandon (sorted by most abandoned)

```sql
SELECT * FROM onboarding_dropoff_points;
```

**Output:**
```
step_number | step_name         | abandoned_count | started_count | dropoff_rate_percent
------------|-------------------|-----------------|---------------|---------------------
15          | Website Input     | 12              | 45            | 26.67
12          | Identity Form     | 8               | 53            | 15.09
19          | Password Creation | 5               | 40            | 12.50
```

**Use it to:** Find the biggest drop-off points to optimize

## 4. Practical Queries

### Overall Completion Rate
```sql
SELECT 
  COUNT(DISTINCT session_id) FILTER (WHERE step_number = 1) as started,
  COUNT(DISTINCT session_id) FILTER (WHERE step_number = 19 AND event_type = 'completed') as completed,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE step_number = 19 AND event_type = 'completed')::numeric /
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE step_number = 1), 0) * 100,
    2
  ) as completion_rate_percent
FROM onboarding_events;
```

### Daily Funnel
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) FILTER (WHERE step_number = 1) as started,
  COUNT(DISTINCT session_id) FILTER (WHERE step_number = 19 AND event_type = 'completed') as completed
FROM onboarding_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Average Time to Complete
```sql
SELECT 
  AVG(time_spent_seconds) as avg_seconds,
  ROUND(AVG(time_spent_seconds) / 60, 2) as avg_minutes
FROM onboarding_events
WHERE event_type = 'completed';
```

### See One User's Journey
```sql
SELECT 
  step_number,
  step_name,
  event_type,
  time_spent_seconds,
  created_at
FROM onboarding_events
WHERE session_id = 'onboarding_abc123'
ORDER BY created_at;
```

## 5. How to Add Tracking (Next Step)

The tracking service is ready at `src/lib/onboardingAnalytics.ts`

**To track an event:**
```typescript
import { trackOnboardingEvent } from '../../lib/onboardingAnalytics';

// When step starts
trackOnboardingEvent(1, 'started', { email: 'user@example.com' });

// When step completes
trackOnboardingEvent(1, 'completed', { 
  email: 'user@example.com',
  timeSpentSeconds: 45 
});
```

**I can add this to your Onboarding component** - just say the word!

## Quick Start Checklist

✅ Table created in Supabase  
✅ Views created (for easy analysis)  
⏳ Add tracking calls to Onboarding component (next step)  
⏳ Test with a few users  
⏳ Query the views to see your funnel

## What You'll Be Able to Answer

- ✅ How many people start vs complete?
- ✅ Which step has the highest drop-off?
- ✅ Do landing page visitors convert better than direct?
- ✅ How long does onboarding take on average?
- ✅ Which questions cause the most abandonment?
- ✅ What's my daily/weekly completion rate?
