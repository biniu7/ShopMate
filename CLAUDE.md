# AI Rules - ShopMate

## Project Overview

ShopMate is an MVP web application for creating grocery shopping lists based on recipes assigned to specific days and meals. Features: weekly calendar, recipe management, AI-powered ingredient categorization, and PDF/TXT export.

**Goal**: User can plan meals and generate shopping list in <10 minutes from registration.

**Target Users**: Families (25-55), individuals, people reducing food waste, budget-conscious shoppers.

**Value**: Time savings, waste reduction, convenience, organization.

## Tech Stack

**Frontend**: Astro 5, React 18 (use `.astro` by default, `.tsx` only for interactivity), TypeScript 5, Tailwind CSS 4, Shadcn/ui (WCAG AA)

**Backend**: Supabase (PostgreSQL, Auth, RLS), Zod validation, Node.js Adapter

**AI**: OpenAI API direct (GPT-4o mini), 10s timeout, 2 retries, fallback to "Inne"

**Export**: @react-pdf/renderer for PDF/TXT

**Hosting**: Vercel (zero-config, SSL, CDN, edge functions), GitHub Actions (CI/CD)

**Monitoring**: Sentry, Plausible/GA4

## Development Commands

`npm run dev` (port 3000) | `npm run build` | `npm run preview` | `npm run lint` | `npm run lint:fix` | `npm run format`

Git hooks: husky + lint-staged configured

## Project Structure

`src/layouts/` `src/pages/` (routes) | `src/pages/api/` (prerender=false) | `src/middleware/` | `src/db/` | `src/types.ts` | `src/components/` (Astro & React) | `src/components/ui/` (Shadcn) | `src/components/hooks/` | `src/lib/` (services) | `src/lib/utils.ts` (cn()) | `src/styles/` | `src/assets/` | `public/`

## Architecture Patterns

**Components**: `.astro` by default (static), `.tsx` only for interactivity. Use `client:load|idle|visible`. Never "use client".

**API**: Uppercase methods (`GET()`, `POST()`), `prerender=false`, Zod validation, business logic in `src/lib/services`, Supabase via `context.locals.supabase`

**Database**: Use `SupabaseClient` from `src/db/supabase.client.ts`. Types in `src/db/database.types.ts`. Env: `SUPABASE_URL`, `SUPABASE_KEY`

**Styling**: Tailwind 4, `cn()` utility, arbitrary values, responsive/state variants, dark mode

**Paths**: `@/components`, `@/lib`, `@/lib/utils`

### Database Schema

**Tables**: `recipes` (name, instructions), `ingredients` (recipe_id, quantity, unit, name, sort_order), `meal_plan` (user_id, recipe_id, week_start_date, day_of_week 1-7, meal_type: breakfast|second_breakfast|lunch|dinner), `shopping_lists` (name, week_start/end_date), `shopping_list_items` (ingredient_name, quantity, unit, category, is_checked, sort_order)

**Indexes**: user_id, recipe_id, week_start_date, shopping_list_id

**RLS**: Enabled on all tables. Users access only their own data via `auth.uid() = user_id`. Ingredients via recipe ownership.

**Validation**: Recipe name 3-100 chars, instructions 10-5000 chars, min 1 ingredient, max 50 ingredients/recipe, max 20 recipes/list, 7 categories: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne

## Coding Standards

**Error Handling**: Early returns (guard clauses), avoid nested if, happy path last, user-friendly messages

**React**: Functional components + hooks, custom hooks in `src/components/hooks`, `React.memo()`, `React.lazy()`, `Suspense`, `useCallback`, `useMemo`, `useId()`, `useOptimistic`, `useTransition`

**Astro**: View Transitions API, content collections, middleware, `Astro.cookies`, `import.meta.env`, image optimization

