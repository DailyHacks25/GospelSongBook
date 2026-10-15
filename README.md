# WorshipJesusChrist

A bilingual (**English & हिंदी**) Gospel song book. Browse worship, prayer and
seasonal songs by category, search the lyrics, sign in to submit songs, and
let admins curate what is published — with calm, light-filled background
photography from Unsplash.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS**,
**shadcn/ui**-style components, **SQLite via `better-sqlite3`** (no ORM),
**Auth.js (NextAuth v5) email + password sign-in**, and the **Unsplash API**.

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
- **Authentication & roles** — email + password sign-in (Auth.js/NextAuth v5,
  JWT sessions, secure cookies, scrypt-hashed passwords, login rate limiting).
  Users and roles live in SQLite; roles are `admin` and `user`. A default
  admin account is seeded so you can sign in immediately.
- **Moderated submissions** — signed-in users submit songs that start as
  `pending` and stay hidden until an admin approves them. Approved songs
  appear in the song book immediately. Admins can approve/reject, edit or
  delete any song, and manage categories.

---

## Requirements

- **Node.js ≥ 22** (`better-sqlite3` v13 requires it; matches Vercel's Node 22
  runtime)
- npm 10+
- An Unsplash access key (optional but recommended — without it the app uses
  the built-in gradient backgrounds)

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
#      AUTH_SECRET         (generate: npx auth secret   or   openssl rand -base64 32)
#      ADMIN_EMAIL / ADMIN_PASSWORD   (your admin sign-in — CHANGE the defaults)
#      UNSPLASH_ACCESS_KEY (optional but recommended)

# 3. Create and seed the database (categories + default admin account)
npm run db:seed

# 4. Run
npm run dev            # http://localhost:3000
```

**Default admin sign-in:** `admin@example.com` / `admin123` (override with
`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Change these immediately — see
“Default admin & roles” below.

Other commands:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint (next/core-web-vitals)
npm test               # vitest unit tests
npm run build          # production build
npm start              # serve the production build
npm run db:create-user -- user@example.com 'StrongPass1'         # create a member account
npm run db:create-user -- admin@example.com 'NewPass123' admin   # rotate the admin password
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
| `AUTH_URL` | recommended | Public base URL, e.g. `https://your-app.vercel.app`. |
| `ADMIN_EMAIL` | no | Default admin sign-in email (default `admin@example.com`). |
| `ADMIN_PASSWORD` | no | Default admin password (default `admin123`). **Change immediately.** |
| `UNSPLASH_ACCESS_KEY` | recommended | Unsplash API access key. Without it the app uses the built-in gradient backgrounds. |
| `UNSPLASH_CACHE_TTL_SECONDS` | no | In-memory Unsplash cache TTL (default `1800`). |

### Sign-in

Sign-in is **email + password** (no OAuth setup needed). Accounts live in the
`users` table as salted scrypt hashes. The seed creates the default admin
account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; create member accounts with
`npm run db:create-user`.

### Unsplash setup

1. Create an account at [unsplash.com/developers](https://unsplash.com/developers)
   and register an application.
2. Copy the **Access Key** into `UNSPLASH_ACCESS_KEY`.

---

## Default admin & roles

There are no passwords stored in plain text — accounts use salted scrypt
hashes — but the app ships with a **known default admin** so you can sign in
immediately:

```
Email:    admin@example.com      (ADMIN_EMAIL)
Password: admin123               (ADMIN_PASSWORD)
```

**Change access immediately after setup:**

```bash
# Rotate the admin password (also updates role — the one-stop command)
npm run db:create-user -- admin@example.com '<new-strong-password>' admin

# Create a member account (role: user) — members can submit songs
npm run db:create-user -- member@example.com '<strong-password>'

# Promote an existing member to admin
npm run db:promote-admin -- member@example.com

# Revoke someone's admin role (demotes to a regular user)
npm run db:demote-admin -- someone@example.com
```

Then update `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your environment to match
(or leave them — they only create the account if it does not exist yet; they
never overwrite a rotated password). Roles are re-read from the database on
every request, so demotions apply on the next page load.

Sign-in is rate-limited per account (5 failed attempts → 15-minute lockout).

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
   | `AUTH_URL` | `https://<your-project>.vercel.app` |
   | `ADMIN_EMAIL` | your admin email (change from the default) |
   | `ADMIN_PASSWORD` | your admin password (change from `admin123`) |
   | `UNSPLASH_ACCESS_KEY` | Unsplash access key |
   | `DATABASE_PATH` | `/tmp/worshipjesuschrist.db` (optional — this is the default on Vercel) |

3. Deploy. On first boot the app creates the database in `/tmp`, applies the
   schema and seeds the eight categories plus the admin account.
4. Sign in at `/en/signin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` — you are
   the admin. **Rotate the password immediately** with
   `npm run db:create-user` (or change `ADMIN_PASSWORD` and redeploy).

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
users        id, email (unique), name, image,
             role ('admin' | 'user'), password_hash (salted scrypt),
             created_at, updated_at

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
│   ├── seed.ts                 # idempotent seed: categories + default admin
│   ├── create-user.ts          # create/update an account (set/rotate password)
│   └── set-role.ts             # promote/demote an existing account
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
│   │   └── auth/               # sign-in form (email + password)
│   ├── lib/
│   │   ├── db/                 # schema, seed, connection, typed queries
│   │   ├── auth/               # NextAuth config, password hashing, RBAC, guards
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
- Login is rate-limited per account (5 failures → 15-minute lockout) and
  passwords are stored as salted scrypt hashes verified in constant time.
- The sign-in page accepts only same-site relative callback URLs (no open
  redirects).
- Only the account email, display name and password hash are stored — no
  third-party identity data or OAuth tokens.

## License

MIT
