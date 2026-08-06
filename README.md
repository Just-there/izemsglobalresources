# IZEMS Global Resources Ltd — Website & Business Dashboard

A standard React + TanStack Start application with a Supabase (PostgreSQL)
backend. It has **no dependency on any hosting vendor's runtime**: everything
is configured through environment variables, so it runs identically on your
laptop, a VPS, Vercel, Netlify, Cloudflare, or Render.

## 1. Run it locally

```bash
bun install          # or: npm install
cp .env.example .env # then fill in your Supabase values
bun run dev          # http://localhost:8080
```

Admin dashboard: <http://localhost:8080/admin> — sign in at `/auth` with your
real owner email and password. There is **no hardcoded/local-only password**;
the same credentials work locally and in production.

## 2. Build for production

```bash
bun run build
bun run start        # serves the production build
```

Deploy the built output to any Node-compatible host. Set the same environment
variables in that host's dashboard.

## 3. Move to your own Supabase project

1. Create a free project at <https://supabase.com/dashboard>.
2. In your new project, open **SQL Editor** and run every file in
   `supabase/migrations/` **in filename order** (they are timestamped). To get
   one single script to paste, run:

   ```bash
   cat supabase/migrations/*.sql > izems-schema.sql
   ```

3. **Storage:** create a bucket named `media`. Product/owner images are stored
   there. Re-upload images from the dashboard, or copy the files across.
4. **Auth:** enable Email/Password. Turn on "Leaked password protection".
   Add your production URL and `http://localhost:8080` to the allowed redirect
   URLs list.
5. Copy the new project's URL, publishable/anon key and service-role key into
   `.env` (see `.env.example`).
6. Sign up once with `francisizegbune@gmail.com` — that address is seeded as the
   **Owner** account and receives full admin rights automatically.
7. Optional: export your existing data (products, categories, quotes, orders)
   as CSV and import it into the matching tables in the new project.

## 4. Access control model

| Level | What they can do |
| --- | --- |
| **Owner** | Everything, plus create/disable/delete admin and staff logins. Cannot be demoted, disabled, or deleted by anyone. |
| **Admin** | Full dashboard access (products, inventory, orders, quotes, messages, settings). |
| **Staff** | Same dashboard access, but cannot manage accounts. |
| **Customer** | Normal website account, no dashboard access. |

- Nobody can grant themselves admin access — role changes are blocked in the
  database itself unless the request comes from the Owner.
- Disabling an account revokes dashboard access instantly and signs the user
  out everywhere.
- Owner-only account management lives at **Dashboard → Admin Management**.
- Change your own password at **Dashboard → My Account** (requires your current
  password). Forgotten passwords use the email reset link on `/auth`.

## 5. Product images

Upload images from **Dashboard → Products** (per-product image picker). Files
are stored in the `media` bucket and served through `/api/public/media/<path>`,
which needs only the public key — so images work on any host. If a file is ever
missing, a branded placeholder is shown instead of a broken image.

## 6. Environment variables

See `.env.example`. Only `SUPABASE_SERVICE_ROLE_KEY` is secret; keep it out of
the browser and out of version control.

## Tech stack

React 19 · TanStack Start/Router · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (PostgreSQL, Auth, Storage) · Recharts