**Accessibility**: ARIA landmarks, `aria-expanded`, `aria-controls`, `aria-live`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-current`. WCAG AA target.

**Linting**: ESLint (TypeScript strict, React, jsx-a11y), Prettier (Astro plugin), husky + lint-staged pre-commit

## AI Integration

**OpenAI Config**: GPT-4o mini, temp=0, max_tokens=500, timeout=10s, retry=2 (1s, 2s backoff)

**Categories (Polish)**: Nabiał (dairy), Warzywa (vegetables), Owoce (fruits), Mięso (meat/fish), Pieczywo (bread), Przyprawy (spices), Inne (other - fallback)

**Prompt**: "Kategoryzuj składniki do kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. Zwróć JSON: {\"1\": \"kategoria\", ...}"

**Implementation**: `src/lib/services/ai-categorization.service.ts` - `categorizeIngredientsWithRetry()` with exponential backoff. Max 100 ingredients. On failure: all → "Inne". Validate categories, log errors to Sentry.

**API Usage**: Call from `src/pages/api/shopping-lists/generate.ts` (prerender=false). Map results to shopping_list_items.

**Cost**: ~$0.0001/request, $0.40/month for 1000 users (4 lists/month, 50 ingredients avg)

## MVP Scope

**In Scope**: Recipe CRUD, weekly calendar (7 days × 4 meals: breakfast, second_breakfast, lunch, dinner), AI ingredient categorization, user auth (email/password), shopping list generation with aggregation, PDF/TXT export, responsive UI (mobile/desktop, WCAG AA), RLS

**Out of Scope**: Recipe imports (JPG/PDF/DOCX), native mobile apps, recipe sharing, external integrations, multi-language (Polish only), advanced planning (templates, drag-drop), notifications, diet/allergy mgmt, 2FA, unit conversion, price tracking, social features

## Best Practices

**Development**: Execute up to 3 actions, ask for approval. Clear variable names, explanatory comments, full implementations, defensive coding, simpler solutions first, explain root causes.

**Git**: Conventional commits, feature branches, meaningful messages (why, not what), focused commits, interactive rebase, git hooks (quality checks)

**Architecture**: Clean layers (entities, use cases, interfaces, frameworks). Dependencies point inward. Ports & adapters pattern. Domain entities without framework deps.

**Code Quality**: ESLint (project-specific rules, airbnb/standard base, --fix in CI), Prettier (consistent config, format on save, printWidth 80-120), husky + lint-staged

**Note**: Project uses Astro (not Next.js), so focus on Astro-specific patterns. No Redux/React Router - using Astro routing.

## Validation Schemas (Zod)

**Location**: `src/lib/validation/`

**Recipe** (`recipe.schema.ts`): name (3-100 chars, trim), instructions (10-5000 chars, trim), ingredients array (1-50 items). Ingredient: quantity (positive, optional), unit (max 50, optional), name (1-100 chars), sort_order (int, min 0, default 0)

**Meal Plan** (`meal-plan.schema.ts`): recipe_id (uuid), week_start_date (YYYY-MM-DD regex), day_of_week (1-7), meal_type enum (breakfast, second_breakfast, lunch, dinner)

**Shopping List** (`shopping-list.schema.ts`): name (max 200, default 'Lista zakupów'), week_start/end_date (YYYY-MM-DD regex, optional), items (max 100). Item: ingredient_name (1-100), quantity (positive, optional), unit (max 50, optional), category enum (7 categories, default 'Inne'), is_checked (boolean, default false), sort_order (int, min 0, default 0)

**Auth** (`auth.schema.ts`): email (email format, lowercase, trim), password (8-100 chars), registerSchema with confirmPassword refine, loginSchema

**API Usage**: Import schema, `schema.safeParse(body)`, check `validation.success`, return `validation.error.flatten()` or use `validation.data`. Auth check: `supabase.auth.getUser()`, return 401 if error.

## Export Functionality

**Location**: `src/lib/services/`

**PDF** (`pdf-export.service.tsx`): Use `@react-pdf/renderer`. Create `<Document>` with `<Page>` (A4, Helvetica). Group items by category. StyleSheet: header (20px, center, bold), subheader (12px, #666), categoryTitle (14px, bold, uppercase), item (11px, flexDirection row), checkbox (☐, 12px), footer (absolute bottom, 9px, #999). Functions: `generateShoppingListPDF(list, items): Promise<Blob>`, `downloadPDF(blob, filename)` using URL.createObjectURL

**TXT** (`txt-export.service.ts`): Header: "LISTA ZAKUPÓW SHOPMATE", list name, dates, separator (50x =). Group by category. Format: CATEGORY (uppercase), dashes, items (qty unit name), empty line. Footer: separator, timestamp. UTF-8 encoding. Functions: `generateShoppingListTXT(list, items): string`, `downloadTXT(content, filename)` with Blob type 'text/plain;charset=utf-8'

**Component** (`src/components/ShoppingListExport.tsx`): React useState for loading. Buttons: "Eksportuj PDF" (with loading state), "Eksportuj TXT" (outline variant). Filename format: `${list.name.replace(/\s+/g, '-').toLowerCase()}-${date}.pdf|txt`. Error handling with console.error + alert.

**Category Order**: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne (always in this order)
