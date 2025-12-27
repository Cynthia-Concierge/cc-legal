-- Diagnostic Queries for Onboarding Event Tracking
-- Run these in Supabase SQL Editor to see what's happening

-- 1. Check total events and recent activity
SELECT 
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions,
  MAX(created_at) as most_recent_event,
  MIN(created_at) as oldest_event
FROM onboarding_events;

-- 2. Check entry points (how people are arriving)
SELECT 
  entry_point,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events
FROM onboarding_events
WHERE step_number = 1 AND event_type = 'started'
GROUP BY entry_point;

-- 3. Check opt-in rate (Step 1 completion)
SELECT 
  entry_point,
  COUNT(DISTINCT CASE WHEN event_type = 'started' THEN session_id END) as landed,
  COUNT(DISTINCT CASE WHEN event_type = 'completed' THEN session_id END) as opted_in,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'completed' THEN session_id END)::numeric / 
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'started' THEN session_id END), 0) * 100, 
    2
  ) as opt_in_rate_percent
FROM onboarding_events
WHERE step_number = 1
GROUP BY entry_point;

-- 4. Check for errors (events without email when they should have it)
SELECT 
  step_number,
  step_name,
  event_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE email IS NULL) as without_email,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as with_email
FROM onboarding_events
WHERE step_number >= 1
GROUP BY step_number, step_name, event_type
ORDER BY step_number, event_type;

-- 5. Recent events (last 20)
SELECT 
  created_at,
  step_number,
  step_name,
  event_type,
  entry_point,
  email,
  session_id
FROM onboarding_events
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check if tracking is working today
SELECT 
  DATE(created_at) as date,
  COUNT(*) as events_today,
  COUNT(DISTINCT session_id) as unique_sessions_today
FROM onboarding_events
WHERE created_at >= CURRENT_DATE
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 7. Step-by-step funnel (completion rates)
SELECT 
  step_number,
  step_name,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'started') as started,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'completed') as completed,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'completed')::numeric / 
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'started'), 0) * 100, 
    2
  ) as completion_rate
FROM onboarding_events
GROUP BY step_number, step_name
ORDER BY step_number;
