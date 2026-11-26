# OurPlans ♡

Wedding planning workspace: checklist, budget, guest RSVP, vendor directory, timeline and calendar.

## V2 — Cloud database (Supabase)
- Supabase Auth email magic link
- PostgreSQL JSONB workspace storage
- Row Level Security (users can access their own record)
- LocalStorage remains a local/offline fallback

### Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Supabase Settings → API: copy Project URL and anon/public key.
4. In `index.html`, replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY`. Never use service-role key in frontend.
5. Commit to GitHub; Vercel redeploys automatically.
6. In app click Cloud, enter email and open magic link.
7. Sync manually once; signed-in changes thereafter sync automatically.

### Database
One `wedding_plans` JSONB row per authenticated user. Multi-member shared workspaces and granular normalized tables are future improvements.

## Features
- Countdown, dashboard, checklist
- Budget and expense tracker
- Guest RSVP and CSV export
- Vendor list and CSV export
- Wedding timeline and CSV export
- Calendar
- Local browser storage and cloud sync

Static deployment, no build command.
