# OurPlans deployment and backend setup

OurPlans now contains the full wedding command centre, a mobile-first public guest concierge, a secure Gemini API proxy, and a shared guest RSVP/photo API.

## 1. Supabase

Create a Supabase project. Open **SQL Editor**, then run the complete contents of `SUPABASE_GUEST_PORTAL.sql`.

In `assets/config.js`, replace the two public browser values:

- `SUPABASE_URL`: your project URL, for example `https://xxxx.supabase.co`
- `SUPABASE_ANON_KEY`: your project's publishable/anon key

The anon key is intended for browser use. The database must keep Row Level Security enabled. Never put a service-role key in `assets/config.js`.

## 2. Vercel Environment Variables

Add these variables to the OurPlans Vercel project (Production, Preview and Development as appropriate):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret, server-side only |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash` |

Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` as `NEXT_PUBLIC_*` variables. The Vercel functions in `api/` read them only on the server.

## 3. Connect and publish

1. Open the deployed OurPlans site.
2. Open the Cloud control and sign in with the owner email. Supabase email magic-link authentication must be enabled.
3. Save wedding details, guest data, seating, menu, schedule and gallery.
4. Open **Settings → Guest portal publishing** and select **Publish / update guest portal**.
5. Share the base guest portal URL or the per-guest invitation links in the Guest List / WhatsApp invitation queue.

The guest API uses a private `wedding_guest_data` table and a public `wedding-gallery` storage bucket. RSVP is verified against each guest's invitation token. Guest uploads are limited to JPG, PNG or WebP images up to 2 MB.

## 4. Feature map

- Wedding Command Centre: overview, task checklist, budget and payment tracking, guest list/RSVP, vendors, timeline/calendar, seating assignments, style palette, beauty preparation and inspiration gallery.
- AI Planner: Gemini-powered 12-season-inspired color suggestions and Wedding Wisdom.
- Theme switcher: Sage, Ocean, Rose and Lavender.
- Guest Concierge: live schedule, culinary menu, searchable seating/tablemates, RSVP and communal photo wall.
- Digital invitation microsite: existing `invitation.html`.

## 5. Important boundaries

- AI features require a valid `GEMINI_API_KEY`.
- Cross-device owner/guest sharing requires the Supabase SQL, browser config and Vercel server environment above. Until configured, the local planner continues to work in that browser, but public guest sharing is unavailable.
- Local inspiration images are kept in that browser. Photos uploaded by guests through the public portal use Supabase Storage.
- WhatsApp invitations open individual `wa.me` compose windows. They are not sent unattended and do not use the WhatsApp Business API.
- The project is not yet connected to an automated payment provider or calendar provider.
