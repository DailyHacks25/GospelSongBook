# WorshipJesusChrist

A bilingual (**English & हिंदी**) Gospel song book. Browse worship, prayer and
seasonal songs by category, search the lyrics, sign in with Google to submit
songs, and let admins curate what is published — with calm, light-filled
background photography from Unsplash.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS**,
**shadcn/ui**-style components, **SQLite via `better-sqlite3`** (no ORM),
**Auth.js (NextAuth v5) Google sign-in**, and the **Unsplash API**.

---

## Features

- **Language sections** — English and Hindi, with a persistent, visible
  language switch. Every category name and interface label exists in both
  languages (`en` / `hi` in the URL, `lang` on the document, Devanagari web
  font included).
- **Song categories** — Worship (आराधना), Prayer Songs (प्रार्थना गीत), Easter
  (ईस्टर), Good Friday (गुड फ्राइडे), Palm Sunday (पाम संडे), Christmas Songs
  (क्रिसमस गीत), Bible Passage-Related Songs (बाइबल पद से जुड़े गीत), Others
  (अन्य). Admins can add/edit more.
- **Song book** — browse by language and category, full-text search over
  titles and lyrics, dedicated song pages showing title, language, category,
  lyrics and an optional background image.
- **Background imagery** — curated Unsplash searches per category (light
  scenes: sunrises, skies, clouds, light through windows, landscapes) with a
  strict safety filter (below), dark gradient overlays for readability,
  in-memory + per-song caching to respect rate limits, photographer
  attribution per the Unsplash API guidelines, and a built-in gradient
  fallback.
- **Authentication & roles** — Google sign-in (Auth.js/NextAuth v5, JWT
  sessions, secure cookies). Users and roles live in SQLite; roles are
  `admin` and `user`.
- **Moderated submissions** — signed-in users submit songs that start as
  `pending` and stay hidden until an admin approves them. Approved songs
  appear in the song book immediately. Admins can approve/reject, edit or
  delete any song, and manage categories.

---

## Requirements

- **Node.js ≥ 22** (`better-sqlite3` v13 requires it; matches Vercel's Node 22
  runtime)
- npm 10+
- A Google OAuth client (for sign-in) and an Unsplash access key (for
  backgrounds) — see below. The app runs without Unsplash (fallback gradient),
  but sign-in needs the Google credentials.

---

## Local setup

```bash
# 1. Clone and install
git clone https://github.com/<you>/GospelSongBook.git
cd GospelSongBook
npm install

# 2. Configure environment
cp .env.example .env.local
#    then edit .env.local — at minimum set:
#      AUTH_SECRET            (generate: npx auth secret   or   openssl rand -base64 32)
#      AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
#      ADMIN_GOOGLE_EMAIL     (your Google address — see "Default admin" below)
#      UNSPLASH_ACCESS_KEY    (optional but recommended)

# 3. Create and seed the database (categories + admin placeholder)
npm run db:seed

# 4. Run
npm run dev            # http://localhost:3000
```

Other commands:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint (next/core-web-vitals)
npm test               # vitest unit tests
npm run build          # production build
npm start              # serve the production build
npm run db:promote-admin -- you@example.com    # grant admin
npm run db:demote-admin  -- someone@example.com # revoke admin
```

The SQLite file lives at `DATABASE_PATH` (default `./data/app.db`). The schema
is applied and the canonical categories are upserted automatically on first
boot, so `npm run db:seed` is idempotent — run it whenever you like.

---

## Environment variables

See [`.env.example`](.env.example) for the full annotated list.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_PATH` | no | SQLite file location. Default `./data/app.db` locally, `/tmp/worshipjesuschrist.db` on Vercel. |
| `AUTH_SECRET` | **yes** | Signs JWTs and cookies. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` | **yes** | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | **yes** | Google OAuth client secret. |
| `AUTH_URL` | recommended | Public base URL, e.g. `https://your-app.vercel.app`. |
| `ADMIN_GOOGLE_EMAIL` | recommended | Google account that receives admin (seeded as a placeholder; claimed at first sign-in). **Change this immediately.** |
| `UNSPLASH_ACCESS_KEY` | recommended | Unsplash API access key. Without it the app uses the built-in gradient backgrounds. |
| `UNSPLASH_CACHE_TTL_SECONDS` | no | In-memory Unsplash cache TTL (default `1800`). |

### Google OAuth setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/) →
   **APIs & Services → Credentials → Create credentials → OAuth client ID**
   (type: *Web application*).
2. Add **Authorised redirect URIs**:
   - local: `http://localhost:3000/api/auth/callback/google`
   - production: `https://<your-domain>/api/auth/callback/google`
3. Copy the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

### Unsplash setup

