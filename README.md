# Facetube

A professional, modern and attractive YouTube-style video streaming application called **Facetube** with full authentication and role-based access control (RBAC).

## Features

- **Authentication via Supabase**:
  - User Registration with unique Username, Email, Password, and Confirm Password validation.
  - Automatic profile generation into the `profiles` table.
  - User Sign In with Email/Password.
  - Profile and session persistence.
- **Role-Based Access Control (RBAC)**:
  - Two distinct roles: `admin` and `user` (Default role = `user`).
  - Protected `/admin` console for administrator accounts.
  - Automatic redirect to Home (`/`) if standard users or unauthorized guests attempt to access `/admin`.
  - Database schema with `profiles` and `user_roles` tables, Row Level Security (RLS) policies, and triggers.
- **Video Discovery & Playback**:
  - Trending videos, recommended feed, and creator spotlights.
  - Interactive playback views, search, and category filtering.
- **Responsive Layout**:
  - Desktop rail navigation, mobile drawer and bottom navigation bar.

## Database Setup (Supabase)

Run the SQL migration in `supabase/migrations/20260901_init_schema.sql` in your Supabase SQL Editor.

Configure environment variables in `.env`:

```sh
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```sh
npm install
npm run dev
```
