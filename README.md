# OurPlans ♡ — The Wedding Journal

OurPlans is a wedding-planning workspace with two connected experiences: a private Bride & Groom command centre and a mobile-first Guest Concierge.

**Production:** https://ourplans-git-main-iqbals-projects-2357f242.vercel.app

## Experiences

- **Bride & Groom:** wedding overview, countdown, checklist, budget, payment history, vendor directory, guest list, RSVP tracking, dietary notes, seating chart, timeline and calendar.
- **AI Wedding Planner:** Gemini-assisted 12-season-inspired color guidance, five bridesmaid dress color/style suggestions, and on-demand Wedding Wisdom.
- **Wedding Style:** saved palettes, editable color swatches, style notes, beauty preparation reminders and inspiration gallery.
- **Guest Concierge:** wedding-day schedule, culinary menu, searchable seating/tablemates, personal RSVP and communal photo wall.
- **Digital invitation:** the existing standalone invitation page remains available.
- **Themes:** Sage, Ocean, Rose and Lavender.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Role selection: Bride & Groom or Guest View |
| `/planner.html` | Wedding Command Centre |
| `/guest.html?id=<wedding-id>` | Public Guest Concierge |
| `/invitation.html` | Standalone invitation microsite |

The Guest List creates a personal guest URL containing a unique RSVP token. A guest can submit an RSVP only through a valid personal URL. The public guest directory does not expose those private tokens.

## Stack

- Static HTML, CSS and JavaScript for the planner and guest experiences
- Vercel Node.js Functions under `/api`
- Supabase Auth, PostgreSQL and Storage for cloud sync and shared guest data
- Google Gemini API for AI features
- LocalStorage as the planner's local workspace fallback

## Setup

Follow [SETUP.md](SETUP.md) for the full Supabase schema, Vercel environment variables and guest portal publishing steps.

In short:
1. Run `SUPABASE_GUEST_PORTAL.sql` in the Supabase SQL Editor.
2. Fill in `assets/config.js` with your Supabase project URL and browser-safe anon/publishable key.
3. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` to the Vercel project environment.
4. Enable Supabase email magic-link authentication.
5. Open `/planner.html`, sign in through OurPlans Cloud, save wedding details and publish the Guest Concierge.

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in browser files or `NEXT_PUBLIC_*` variables.

## Current limitations

- Cloud sync and public guest sharing require the Supabase setup above. Local planning remains available without it.
- AI features require a valid Gemini API key.
- WhatsApp invitations open individual `wa.me` compose windows. They are manual, not unattended sends and not connected to the WhatsApp Business API.
- No payment gateway or third-party calendar integration is configured.
