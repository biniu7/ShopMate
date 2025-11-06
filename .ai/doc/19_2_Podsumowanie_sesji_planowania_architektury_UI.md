# Podsumowanie Sesji Planowania Architektury UI - ShopMate MVP

**Data:** 2025-11-06
**Wersja:** 1.0
**Bazuje na:** `.ai/doc/19_1_sesji_planowania_architektury_UI.md`

---

## Decisions

Poniżej przedstawiono kluczowe decyzje architektoniczne podjęte podczas sesji planowania UI dla ShopMate MVP:

### 1. **Strategia Renderowania i Routing**
Przyjęto podejście "static first" z wykorzystaniem architektury Astro islands. Strony główne (login, register, dashboard) będą statycznymi layoutami Astro (.astro), a interaktywne sekcje (RecipeForm, Calendar, ShoppingListGenerator) będą komponentami React (.tsx) z selektywną hydratacją (`client:load`, `client:visible`).

### 2. **Architektura Komponentu Kalendarza**
Kalendarz tygodniowy (7 dni × 4 posiłki = 28 komórek) zostanie zaimplementowany jako kompozycja mniejszych komponentów: `Calendar.tsx` → `WeekNavigator.tsx` + `CalendarGrid.tsx` → `DayColumn.tsx` × 7 → `MealCell.tsx` × 4. State management wykorzysta TanStack Query dla fetch/cache, URL state dla `week_start_date`, oraz optimistic updates dla natychmiastowego UI feedback.

### 3. **Przepływ Generowania Listy Zakupów**
Proces generowania listy będzie realizowany jako wieloetapowy wizard z progress barem:
- **Etap 1:** Wybór trybu (Z kalendarza / Z przepisów)
- **Etap 2:** Selekcja posiłków lub przepisów z licznikiem
- **Etap 3:** Loading state z progress (składniki → agregacja → AI kategoryzacja)
- **Etap 4:** Preview i edycja z możliwością inline modyfikacji

### 4. **Strategia Paginacji Listy Przepisów**
Zastosowanie hybrydowego modelu: infinite scroll z "Load more" button fallback. Initial load 20 przepisów, scroll detection do 80% listy wyświetla button, z ARIA live region komunikującym stan ("Załadowano 40 z 120 przepisów").

### 5. **System Powiadomień Toast**
Toast notifications będą pozycjonowane kontekstowo (top-right desktop, bottom center mobile) z ARIA live regions dla accessibility. Typy: Success (auto-dismiss 3s), Error (manual dismiss), Info (3s), Warning (5s). Maksymalnie 3 toasty naraz (FIFO queue).

### 6. **Optimistic UI Updates**
Selektywne stosowanie optimistic UI:
- ✅ **TAK:** Usuwanie przypisania z kalendarza, toggle checkbox listy zakupów, przypisywanie przepisu
- ❌ **NIE:** Dodawanie/usuwanie przepisu, generowanie listy zakupów (zbyt złożone)

### 7. **Organizacja Modal Dialogs**
Trzy typy modali:
- **Typ 1 (Recipe Picker):** Large modal (max 900px) z search + infinite scroll, lazy loaded
- **Typ 2 (Confirmation):** Small modal (max 400px) dla destructive actions z AlertDialog
- **Typ 3 (PDF Preview):** Fullscreen mobile / Large desktop z iframe

### 8. **Strategia Cache'owania (TanStack Query)**
Zróżnicowane strategie:
- **Przepisy:** staleTime 5min, cacheTime 30min, no refetch on focus
- **Kalendarz:** staleTime 0 (zawsze fresh), cacheTime 5min, refetch on focus
- **Listy zakupów:** staleTime/cacheTime Infinity (immutable snapshot)

### 9. **Error Handling**
Wielowarstwowa strategia:
- **Warstwa 1:** React Error Boundary dla unexpected errors + Sentry
- **Warstwa 2:** API errors (401 → redirect, 404 → NotFound, 500 → toast + retry)
- **Warstwa 3:** Form validation (Zod + Shadcn Form)

### 10. **Nawigacja Mobile**
Hybrydowy model:
- **Mobile (<768px):** Bottom navigation bar (4 główne akcje: Przepisy, Kalendarz, Lista, Historia) + Hamburger menu (Dashboard, Ustawienia, Wyloguj)
- **Desktop (≥1024px):** Sidebar po lewej
- **Tablet (768-1023px):** Top bar z inline links