1. Create an account at [unsplash.com/developers](https://unsplash.com/developers)
   and register an application.
2. Copy the **Access Key** into `UNSPLASH_ACCESS_KEY`.

---

## Default admin & roles

There are no passwords anywhere. Access is defined by which **Google account**
you sign in with:

1. Set `ADMIN_GOOGLE_EMAIL` to your own Google address (do this **before**
   deploying publicly).
2. `npm run db:seed` (or first boot) creates that address as an **admin
   placeholder** row in SQLite.
3. The first time you sign in with that Google account, it is linked to the
   placeholder and you have the admin role — immediately.

**Change access immediately after setup:**

```bash
# Promote another Google account to admin (works even before its first sign-in)
npm run db:promote-admin -- new-admin@example.com

# Revoke someone's admin role (demotes to a regular user)
npm run db:demote-admin -- old-admin@example.com
```

Then update `ADMIN_GOOGLE_EMAIL` to your own address (or unset it once you
have promoted yourself via the script). Roles are re-read from the database on
every request, so demotions apply on the next page load.

---

## Tests

```bash
npm test
```

Unit tests (Vitest) cover the core logic:

- `src/lib/domain/song-status.test.ts` — song status transitions
  (`pending → approved | rejected`, resubmission, illegal moves).
- `src/lib/auth/permissions.test.ts` — role-based access (review, edit/delete
  ownership, visibility of unpublished songs, status-change rights).
- `src/lib/validation/songs.test.ts` — input validation for songs and
  categories (titles, lyrics, languages, category ids, query parameters).
- `src/lib/unsplash/filter.test.ts` — the safety filter and image selection.
- `src/lib/unsplash/cache.test.ts` — TTL/LRU cache behaviour.
- `src/lib/unsplash/client.test.ts` — API client caching, auth headers and
  error mapping (mocked fetch).
- `src/lib/db/queries.test.ts` — schema, idempotent seeding, and the typed
  query layer against an in-memory SQLite database.

---

## Deploy: GitHub → Vercel

### 1. Push to GitHub

```bash
git init                                   # if not already a repo
git add .
git commit -m "WorshipJesusChrist: bilingual gospel song book"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   the GitHub repository. Vercel detects Next.js automatically; no build
   settings are needed (`npm run build` is the default).
2. Open **Project Settings → Environment Variables** and add:

   | Variable | Value |
   | --- | --- |
   | `AUTH_SECRET` | `openssl rand -base64 32` output |
   | `AUTH_GOOGLE_ID` | Google OAuth client ID |
   | `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
   | `AUTH_URL` | `https://<your-project>.vercel.app` |
   | `ADMIN_GOOGLE_EMAIL` | your Google address |
   | `UNSPLASH_ACCESS_KEY` | Unsplash access key |
   | `DATABASE_PATH` | `/tmp/worshipjesuschrist.db` (optional — this is the default on Vercel) |

3. Deploy. On first boot the app creates the database in `/tmp`, applies the
   schema and seeds the eight categories and the admin placeholder.
4. In Google Cloud Console, add the production redirect URI
   `https://<your-project>.vercel.app/api/auth/callback/google`.
5. Sign in with the `ADMIN_GOOGLE_EMAIL` Google account — you are the admin.

---

## SQLite on Vercel — the explicit trade-off

**Choice: `better-sqlite3` with the database file on a configurable path —
`./data/app.db` locally, `/tmp` on Vercel — and no external database service.**

`better-sqlite3` is a native module that needs the **Node.js runtime** (all our
routes declare `runtime = "nodejs"`; the middleware is locale-only and never
touches the database) and a **writable filesystem**. Vercel Functions provide
that, but only in `/tmp`, and Vercel's filesystem is **ephemeral**:

- every cold-started function instance gets its own fresh `/tmp`,
- data is lost when instances are recycled or the project is redeployed.

Consequences on Vercel:

- the app **runs correctly out of the box** (schema + seed are applied on
  boot, so every instance is always valid),
- writes are instance-local: songs submitted on one lambda may not be visible
  to another, and everything resets on redeploy. Fine for demos, portfolios
  and low-traffic previews; **not** fine as a durable production store.

**Why we chose it anyway:** the stack specifies SQLite via `better-sqlite3`
used directly, and this keeps deployment to *zero* extra services — only
environment variables, as required.

**When you need durability, pick one:**

1. **Persistent-host deployment (recommended, smallest change):** deploy the
   same app to a host with a real disk — Fly.io, Railway, Render, or a small
   VPS (Docker/`npm start`). Set `DATABASE_PATH=/data/app.db` on a mounted
   volume and everything (users, roles, songs) persists across deploys. The
   app needs nothing else.
2. **Hosted SQLite (Turso/libSQL):** Turso runs SQLite in the cloud with an
   HTTP/libSQL driver. Using it means swapping the small query layer in
   `src/lib/db/queries/*` for `@libsql/client` (async), which is a contained
   change — the rest of the app talks to typed query functions only, never to
   `better-sqlite3` directly.
3. **Vercel-native storage:** Vercel Blob / Postgres — also a query-layer swap.

The `README` documents the choice here so it is never a surprise: **on Vercel
this app is fully functional but ephemeral; choose option 1 or 2 for
durable production data.**

---

## Background image policy (Unsplash)

The requirement: **no image may show the face of Jesus Christ or God the
Father.** Unsplash has no face recognition in its API, so the app is
deliberately conservative (`src/lib/unsplash/filter.ts`):

1. **Curated queries only.** Every category maps to fixed light/nature
   searches (sunrise, clouds, rays of light, windows, landscapes). Song
   titles are **never** used in image queries.
2. **Hard reject list.** Photos are dropped when description, alt text or
   tags mention religious figures or art (Jesus, Christ, God, messiah,
   crucifix, cross, saint, angel, nativity, bible, church, stained glass,
   statue, icon, …) **or any people at all** (a face in art may be a holy
   figure — we do not take the risk).
3. **Prefer the light.** Remaining photos are scored towards sunrise/sunset,
   skies, clouds, rays, windows and landscapes.
4. **Fallback.** Anything uncertain falls back to the built-in sky-and-light
   CSS gradient, so the UI is always calm and readable.

This is an automated best-effort filter — admins should still glance at
backgrounds while curating.

Attribution: photos are hotlinked from `images.unsplash.com` and every use is
credited as **“Photo by {photographer} on Unsplash”** with links to the
photographer's profile and the photo page (Unsplash API guidelines).

---

## Data model

```
users        id, google_id (unique), email (unique), name, image,
             role ('admin' | 'user'), created_at, updated_at

categories   id, slug (unique), name_en, name_hi, sort_order,
             created_at, updated_at

songs        id, title, language ('en' | 'hi'), category_id → categories,
             lyrics, status ('pending' | 'approved' | 'rejected'),
             author_id → users, background_image (JSON + attribution),
             review_note, reviewed_by → users, reviewed_at,
             created_at, updated_at
```

Status transitions (`src/lib/domain/song-status.ts`):

```
pending  ⇄ approved     (admin approve / unpublish)
pending  ⇄ rejected     (admin reject / author resubmit)
approved ⇄ rejected     (admin correction)
```

Authors may edit/delete their own songs while `pending` or `rejected`;
admins manage everything.

---

## Project structure

```
├── scripts/
│   ├── seed.ts                 # idempotent seed: categories + admin placeholder
│   └── set-role.ts             # promote/demote a Google account
├── src/
│   ├── app/
│   │   ├── api/                # REST handlers (auth, songs, categories, review)
│   │   ├── [locale]/           # /en/... and /hi/... pages
│   │   ├── page.tsx            # bilingual landing page (/)
│   │   ├── layout.tsx          # <html lang>, fonts, toasts
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn/ui-style primitives
│   │   ├── layout/             # header, footer, language switcher, user menu
│   │   ├── songs/              # song cards, form, search, status badge
│   │   ├── backgrounds/        # Unsplash background + attribution
│   │   ├── admin/              # review actions, category manager, delete
│   │   └── auth/               # Google sign-in button
│   ├── lib/
│   │   ├── db/                 # schema, seed, connection, typed queries
│   │   ├── auth/               # NextAuth config, RBAC, route guards
│   │   ├── unsplash/           # client, safety filter, TTL cache, backgrounds
│   │   ├── validation/         # zod schemas (songs, categories, common)
│   │   ├── domain/             # song status state machine
│   │   ├── i18n/               # en/hi dictionaries + helpers
│   │   └── ...
│   └── middleware.ts           # locale prefix + <html lang> header
├── tests are colocated: src/lib/**/*.test.ts
├── .env.example
└── README.md
```

---

## Security notes

- JWT session strategy (NextAuth v5) with `httpOnly`, `SameSite=Lax` and
  `Secure` (production) cookies; `AUTH_SECRET` is required in production.
- Every input is validated with zod at the server boundary; SQL uses
  prepared statements and escaped `LIKE` patterns only.
- Route handlers re-read the user's role from SQLite on every request
  (never trusting the JWT alone) and enforce ownership rules for
  edit/delete/status changes.
- Mutating requests check the `Origin` header (CSRF defence in depth on top
  of the SameSite cookie).
- The sign-in page accepts only same-site relative callback URLs (no open
  redirects).
- No passwords or OAuth tokens are stored — only the Google account id,
  email, name and avatar URL.

## License

MIT
