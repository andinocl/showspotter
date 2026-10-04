# ShowSpotter — Scope

Find concerts for artists you like, inside a travel window you can change on the fly. Alerts you when something new shows up.

## 1. Core concept: "Travel Modes"

A user has a **home location** and a set of **modes**. One mode is active at a time (switchable in one tap).

| Mode | Rule | How it's computed |
|---|---|---|
| Flight (default) | ≤ 3.5 h flight from home | Nonstop-reachable airports from the home airport, filtered by estimated block time (great-circle miles / ~450 mph + ~45 min overhead; ≈ 1,300 mi for 3.5 h). Route data: OpenFlights/OurAirports (static, no API cost). Events map to nearest airport. |
| Drive | 1–2 h drive | Isochrone from home (OpenRouteService free tier or Mapbox Isochrone API). Point-in-polygon test on venue lat/lng. |
| Here now | Same city as I am | Browser geolocation (or manual city picker) → radius ~25 mi around current location. |
| Custom | Any radius / any city / date range | User-defined, saved as presets. |

Modes are data (`type`, `params`), so new ones are cheap to add. Optional: "also show anything on a weekend only", "max ticket price" later.

## 2. Features

**MVP**
- Passkey sign-up/login, multiple users.
- Connect Spotify → import top artists (short/medium/long term) + followed artists. Manual add/remove/"mute" artists.
- Nightly job: for each user's artists, query event sources, store events, match against active mode.
- Show list (date, artist, venue, distance/travel estimate, "new" badge) with outlinks to ticket sites.
- Alerts: Web Push (PWA) + email fallback. Per-user prefs (instant vs daily digest, which modes alert).
- Mobile-first UI, installable PWA.

**Later**
- "Bands I'd like": similar-artist suggestions (see Spotify caveat), opt-in.
- Calendar export (.ics), share a show with a friend, "I'm going" tracking.
- Price-drop alerts, on-sale reminders (Ticketmaster exposes on-sale dates).
- Trip view: "I'll be in Chicago Oct 10–14" → temporary mode with date range.

## 3. Data sources (verify current terms before building — these change)

- **Ticketmaster Discovery API** — free key, ~5,000 calls/day; supports geo search (latlong + radius) and attraction (artist) IDs. Best primary source in the US. Also has affiliate links (via Impact).
- **Bandsintown** — good artist coverage but API access for apps is restrictive; apply, don't count on it.
- **SeatGeek** — has an API and Impact affiliate program; partner access can require approval.
- **Songkick** — closed to new API access; skip.
- Design `EventSource` as an interface so sources can be added/removed; dedupe by (artist, date, venue).

**Spotify caveats (important):**
- Still available: `/me/top/artists`, followed artists, saved tracks/albums.
- Spotify deprecated Recommendations, Related Artists, and Audio Features for new apps (Nov 2024), so "bands you'd like" needs another route (e.g. MusicBrainz/Last.fm similar-artists).
- Apps start in **Development Mode** with a small allowlist of users (historically 25, and Spotify has tightened this; check the dashboard). Extended quota requires a vetted business. Realistic plan: friends-and-family scale. Design so Last.fm or manual artist lists work as a no-Spotify path.
- Redirect URIs must be HTTPS (or `127.0.0.1` loopback), not `localhost`.

## 4. Affiliate revenue

- Ticketmaster, SeatGeek, StubHub, Vivid Seats all run affiliate programs through **Impact.com** (and some via Partnerize). Apply once the site is live with real content; they often want a public URL.
- Build for it now: every outlink goes through one `buildTicketUrl(event, provider)` function so affiliate IDs/deeplink wrappers are added in one place. Affiliate IDs live in `.env`.
- Disclose affiliate links in the footer (required by most programs and the FTC).

## 5. Architecture

