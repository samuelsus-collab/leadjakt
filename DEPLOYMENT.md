# Deploying LeadJakt

LeadJakt is a **Next.js 16 + Supabase + Anthropic** app. It deploys to
**Vercel** (see `vercel.json`, region `arn1` / Stockholm). End-to-end setup is
about 15 minutes.

## 1. Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql` — tables, enums, RLS policies, triggers
   - `supabase/migrations/002_leads_notes.sql` — adds the `notes` column
3. **Auth → URL Configuration:**
   - **Site URL** → your production domain (e.g. `https://leadjakt.vercel.app`)
   - **Redirect URLs** → add `https://<your-domain>/callback`

   The magic-link login redirects back to `/callback`; without this entry the
   login loops back to the sign-in page.
4. From **Settings → API**, copy the **Project URL** and the **anon** key.

## 2. Anthropic

Get an API key at [console.anthropic.com](https://console.anthropic.com).
Scout uses the **web search** server tool, which is billed per search — make
sure the account has credits.

## 3. Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
2. Add environment variables (Production + Preview):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   > `SUPABASE_SERVICE_ROLE_KEY` is listed in `.env.example` but **not used by
   > any code today** — leave it out unless you add server-side admin logic.
3. **Deploy.** `vercel.json` provides the build command and region.
4. Once the domain exists, go back to Supabase step 1.3 and set the real domain.

## Environment variables

| Variable | Required | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Browser + server Supabase clients, auth proxy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Same — RLS enforces per-user access |
| `ANTHROPIC_API_KEY` | ✅ | Scout, diagnosis, and outreach generation |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Defined in `createServiceClient()` but currently uncalled |

## Notes & gotchas

- **Auth model:** email magic link (`signInWithOtp`). Every table has Row Level
  Security, so users only ever see their own leads/diagnoses/outreach.
- **Scout latency:** web search can take 30–60s. `app/api/scout/route.ts` sets
  `maxDuration = 60`, which is the ceiling on Vercel's Hobby plan — use Pro for
  heavy or frequent scouting.
- **Local development:** copy `.env.example` to `.env.local`, fill in the same
  values, then `npm install && npm run dev` (http://localhost:3000).
- **Health check:** after deploy, open `/login`, request a magic link, and
  confirm it lands you on `/dashboard`. If it returns to `/login`, the Supabase
  redirect URL (step 1.3) is missing or wrong.
