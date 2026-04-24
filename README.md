# Forum Neighborhood

Forum Neighborhood is a social-style community app built with Next.js (App Router), React, TypeScript, and Supabase.

## Features

- Email/password auth flow (login, signup, forgot/reset password)
- Home feed with likes, saves, comments count, and profile avatars
- Profiles and public user pages
- Direct messages
- Friend/follow system with incoming requests
- Activity feed and search
- Optional push notifications via OneSignal

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)

## Project Structure

- `app/` - App Router routes, server actions, API routes
- `components/` - UI components for feed, profile, auth, activity, notifications
- `lib/` - Supabase clients, data-access helpers, notification helpers
- `public/` - Static assets, OneSignal service workers
- `scripts/` - Project scripts (for example DB migration helpers)
- `react-ts/` - Legacy/secondary frontend workspace (separate from the main Next.js app)

## Requirements

- Node.js 18+ (Node.js 20+ recommended)
- npm
- A Supabase project

## Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Optional alias used in some code paths:
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# Optional (for push notifications):
NEXT_PUBLIC_ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...

# Optional (for service-role operations):
SUPABASE_SERVICE_ROLE_KEY=...
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start Next.js in development mode
- `npm run build` - create production build in `.next/`
- `npm run start` - run production server from `.next/`
- `npm run lint` - run ESLint
- `npm run db:apply-engagement` - run engagement migration helper script

## Production Run (Local)

To test production behavior locally:

```bash
npm run build
npm run start
```

## Notes

- `.next/` is build output and is git-ignored by default.
- Middleware enforces auth redirects for protected routes.
- If OneSignal env vars are missing, notification initialization is skipped.