---

## Matched Recommendations

Najistotniejsze rekomendacje dopasowane do architektury ShopMate MVP:

### 1. **Performance-First Approach**
Wykorzystanie Astro islands architecture pozwoli utrzymać bundle <100KB i LCP <2.5s (cel z PRD). Lazy loading dla ciężkich komponentów (kalendarz, modal z przepisami) z `React.lazy()` + `Suspense`.

### 2. **Kompozycyjna Architektura UI**
Hierarchiczna struktura komponentów z jasnym separation of concerns:
- Layout components (`src/layouts/`)
- UI primitives (`src/components/ui/` - Shadcn)
- Feature components (`src/components/features/` - business logic)
- Reusable hooks (`src/components/hooks/`)

### 3. **TanStack Query jako Single Source of Truth**
Centralizacja state management dla danych serwerowych z inteligentnym cache'owaniem. Eliminacja redux/zustand dla server state. Local state tylko dla UI state (modal open/close, form inputs).

### 4. **Accessibility-First Design (WCAG AA)**
- ARIA landmarks, labels, live regions we wszystkich interaktywnych komponentach
- Minimum 44px tap targets na mobile
- Focus management w modalach (focus trap, return focus)
- Skip to main content link
- Keyboard navigation support

### 5. **Responsive Design z Mobile-First**
Breakpoints:
- Mobile: <768px (accordion calendar, bottom nav, fullscreen modals)
- Tablet: 768-1023px (horizontal scroll calendar, top bar)
- Desktop: ≥1024px (grid calendar, sidebar)

### 6. **Progressive Enhancement**
Graceful degradation przy failure AI kategoryzacji (fallback do "Inne"). Retry mechanisms z exponential backoff. Informacyjne toast messages zamiast error states dla expected failures.

### 7. **Deep Linking i URL State**
`week_start_date` w query params dla kalendarza umożliwia:
- Bookmarking konkretnego tygodnia
- Sharing links
- Browser back/forward navigation
- SEO benefits

### 8. **Proaktywne Prefetching**
- Hover na przepisie → prefetch szczegółów
- Ładowanie kalendarza → prefetch sąsiednich tygodni
- Improve perceived performance

### 9. **Error Boundary Strategy**
Multi-layer approach:
- Global Error Boundary (unexpected crashes)
- API Error Interceptors (expected API errors)
- Form Validation (user input errors)
- Centralized error messages (`src/lib/errors.ts`)

### 10. **Component Library Consistency**
Shadcn/ui jako foundation dla consistency:
- Copy-paste components (full control)
- Built on Radix UI (accessibility)
- Tailwind styling (customizable)
- TypeScript support

---

## UI Architecture Planning Summary

### A. Główne Wymagania dotyczące Architektury UI

**Cel Biznesowy:** Umożliwić użytkownikowi stworzenie listy zakupów w <10 minut od rejestracji.

**Wymagania Funkcjonalne:**
1. **Zarządzanie Przepisami:** CRUD operations z walidacją (min 1, max 50 składników)
2. **Kalendarz Tygodniowy:** 7 dni × 4 posiłki (śniadanie, drugie śniadanie, obiad, kolacja)
3. **Generowanie Listy Zakupów:** Dwa tryby (z kalendarza / z przepisów) z AI kategoryzacją (7 kategorii)
4. **Eksport:** PDF/TXT z grupowaniem po kategoriach

**Wymagania Niefunkcjonalne:**
- Performance: Bundle <100KB, LCP <2.5s
- Accessibility: WCAG AA compliance
- Responsywność: Mobile-first, 3 breakpoints
- Bezpieczeństwo: RLS, httpOnly cookies, CSRF protection

### B. Kluczowe Widoki, Ekrany i Przepływy Użytkownika

**Mapa Widoków:**

```
/
├── /login (public)
├── /register (public)
├── /dashboard (authenticated)
│
├── /recipes (authenticated)
│   ├── /recipes (lista z search + infinite scroll)
│   ├── /recipes/new (formularz dodawania)
│   └── /recipes/[id] (szczegóły + edycja)
│
├── /calendar (authenticated)
│   └── ?week=2025-01-20 (deep linking)
│
└── /shopping-lists (authenticated)
    ├── /shopping-lists (historia)
    ├── /shopping-lists/generate (wizard)
    └── /shopping-lists/[id] (szczegóły + edycja + export)
```

**Kluczowe Przepływy Użytkownika:**

