# SHIFTShield 2.0 — Supabase Setup Guide

Follow these steps to set up the Supabase backend for SHIFTShield 2.0.

## Prerequisites
- A [Supabase account](https://supabase.com) (free tier works)
- The SHIFTShield repository cloned locally

---

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Set:
   - **Project name:** `shiftshield`
   - **Database password:** Choose a strong password and save it
   - **Region:** Select the closest region to your users
4. Click **Create new project** and wait for it to initialise (~2 minutes)

---

## Step 2: Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `shiftshield/supabase/schema.sql`
4. Paste into the SQL editor and click **Run**
5. Verify no errors appear in the results panel

---

## Step 3: Apply Row Level Security Policies

1. In the SQL Editor, click **New Query**
2. Copy the entire contents of `shiftshield/supabase/policies.sql`
3. Paste and click **Run**
4. Verify no errors

---

## Step 4: Create Demo Auth Users

1. Go to **Authentication > Users** in your Supabase project
2. Click **Add user** and create:

   **Supervisor account:**
   - Email: `supervisor@shiftshield.demo`
   - Password: `ShiftShield2026!`
   - Confirm email: enabled

   **Worker account:**
   - Email: `worker01@shiftshield.demo`
   - Password: `ShiftShield2026!`
   - Confirm email: enabled

3. Note the UUID of each user from the Users table

---

## Step 5: Update Profiles for Demo Users

After creating the auth users, run in SQL Editor:

```sql
-- Update supervisor profile (replace UUID with actual ID from Auth > Users)
UPDATE profiles
SET full_name = 'Alex Morgan', role = 'supervisor', workplace_id = '00000000-0000-0000-0001-000000000001'
WHERE id = '<SUPERVISOR_USER_UUID>';

-- Update worker profile
UPDATE profiles
SET full_name = 'Marcus Johnson', role = 'worker', workplace_id = '00000000-0000-0000-0001-000000000001'
WHERE id = '<WORKER_USER_UUID>';
```

---

## Step 6: Run the Seed Data

1. In the SQL Editor, click **New Query**
2. Copy the contents of `shiftshield/supabase/seed.sql`
3. Paste and click **Run**
4. Verify no errors

---

## Step 7: Copy Credentials to .env

1. Go to **Settings > API** in your Supabase project
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**backend only, never in frontend**)
   - **JWT secret** → `SUPABASE_JWT_SECRET`

3. Update `shiftshield/frontend/.env.local`:
```
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Create `shiftshield/backend/.env`:
```
DEMO_MODE=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DEFAULT_LATITUDE=-33.8688
DEFAULT_LONGITUDE=151.2093
```

---

## Step 8: Disable Demo Mode and Test

1. Set `VITE_DEMO_MODE=false` in frontend env
2. Set `DEMO_MODE=false` in backend env
3. Restart both frontend and backend
4. Try logging in with `supervisor@shiftshield.demo / ShiftShield2026!`
5. Verify the dashboard loads with live data

---

## Running Without Supabase (Demo Mode)

If you don't have Supabase credentials, the app runs fully in **demo mode**:

```
VITE_DEMO_MODE=true   # in frontend .env.local
DEMO_MODE=true         # in backend .env
```

All features work with realistic built-in fixture data. No external services required.
