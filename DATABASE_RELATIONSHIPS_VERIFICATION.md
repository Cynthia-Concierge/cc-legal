# Database Relationships Verification

## Overview
This document verifies the relationships between `contacts`, `users`, and `business_profiles` tables to ensure proper data linking and tracking.

## Table Hierarchy & Relationships

### 1. **Contacts** (Entry Point)
**Definition**: People who opt in on the landing page form

**Table**: `contacts`
- `id` (UUID, Primary Key)
- `email` (TEXT, UNIQUE, NOT NULL) - **Primary identifier**
- `name` (TEXT, NOT NULL)
- `first_name`, `last_name`, `phone`, `website`, `source`
- `user_id` (UUID, NULLABLE, REFERENCES auth.users(id)) - **Links to user when password created**
- `calendly_booked_at` (TIMESTAMPTZ, NULLABLE) - **Tracks Calendly bookings**
- `created_at`, `updated_at`

**When Created**: 
- User submits form on landing page
- `user_id` is NULL at this point

**Key**: `email` (unique identifier)

---

### 2. **Users** (Password Created)
**Definition**: People who opted in AND created a password

**Table**: `users`
- `id` (UUID, Primary Key)
- `user_id` (UUID, UNIQUE, NOT NULL, REFERENCES auth.users(id)) - **Links to auth.users**
- `email` (TEXT, NOT NULL) - **Synced from auth.users**
- `name` (TEXT)
- `password_created_at` (TIMESTAMPTZ, NOT NULL)
- `onboarding_completed` (BOOLEAN, DEFAULT false)
- `profile_completed` (BOOLEAN, DEFAULT false)
- `calendly_booked_at` (TIMESTAMPTZ, NULLABLE) - **Tracks Calendly bookings**
- `subscription_status`, `subscription_tier`
- `last_login_at`, `created_at`, `updated_at`

**When Created**: 
- User creates password (in onboarding or business profile)
- Automatically created via trigger OR manually inserted

**Key**: `user_id` (references auth.users.id)

---

### 3. **Business Profiles** (Profile Completed)
**Definition**: People who opted in, created password, AND completed business profile

**Table**: `business_profiles`
- `id` (UUID, Primary Key)
- `user_id` (UUID, UNIQUE, NOT NULL, REFERENCES auth.users(id)) - **Links to user**
- `business_name` (TEXT) - **Required for "completed" status**
- `website_url`, `instagram`, `business_type`
- `team_size`, `monthly_clients`, `uses_photos`
- `primary_concern`, `hosts_retreats`, `offers_online_courses`
- `has_w2_employees`, `sells_products`
- `services` (JSONB array)
- `has_physical_movement`, `collects_online`, `hires_staff`, `is_offsite_or_international`
- `legal_entity_name`, `entity_type`, `state`, `business_address`, `owner_name`, `phone`
- `created_at`, `updated_at`

**When Created**: 
- User saves business profile with `business_name` filled out
- Only created if `business_name` is provided

**Key**: `user_id` (references auth.users.id, UNIQUE - one profile per user)

---

## Linking Chain

```
contacts (email) 
    ↓ (via email matching)
users (user_id = auth.users.id)
    ↓ (via user_id)
business_profiles (user_id = auth.users.id)
```

### Relationship Details

1. **Contacts → Users**
   - **Link Field**: `contacts.user_id` = `users.user_id` = `auth.users.id`
   - **Linking Method**: Email matching when password is created
   - **Code Location**: 
     - `Onboarding.tsx` (line 277-295)
     - `BusinessProfile.tsx` (line 464-486)
   - **When Linked**: When user creates password, code updates `contacts.user_id` by matching email

2. **Users → Business Profiles**
   - **Link Field**: `users.user_id` = `business_profiles.user_id` = `auth.users.id`
   - **Linking Method**: Direct user_id reference (both reference auth.users.id)
   - **Code Location**: `BusinessProfile.tsx` (line 568-600)
   - **When Linked**: When user saves business profile, uses `user.id` directly

3. **All Tables → auth.users**
   - **Common Link**: All three tables reference `auth.users.id` via `user_id` field
   - **Contacts**: `user_id` is nullable (can be NULL if no password created)
   - **Users**: `user_id` is required (must have password)
   - **Business Profiles**: `user_id` is required (must have password)

---

## Email Syncing

### Contacts Table
- Email is set when form is submitted
- Email is the primary identifier (UNIQUE constraint)
- Email is used to link to user when password is created

### Users Table
- Email is synced from `auth.users.email`
- Email can be manually updated
- There's a trigger function `sync_user_email()` (commented out) that could auto-sync
- Currently synced manually when user is created/updated

### Business Profiles Table
- No email field (links via user_id)
- Can get email via join: `business_profiles.user_id = users.user_id = auth.users.id`

---

## Verification Queries