- **Frontend:** Next.js (App Router) + Tailwind, PWA manifest + service worker. Mobile-first: bottom tab bar, large tap targets, safe-area insets (`env(safe-area-inset-*)`), `viewport-fit=cover`, 16px+ inputs to stop iOS zoom.
- **Backend:** Next.js route handlers/server actions (one deployable). Scheduled jobs run in a separate worker container.
- **DB:** MariaDB with Drizzle. Plain lat/lng + haversine is fine at this scale.
- **Auth:** Passkeys with **SimpleWebAuthn** (`@simplewebauthn/server` + `/browser`). Tables: `users`, `passkeys` (credential id, public key, counter, transports). Session cookie: httpOnly, secure, SameSite=Lax. Support multiple passkeys per user + a recovery path (email magic link or recovery codes), since losing the only passkey locks you out.
- **Spotify:** OAuth Authorization Code + PKCE; store refresh tokens encrypted at rest (key in `.env`).
- **Push:** Web Push with VAPID keys (`web-push`). **iOS only delivers web push to a PWA added to the Home Screen (iOS 16.4+)** — the onboarding flow must prompt "Add to Home Screen", then ask for notification permission from a user tap. Email (Resend) as fallback.

### Data model (sketch)
`users`, `passkeys`, `spotify_links`, `artists`, `user_artists(source, muted)`, `locations`, `travel_modes(user_id, type, params, active)`, `events(source, external_id, artist_id, venue, lat, lng, starts_at, urls)`, `user_event_matches(seen, notified_at)`, `push_subscriptions`.

### Nightly job
1. Refresh each user's Spotify artists. 2. Fetch events per unique artist (not per user — dedupe to save API calls). 3. Upsert events. 4. For each user, evaluate active/alerting modes. 5. Send alerts for new matches only.

## 6. Public-repo hygiene (secrets & identity)

- First commit contains `.gitignore` with `.env`, `.env.*`, `!.env.example`, `*.pem`, `.vercel`, `node_modules`, `.next`.
- Commit **`.env.example`** with placeholder values only. Real values in `.env` locally and in the host's env-var settings.
- In `.env` (never in code): `DATABASE_URL`, `SPOTIFY_CLIENT_ID/SECRET`, `TICKETMASTER_API_KEY`, `VAPID_PUBLIC/PRIVATE_KEY`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `RESEND_API_KEY`, `IMPACT_*` affiliate IDs, **`APP_ORIGIN`** and **`WEBAUTHN_RP_ID`** (your domain — keeps your site's identity out of the repo), `CRON_SECRET`.
- Home address/coordinates live only in the DB per user — never in code, fixtures, or tests. Use fake coordinates in seed data.
- Turn on GitHub **secret scanning + push protection**; add `gitleaks` as a pre-commit/CI check.
- Use a privacy-preserving git email (GitHub's `ID+username@users.noreply.github.com`) so commits don't expose your real address. WHOIS privacy on the domain.
- Anything ever committed by mistake = rotate the key; deleting the commit isn't enough.

## 7. Milestones

1. **Skeleton** — repo, Next.js app, PWA shell, MariaDB + migrations, Docker deploy, `.env` wired. ✅
2. **Auth** — passkey register/login, multi-user, sessions, recovery.
3. **Spotify** — connect, import artists, manage list.
4. **Events** — Ticketmaster source, nightly job, stored events, list UI with outlinks.
5. **Travel modes** — flight/drive/here-now/custom, mode switcher UI.
6. **Alerts** — Web Push + email, preferences, Add-to-Home-Screen onboarding.
7. **Money & polish** — affiliate links, more sources, icons/splash screens, accessibility pass.

## 8. Decisions (updated)
- **Hosting:** self-hosted on the owner's VPS in Docker, behind an existing reverse proxy. Domain is set only in `.env` (`APP_ORIGIN`, `WEBAUTHN_RP_ID`), never committed.
- **Database:** the existing MariaDB container (Drizzle ORM, `mysql2` driver) instead of Postgres. Plain lat/lng + haversine, no PostGIS needed.
- **Scheduling:** a separate worker process/container instead of Vercel Cron.
- **Home airport:** entered by each user in the app (IATA code), stored in the DB.
- **Coverage:** US and international events. Ticketmaster Discovery covers many countries; add more sources as needed. Flight mode uses worldwide airport/route data.
- **Scale:** ~5 users at first (fits Spotify dev-mode limits). The app is stateless and containerized so it can be moved or replicated later.

## 9. Open questions
- (Resolved above: airport, geography, user count, domain.)
- Home airport and city? 
- US-only, or international events too?
- Rough number of users? (Decides how much Spotify's dev-mode cap matters.)
- Do you already own a domain? Passkeys bind to the domain, so pick it before real users enroll.