**1. Onboarding Flow (Critical Path - cel <10min):**
```
Register → Confirm Email → Login → Dashboard →
→ "Dodaj pierwszy przepis" (quick action) →
→ Recipe Form (uproszczona - tylko nazwa + składniki) →
→ "Przypisz do kalendarza" →
→ Calendar (today highlighted) →
→ "Generuj listę z tego tygodnia" →
→ Shopping List Preview →
→ "Zapisz i eksportuj PDF" ✓
```

**2. Weekly Planning Flow:**
```
Calendar → Week Navigator (previous/next) →
→ Empty Meal Cell → "Przypisz przepis" →
→ Recipe Picker Modal (search + select) →
→ Optimistic UI (przepis pojawia się natychmiast) →
→ Powtórz dla innych posiłków
```

**3. Shopping List Generation Flow:**
```
Shopping Lists → "Generuj nową" →
→ Wizard Step 1: Wybór trybu (kalendarz/przepisy) →
→ Wizard Step 2: Selekcja (checkboxes + licznik) →
→ Wizard Step 3: Loading (AI kategoryzacja) →
→ Wizard Step 4: Preview (edycja inline) →
→ Modal: Nazwa listy →
→ "Zapisz" → Redirect to /shopping-lists/[id] →
→ Export PDF/TXT buttons
```

**4. Recipe Management Flow:**
```
Recipes List → Search/Filter →
→ Hover (prefetch details) →
→ Click → Recipe Details →
→ "Edytuj" / "Usuń" (confirmation dialog) →
→ Invalidate cache → Refetch list
```

### C. Strategia Integracji z API i Zarządzania Stanem

**API Integration Pattern:**

```typescript
// API Client (src/lib/api/client.ts)
import { SupabaseClient } from '@supabase/supabase-js';

export class ApiClient {
  constructor(private supabase: SupabaseClient) {}

  async getRecipes(params: { search?: string; page: number; limit: number }) {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .ilike('name', `%${params.search}%`)
      .range((params.page - 1) * params.limit, params.page * params.limit - 1);

    if (error) throw error;
    return data;
  }
}
```

**State Management Strategy:**

| Data Type | Tool | Rationale |
|-----------|------|-----------|
| **Server State** (recipes, meal plan, shopping lists) | TanStack Query | Cache, sync, background refetch |
| **UI State** (modal open, form inputs) | React useState | Local, ephemeral |
| **URL State** (week_start_date, search, filters) | URL params | Shareable, bookmarkable |
| **Auth State** | Supabase Auth | Provider pattern, SSR-friendly |

**TanStack Query Setup:**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Override per-query
      staleTime: 0, // Override per-query
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Query Keys Convention:**

```typescript
// src/lib/api/queryKeys.ts
export const queryKeys = {
  recipes: {
    all: ['recipes'] as const,
    lists: () => [...queryKeys.recipes.all, 'list'] as const,
    list: (filters: RecipeFilters) => [...queryKeys.recipes.lists(), filters] as const,
    details: () => [...queryKeys.recipes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.recipes.details(), id] as const,
  },
  mealPlan: {
    all: ['meal-plan'] as const,
    week: (weekStartDate: string) => [...queryKeys.mealPlan.all, weekStartDate] as const,
  },
  shoppingLists: {
    all: ['shopping-lists'] as const,
    lists: () => [...queryKeys.shoppingLists.all, 'list'] as const,
    list: (page: number) => [...queryKeys.shoppingLists.lists(), page] as const,
    details: () => [...queryKeys.shoppingLists.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.shoppingLists.details(), id] as const,
  },
};
```

**Authentication Flow:**

```typescript
// src/middleware/auth.ts (Astro middleware)
export const onRequest = defineMiddleware(async (context, next) => {
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();

  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(context.url.pathname);

  if (!user && !isPublicRoute) {
    return context.redirect(`/login?redirect=${context.url.pathname}`);
  }

  if (user && isPublicRoute) {
    return context.redirect('/dashboard');
  }

  return next();
});
```

### D. Kwestie dotyczące Responsywności, Dostępności i Bezpieczeństwa

**Responsywność:**

**Mobile (<768px):**
- Bottom navigation bar (fixed)
- Accordion calendar (details elements)
- Fullscreen modals
- Touch-friendly tap targets (min 44px)
- Single column layouts

**Tablet (768-1023px):**
- Top navigation bar
- Horizontal scroll calendar (fixed width columns)
- Large modals (80% viewport)
- Two column layouts