### Check Contact → User Linking
```sql
SELECT 
  c.email,
  c.name as contact_name,
  c.user_id as contact_user_id,
  u.user_id as users_user_id,
  u.email as user_email,
  CASE 
    WHEN c.user_id = u.user_id THEN '✅ Linked'
    WHEN c.user_id IS NULL THEN '❌ Not Linked (no password)'
    ELSE '⚠️ Mismatch'
  END as link_status
FROM contacts c
LEFT JOIN users u ON c.user_id = u.user_id
ORDER BY c.created_at DESC
LIMIT 20;
```

### Check User → Business Profile Linking
```sql
SELECT 
  u.email,
  u.user_id,
  bp.business_name,
  CASE 
    WHEN bp.user_id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ No Profile'
  END as profile_status
FROM users u
LEFT JOIN business_profiles bp ON u.user_id = bp.user_id
ORDER BY u.created_at DESC
LIMIT 20;
```

### Check Complete Funnel (Contact → User → Profile)
```sql
SELECT 
  c.email,
  c.name as contact_name,
  c.user_id IS NOT NULL as has_password,
  u.user_id IS NOT NULL as in_users_table,
  bp.business_name IS NOT NULL as has_profile,
  CASE 
    WHEN bp.business_name IS NOT NULL THEN '✅ Complete'
    WHEN u.user_id IS NOT NULL THEN '🟡 Password Created'
    WHEN c.user_id IS NOT NULL THEN '🟡 Contact Linked'
    ELSE '🔴 Just Contact'
  END as funnel_stage
FROM contacts c
LEFT JOIN users u ON c.user_id = u.user_id
LEFT JOIN business_profiles bp ON u.user_id = bp.user_id
ORDER BY c.created_at DESC
LIMIT 20;
```

### Find Orphaned Records
```sql
-- Contacts with user_id but no matching user
SELECT c.* 
FROM contacts c
WHERE c.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.user_id = c.user_id
  );

-- Users with user_id but no matching auth.users
SELECT u.* 
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = u.user_id
);

-- Business profiles with user_id but no matching user
SELECT bp.* 
FROM business_profiles bp
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.user_id = bp.user_id
);
```

---

## Potential Issues & Edge Cases

### 1. **Email Mismatch**
- **Issue**: Contact email doesn't match user email
- **Cause**: User changes email in auth.users after contact is created
- **Impact**: Contact linking might fail if email doesn't match
- **Current Solution**: Code uses `user.email` from auth, matches to `contacts.email`

### 2. **Multiple Contacts, One User**
- **Issue**: User submits form multiple times with same email
- **Cause**: `contacts.email` is UNIQUE, so duplicates are prevented
- **Impact**: Only first contact record exists, subsequent submissions fail silently
- **Current Solution**: UNIQUE constraint prevents duplicates

### 3. **Contact Without User**
- **Issue**: Contact exists but user never created password
- **Status**: ✅ **Expected** - `contacts.user_id` can be NULL
- **Impact**: Contact exists but not linked to user account

### 4. **User Without Contact**
- **Issue**: User created password but no contact record exists
- **Cause**: User went directly to onboarding without submitting form
- **Status**: ✅ **Possible** - Code creates contact in onboarding if missing
- **Impact**: User exists but no initial contact record

### 5. **Business Profile Without User**
- **Issue**: Business profile exists but no user record
- **Status**: ❌ **Shouldn't happen** - `business_profiles.user_id` is required
- **Impact**: Data integrity issue

---

## Current Linking Logic

### When Password is Created (Onboarding.tsx)
```typescript
// 1. User created in auth.users (via supabase.auth.updateUser)
// 2. User added to users table
// 3. Contact linked by email:
await supabase
  .from('contacts')
  .update({ user_id: user.id })
  .eq('email', user.email.trim().toLowerCase());
// 4. Business profile created
await createBusinessProfile(user);
```

### When Password is Created (BusinessProfile.tsx)
```typescript
// 1. User created in auth.users
// 2. User added to users table
// 3. Contact linked by email:
await supabase
  .from('contacts')
  .update({ user_id: user.id })
  .eq('email', answers.email.trim().toLowerCase());
// 4. Business profile saved (if business_name provided)
```

### When Business Profile is Saved
```typescript
// Uses user.id directly (no email matching needed)
await supabase
  .from('business_profiles')
  .upsert({
    user_id: user.id,  // Direct reference
    business_name: formData.businessName,
    // ... other fields
  }, {
    onConflict: 'user_id'  // One profile per user
  });
```

---

## Summary

✅ **Contacts → Users**: Linked via email matching when password is created
✅ **Users → Business Profiles**: Linked via user_id (both reference auth.users.id)
✅ **All Tables**: Properly reference auth.users via user_id
✅ **Email Syncing**: Contacts use email, Users sync from auth.users
✅ **Indexes**: Proper indexes on user_id and email for fast lookups
✅ **RLS Policies**: Users can only see/update their own records

**Everything appears to be properly set up and linked!** The relationships are:
- Contacts link to Users via email → user_id
- Users link to Business Profiles via user_id (direct reference)
- All three link to auth.users via user_id
