# MealPlanner — Slimme Maaltijdplanner

@AGENTS.md

## Stack
- Next.js 16 + TypeScript + Tailwind CSS 4
- Supabase (auth via Magic Link, Postgres DB met RLS)
- AI: Gemini 2.0 Flash via `@ai-sdk/google` + Vercel AI SDK
- UI: `lucide-react`, `date-fns` (Nederlandse locale)

## Supabase
- Project ref: `qtrjvryrgvnzueuuadkk` (Frankfurt)
- Schema in `supabase/schema.sql` — tabellen: profiles, meals, recipes, recipe_likes, shopping_list
- Alle tabellen hebben Row Level Security
- Auto-profile trigger bij signup

## Pagina's
- `/planner` — Weekplanner (ontbijt/lunch/diner/snack per dag)
- `/deals` — Budget recepten op basis van budget/personen/dagen (AI)
- `/feed` — Community recepten feed (delen, liken)
- `/feed/new` — Nieuw recept publiceren
- `/shopping` — Boodschappenlijst (afvinken, verwijderen)
- `/profile` — Profielpagina + uitloggen
- `/auth/login` — Magic Link login
- `/scanner` — Koelkast scanner (foto → AI recepten) — niet in nav maar wel bereikbaar
- `/nutrition` — Schijf van 5 voedingstracker — niet in nav maar wel bereikbaar

## API Routes
- `POST /api/ai/generate` — Maaltijdsuggesties (Gemini)
- `POST /api/ai/scan` — Koelkastfoto analyseren (Gemini)
- `POST /api/deals` — Budget recepten genereren (Gemini)

## Env vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Conventies
- Nederlandse UI (nl locale)
- Donker thema (prefers-color-scheme: dark)
- Groene primary kleur (#16a34a / #22c55e dark)
- Bottom nav met 5 tabs: Planner, Deals, Recepten, Lijst, Profiel

## GitHub
- Repo: MarcelvanGastel/mealplanner