**Desktop (≥1024px):**
- Sidebar navigation (fixed, sticky)
- Grid calendar (7 columns)
- Modals centered (max-width constraints)
- Three column layouts

**Tailwind Breakpoints:**
```css
/* Mobile first */
.container { @apply px-4; }

/* Tablet */
@media (min-width: 768px) {
  .container { @apply px-6 max-w-3xl mx-auto; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { @apply px-8 max-w-7xl; }
}
```

**Dostępność (WCAG AA):**

**1. Semantic HTML:**
```tsx
<nav aria-label="Nawigacja główna">
  <a href="/recipes" aria-current="page">Przepisy</a>
</nav>

<main id="main">
  <h1>Moje Przepisy</h1>
</main>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

**2. ARIA Attributes:**
```tsx
// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  Załadowano 40 z 120 przepisów
</div>

// Modal focus management
<Dialog
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  role="dialog"
>
  <DialogTitle id="dialog-title">Wybierz przepis</DialogTitle>
  <DialogDescription id="dialog-description">
    Wyszukaj i wybierz przepis do przypisania
  </DialogDescription>
</Dialog>

// Button states
<button
  aria-label="Przypisz przepis do Poniedziałek Śniadanie"
  aria-expanded={isModalOpen}
  aria-controls="recipe-picker-modal"
>
  Przypisz
</button>
```

**3. Keyboard Navigation:**
- Tab order logiczny (top → bottom, left → right)
- Focus visible (outline ring)
- Focus trap w modalach
- Escape key closes modals
- Enter/Space activate buttons
- Arrow keys w listach

**4. Screen Reader Support:**
```tsx
// Skip to main content
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
  Przeskocz do głównej treści
</a>

// Icon buttons
<button aria-label="Usuń przepis">
  <TrashIcon aria-hidden="true" />
</button>

// Loading states
<button disabled aria-busy="true">
  <Spinner aria-hidden="true" />
  <span>Zapisywanie...</span>
</button>
```

**5. Color Contrast:**
- Minimum 4.5:1 dla normalnego tekstu
- Minimum 3:1 dla dużego tekstu (≥18px)
- Tailwind color palette (gray-700 on white, white on primary-600)

**Bezpieczeństwo:**

**1. Authentication & Authorization:**
```typescript
// Row Level Security (RLS) policies
CREATE POLICY "Users can only access their own recipes"
ON recipes
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own meal plans"
ON meal_plan
FOR ALL
USING (auth.uid() = user_id);
```

**2. Input Validation (Zod):**
```typescript
// src/lib/validation/recipe.schema.ts
export const recipeSchema = z.object({
  name: z.string()
    .min(3, 'Nazwa musi mieć min. 3 znaki')
    .max(100, 'Nazwa może mieć max. 100 znaków')
    .trim(),
  instructions: z.string()
    .min(10, 'Instrukcje muszą mieć min. 10 znaków')
    .max(5000, 'Instrukcje mogą mieć max. 5000 znaków')
    .trim(),
  ingredients: z.array(ingredientSchema)
    .min(1, 'Przepis musi mieć min. 1 składnik')
    .max(50, 'Przepis może mieć max. 50 składników'),
});
```

**3. XSS Prevention:**
- React auto-escapes (dangerouslySetInnerHTML not used)
- Zod sanitization (trim, lowercase for emails)
- CSP headers (Content Security Policy)

**4. CSRF Protection:**
```typescript
// Supabase handles CSRF with httpOnly cookies
// Additional protection in Astro middleware
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method !== 'GET') {
    const csrfToken = context.cookies.get('csrf-token')?.value;
    const headerToken = context.request.headers.get('x-csrf-token');

    if (!csrfToken || csrfToken !== headerToken) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return next();
});
```

**5. Rate Limiting:**
```typescript
// API rate limiting (Vercel Edge Config)
const RATE_LIMIT = {
  '/api/recipes': { max: 100, window: 60000 }, // 100 req/min
  '/api/shopping-lists/generate': { max: 10, window: 60000 }, // 10 req/min (AI cost)
};
```

**6. Secrets Management:**
```bash
# .env.local (never commit)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx # Service role key (server-only)
OPENAI_API_KEY=xxx # Server-only
```

```typescript
// import.meta.env validation
if (!import.meta.env.SUPABASE_URL || !import.meta.env.SUPABASE_KEY) {
  throw new Error('Missing environment variables');
}
```

### E. Wszelkie Nierozwiązane Kwestie lub Obszary Wymagające Dalszego Wyjaśnienia

Podczas sesji planowania zidentyfikowano poniższe kwestie jako nierozwiązane - zostały one oznaczone jako rekomendacje wymagające dalszego doprecyzowania:

**1. Design System Szczegóły:**
- **Kwestia:** Brak konkretnych wartości kolorów, typografii, spacingu
- **Wymagane:** Dokument design system z Tailwind config (primary/secondary colors, font family, spacing scale)
- **Priorytet:** Wysoki (potrzebne przed implementacją)

**2. User Journey Maps:**
- **Kwestia:** Brak szczegółowych map przepływów użytkownika dla kluczowych scenariuszy
- **Wymagane:** User journey maps dla:
  - Onboarding (rejestracja → pierwsza lista)
  - Weekly planning (planowanie tygodnia)
  - Shopping list generation (generowanie listy)
- **Priorytet:** Średni (pomocne dla testów UX)

**3. Component Tree Map:**
- **Kwestia:** Brak szczegółowej mapy wszystkich komponentów i ich dependencies
- **Wymagane:** Diagram component tree z props flow i state management
- **Priorytet:** Średni (ułatwi implementację)

**4. State Management Diagram:**
- **Kwestia:** Brak wizualizacji TanStack Query keys i invalidation strategy
- **Wymagane:** Diagram showing query keys, dependencies, invalidation triggers
- **Priorytet:** Średni (dokumentacja dla zespołu)

**5. Error Messages i18n:**
- **Kwestia:** Komunikaty błędów są obecnie hardcoded po polsku
- **Wymagane:** Decyzja czy przygotować infrastrukturę i18n na przyszłość (PRD mówi "Polish only" dla MVP)
- **Priorytet:** Niski (out of scope dla MVP, ale warto rozważyć architecture)

**6. Loading States Consistency:**
- **Kwestia:** Brak guidelines dla skeleton screens vs spinners vs progress bars
- **Wymagane:** Decision matrix: kiedy używać jakiego typu loading indicator
- **Priorytet:** Średni (wpływa na UX consistency)

**7. Infinite Scroll Implementation Details:**
- **Kwestia:** Brak decision: czysty infinite scroll czy zawsze "Load more" button
- **Wymagane:** A/B testing recommendation lub user research
- **Priorytet:** Niski (można zdecydować podczas implementacji)

**8. PDF Export Styling:**
- **Kwestia:** Brak mockupu PDF output (kolory, logo, layout)
- **Wymagane:** Design mockup dla PDF export
- **Priorytet:** Średni (funkcjonalność core MVP)

**9. Notifications Strategy:**
- **Kwestia:** Tylko toast notifications czy również in-app notification center?
- **Wymagane:** Decyzja czy dodać notification history (out of scope PRD)
- **Priorytet:** Niski (toast wystarczający dla MVP)

**10. Offline Support:**
- **Kwestia:** Brak strategii dla offline mode (Service Worker, IndexedDB)
- **Wymagane:** Decyzja czy dodać PWA capabilities
- **Priorytet:** Niski (out of scope dla MVP, ale łatwe do dodania z TanStack Query)

**11. Analytics Events:**
- **Kwestia:** Jakie eventy trackować dla Plausible/GA4?
- **Wymagane:** Lista analytics events (np. "recipe_created", "shopping_list_generated")
- **Priorytet:** Średni (potrzebne dla mierzenia success metrics z PRD)

**12. Mobile App Considerations:**
- **Kwestia:** PRD mówi "out of scope", ale czy architektura powinna być React Native-ready?
- **Wymagane:** Decyzja czy separować business logic do hooks dla przyszłej reusability
- **Priorytet:** Niski (można refactorować później)

---

## Unresolved Issues

Poniżej przedstawiono kwestie wymagające konsultacji z zespołem przed rozpoczęciem implementacji:

### Krytyczne (Blokujące implementację):

1. **Design System Approval**
   - **Problem:** Brak zatwierdzonych kolorów brand, typografii, spacing
   - **Action:** Design team musi dostarczyć Tailwind config z wartościami
   - **Owner:** Design Lead
   - **Deadline:** Przed sprint 1

2. **API Endpoints Finalization**
   - **Problem:** `.ai/doc/15_api-plan.md` to plan, ale czy wszystkie endpointy są implemented?
   - **Action:** Backend team potwierdza które endpointy są gotowe
   - **Owner:** Backend Lead
   - **Deadline:** Przed sprint 1

### Ważne (Wpływające na UX):

3. **Loading States Guidelines**
   - **Problem:** Brak consistency guidelines: skeleton vs spinner vs progress bar
   - **Action:** UX team tworzy decision matrix
   - **Owner:** UX Designer
   - **Deadline:** Sprint 1, week 1

4. **PDF Export Design**
   - **Problem:** Brak mockupu dla PDF output (layout, styling, branding)
   - **Action:** Design team tworzy PDF mockup
   - **Owner:** Design Lead
   - **Deadline:** Sprint 2 (przed implementacją export feature)

5. **Analytics Events List**
   - **Problem:** Jakie eventy trackować dla success metrics?
   - **Action:** Product owner definiuje listę analytics events
   - **Owner:** Product Owner
   - **Deadline:** Sprint 1, week 2

### Nice to Have (Można zdecydować podczas implementacji):

6. **Infinite Scroll vs Load More**
   - **Problem:** Brak ostatecznej decyzji (rekomendacja: "Load more" button)
   - **Action:** A/B testing lub user research
   - **Owner:** UX Researcher
   - **Deadline:** Sprint 3 (można iterować)

7. **i18n Infrastructure**
   - **Problem:** Czy przygotować architekturę dla przyszłego multi-language support?
   - **Action:** Tech Lead decyduje: hardcoded Polish vs i18n-ready
   - **Owner:** Tech Lead
   - **Deadline:** Sprint 1, week 1

8. **PWA Capabilities**
   - **Problem:** Czy dodać offline support (Service Worker, cache)?
   - **Action:** Product owner decyduje based on user research
   - **Owner:** Product Owner
   - **Deadline:** Post-MVP (can be added later)

---

## Next Steps

### Natychmiastowe Akcje (Pre-Sprint):

1. ✅ **Przygotuj dokumentację architektury UI** (DONE - ten dokument)
2. ⏳ **Design System Creation**
   - Tailwind config (colors, fonts, spacing)
   - Shadcn/ui theme customization
3. ⏳ **Backend API Readiness Check**
   - Które endpointy z API plan są gotowe?
   - Mock data dla endpointów w development
4. ⏳ **User Journey Maps**
   - Onboarding flow (critical path)
   - Weekly planning flow
   - Shopping list generation flow

### Sprint 1 Priorities:

1. **Week 1:**
   - Setup projektu (Astro + React + TanStack Query + Shadcn)
   - Authentication flow (login/register)
   - Layout components (navigation, sidebar, bottom bar)
   - Design system implementation (Tailwind config)

2. **Week 2:**
   - Recipes CRUD (list, details, create, edit, delete)
   - Recipe form z Zod validation
   - Infinite scroll z TanStack Query

### Sprint 2 Priorities:

1. **Week 1:**
   - Calendar component (7×4 grid)
   - Week navigation
   - Meal cell assignment flow
   - Recipe picker modal

2. **Week 2:**
   - Shopping list generation wizard (4 steps)
   - AI categorization integration
   - Preview & edit screen

### Sprint 3 Priorities:

1. **Week 1:**
   - PDF/TXT export
   - Shopping lists history
   - Error boundaries & error handling

2. **Week 2:**
   - Accessibility audit (Lighthouse, screen reader testing)
   - Performance optimization
   - Bug fixes

---

## Appendix: Technical Stack Summary

**Frontend:**
- Astro 5 (static site generation + islands)
- React 18 (interactive components)
- TypeScript 5 (type safety)
- Tailwind CSS 4 (styling)
- Shadcn/ui (component library)
- TanStack Query (state management)

**Backend:**
- Supabase (PostgreSQL + Auth + RLS)
- OpenAI API (GPT-4o mini for categorization)

**Tooling:**
- Zod (validation)
- @react-pdf/renderer (PDF export)
- Sentry (error tracking)
- Plausible/GA4 (analytics)

**Deployment:**
- Vercel (hosting + edge functions)
- GitHub Actions (CI/CD)

**Quality:**
- ESLint + Prettier (linting/formatting)
- Husky + lint-staged (git hooks)
- Lighthouse (performance audits)

---

**Status:** ✅ Gotowe do review z zespołem
**Następny krok:** Konsultacja z Design, Backend, Product przed sprint planning
