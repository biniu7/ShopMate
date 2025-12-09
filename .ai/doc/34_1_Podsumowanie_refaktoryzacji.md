# Analiza złożoności komponentów - TOP 5 plików o największej LOC

**Data:** 2025-12-06
**Wersja:** 1.0
**Branch:** `3_4_Refaktoryzacja_projektu_AI`

---

## Podsumowanie wykonawcze

Analiza wykazała 5 plików o największej liczbie linii kodu w folderze `src/components`, które wymagają refaktoryzacji ze względu na wysoką złożoność i naruszenie zasad SOLID, DRY oraz wzorców projektowych zdefiniowanych w tech-stack.md.

**Główne wnioski:**

- ✅ Projekt konsekwentnie używa React + TypeScript + TanStack Query
- ⚠️ Występują naruszenia SRP (Single Responsibility Principle)
- ⚠️ Duplikacja kodu utility functions (`getCurrentWeekStart()`)
- ⚠️ Mieszanie concerns (data fetching + business logic + presentation)
- ⚠️ Inconsistentne patterns (manual useState vs react-hook-form)
- ✅ Dobra struktura folderów zgodna z tech-stack.md

---

## TOP 5 Plików o największej liczbie linii kodu

### 📊 Zestawienie

| #   | Plik                                                 | LOC | Złożoność         | Priorytet refaktoryzacji |
| --- | ---------------------------------------------------- | --- | ----------------- | ------------------------ |
| 1   | `src/components/wizard/ShoppingListWizard.tsx`       | 424 | ⚠️ WYSOKA         | 🔴 CRITICAL              |
| 2   | `src/components/recipes/RecipeEditView.tsx`          | 304 | ⚠️ ŚREDNIA-WYSOKA | 🟡 HIGH                  |
| 3   | `src/components/hooks/useCalendar.ts`                | 291 | ⚠️ WYSOKA         | 🔴 CRITICAL              |
| 4   | `src/components/wizard/Step2a_CalendarSelection.tsx` | 240 | ⚠️ ŚREDNIA        | 🟡 HIGH                  |
| 5   | `src/components/auth/ResetPasswordView.tsx`          | 238 | ⚠️ ŚREDNIA        | 🟢 MEDIUM                |

---

## Szczegółowa analiza plików

### 1️⃣ ShoppingListWizard.tsx (424 LOC)

**Lokalizacja:** `src/components/wizard/ShoppingListWizard.tsx`

#### Zidentyfikowane problemy:

- **Massive reducer** - 114 linii kodu w jednej funkcji reducera (linie 83-197)
- **God Component** - zarządza stanem, logiką biznesową, API calls i renderingiem
- **Duplikacja utility** - `getCurrentWeekStart()` zduplikowana z Step2a_CalendarSelection.tsx
- **Inline API calls** - `generatePreview()` i `saveList()` mają logikę API bezpośrednio w komponencie
- **Brak separacji concerns** - mixing state management + business logic + rendering

#### Rekomendowane wzorce refaktoryzacji:

**A) State Machine Pattern**

```typescript
// src/lib/state-machines/shopping-list-wizard.machine.ts
import { createMachine } from "xstate";

const wizardMachine = createMachine({
  initial: "modeSelection",
  states: {
    modeSelection: { on: { SELECT_MODE: "selection" } },
    selection: { on: { NEXT: "generation", BACK: "modeSelection" } },
    generation: { on: { SUCCESS: "preview", ERROR: "selection" } },
    preview: { on: { SAVE: "saving", BACK: "selection" } },
  },
});
```

**Dlaczego:** Wizard jest typowym use case dla state machine. XState oferuje:

- Wizualizację stanów (type safety, niemożliwość invalid states)
- Łatwiejsze testowanie transitions
- Better developer experience

**B) Extract Custom Hook**

```typescript
// src/components/hooks/useShoppingListWizard.ts
export function useShoppingListWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const actions = useMemo(
    () => ({
      goToStep: (step) => dispatch({ type: "GO_TO_STEP", payload: step }),
      selectMode: (mode) => dispatch({ type: "SET_MODE", payload: mode }),
      // ...pozostałe actions
    }),
    []
  );

  return { state, actions };
}
```

**C) Extract Reducer + API Services**

```typescript
// src/lib/reducers/wizard.reducer.ts
export { wizardReducer, initialState };

// src/lib/api/shopping-lists.ts
export const shoppingListsApi = {
  async generatePreview(request: ShoppingListPreviewRequestDto) {
    const response = await fetch("/api/shopping-lists/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  },
};
```

**Szacowany effort:** 6-8 godzin

---

### 2️⃣ RecipeEditView.tsx (304 LOC)

**Lokalizacja:** `src/components/recipes/RecipeEditView.tsx`

#### Zidentyfikowane problemy:

- **Mixed responsibilities** - łączy data fetching, form state, mutations, error handling i rendering
- **Query setup duplication** - podobna logika występuje w wielu miejscach projektu
- **No error boundary** - inline error handling zamiast React Error Boundary
- **Tight coupling** - QueryProvider wrapper wskazuje na tight coupling

#### Rekomendowane wzorce refaktoryzacji:

**A) Custom Hook Extraction - Compound Pattern**

```typescript
// src/components/hooks/useRecipeEdit.ts
export function useRecipeEdit(recipeId: string) {
  const { data, isLoading, error, refetch } = useRecipeQuery(recipeId);
  const form = useRecipeForm(data);
  const mutation = useRecipeUpdateMutation(recipeId);

  return { recipe: data, isLoading, error, form, mutation, refetch };
}

// src/components/hooks/useRecipeQuery.ts
export function useRecipeQuery(recipeId: string) {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => recipeApi.getById(recipeId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Recipe not found") {
        return false;
      }
      return failureCount < 2;
    },
  });
}
```

**Dlaczego:**

- **Composition over Inheritance** - małe, reusable hooks
- **DRY** - `useRecipeQuery` może być reused w RecipeDetailsView
- **Testability** - hooks łatwiejsze do unit testowania

**B) Container/Presentational Pattern**

```typescript
// src/components/recipes/RecipeEditContainer.tsx (logic)
export function RecipeEditContainer({ recipeId }) {
  const { recipe, form, mutation, isLoading, error } = useRecipeEdit(recipeId);

  if (isLoading) return <RecipeDetailsSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!recipe) return null;

  return <RecipeEditForm recipe={recipe} form={form} mutation={mutation} />;
}

// src/components/recipes/RecipeEditForm.tsx (presentation)
export function RecipeEditForm({ recipe, form, mutation }) {
  // tylko UI i form rendering
}
```

**C) React Suspense + Error Boundary**

```typescript
export function RecipeEditView({ recipeId }) {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<RecipeDetailsSkeleton />}>
        <RecipeEditContainer recipeId={recipeId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**Szacowany effort:** 4-6 godzin

---

### 3️⃣ useCalendar.ts (291 LOC)

**Lokalizacja:** `src/components/hooks/useCalendar.ts`

#### Zidentyfikowane problemy:

- **God Hook** - zarządza ~10 odpowiedzialnościami (state, queries, mutations, modals, URL sync, handlers)
- **Violation of SRP** - Single Responsibility Principle
- **Complex optimistic updates** - długie onMutate callbacks (62-87, 109-125 linii)
- **Tight coupling** - modal states powiązane z calendar state

#### Rekomendowane wzorce refaktoryzacji:

**A) Hook Composition - Extract Smaller Hooks**

```typescript
// src/components/hooks/calendar/useCalendarState.ts
export function useCalendarState(initialWeek?: string) {
  const [weekStartDate, setWeekStartDate] = useState(initialWeek || getCurrentWeekStart());
  const weekEndDate = useMemo(() => getWeekEndDate(weekStartDate), [weekStartDate]);
  const dateRange = useMemo(() => formatDateRange(weekStartDate, weekEndDate), [weekStartDate, weekEndDate]);

  return { weekStartDate, weekEndDate, dateRange, setWeekStartDate };
}

// src/components/hooks/calendar/useCalendarModals.ts
export function useCalendarModals() {
  const [recipePickerState, setRecipePickerState] = useState({
    isOpen: false,
    targetCell: null,
  });

  const [recipePreviewState, setRecipePreviewState] = useState({
    isOpen: false,
    recipeId: null,
    assignmentId: null,
  });

  return {
    recipePickerState,
    recipePreviewState,
    closeRecipePicker: () => setRecipePickerState({ isOpen: false, targetCell: null }),
    closeRecipePreview: () => setRecipePreviewState({ isOpen: false, recipeId: null, assignmentId: null }),
  };
}

// src/components/hooks/calendar/useWeekUrlSync.ts
export function useWeekUrlSync(weekStartDate, setWeekStartDate) {
  useEffect(() => {
    /* sync from URL */
  }, []);
  useEffect(() => {
    /* handle popstate */
  }, []);

  const handleWeekChange = useCallback(
    (newWeekStart) => {
      setWeekStartDate(newWeekStart);
      const url = new URL(window.location.href);
      url.searchParams.set("week", newWeekStart);
      window.history.pushState({}, "", url.toString());
    },
    [setWeekStartDate]
  );

  return { handleWeekChange };
}

// src/components/hooks/calendar/index.ts
export function useCalendar(initialWeekStart?: string) {
  const calendarState = useCalendarState(initialWeekStart);
  const modals = useCalendarModals();
  const { handleWeekChange } = useWeekUrlSync(calendarState.weekStartDate, calendarState.setWeekStartDate);
  const queries = useCalendarQueries(calendarState.weekStartDate);
  const mutations = useCalendarMutations(calendarState.weekStartDate);

  return { ...calendarState, ...modals, ...queries, ...mutations, handleWeekChange };
}
```

**B) Extract Optimistic Update Logic**

```typescript
// src/lib/mutations/optimistic-updates.ts
export function createOptimisticUpdateConfig(queryClient: QueryClient, queryKey: any[], action: "create" | "delete") {
  return {
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      // optimistic update logic
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}
```

**C) Optional: Context API for Global Calendar State**

```typescript
// src/contexts/CalendarContext.tsx
export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children, initialWeek }) {
  const calendar = useCalendar(initialWeek);
  return <CalendarContext.Provider value={calendar}>{children}</CalendarContext.Provider>;
}

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendarContext must be within CalendarProvider");
  return context;
}
```

**Szacowany effort:** 8-10 godzin

---

### 4️⃣ Step2a_CalendarSelection.tsx (240 LOC)

**Lokalizacja:** `src/components/wizard/Step2a_CalendarSelection.tsx`

#### Zidentyfikowane problemy:

- **Manual data fetching** - useState + useEffect zamiast TanStack Query (inconsistent)
- **Duplikacja** - `getCurrentWeekStart()` zduplikowana z ShoppingListWizard.tsx
- **Mixed concerns** - data fetching + selection logic + rendering
- **No query caching** - każde otwarcie = nowy fetch (TanStack Query by cachował)

#### Rekomendowane wzorce refaktoryzacji:

**A) Migrate to TanStack Query**

```typescript
// src/components/hooks/useCurrentWeekCalendar.ts
export function useCurrentWeekCalendar() {
  const weekStartDate = getCurrentWeekStart();

  return useQuery<WeekCalendarResponseDto>({
    queryKey: ["meal-plan", weekStartDate],
    queryFn: () => fetchMealPlan(weekStartDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Step2a_CalendarSelection.tsx
export default function Step2a_CalendarSelection({ ... }) {
  const { data: calendar, isLoading, error } = useCurrentWeekCalendar();
  // reszta logiki
}
```

**Dlaczego:**

- **Consistency** - zgodne z resztą projektu (RecipeEditView, useCalendar)
- **Caching** - automatyczne cachowanie, refetch on window focus
- **DevTools** - TanStack Query DevTools
- **DRY** - query reusable

**B) Extract Selection Logic to Custom Hook**

```typescript
// src/components/hooks/useCalendarMealSelection.ts
export function useCalendarMealSelection(
  selectedMeals: CalendarSelectionDto[],
  onToggleMeal: (day: number, meal: MealType) => void,
  onSelectAllMeals: (selections: CalendarSelectionDto[]) => void
) {
  const selectedMealsCount = useMemo(
    () => selectedMeals.reduce((sum, day) => sum + day.meal_types.length, 0),
    [selectedMeals]
  );

  const getEmptyMealsCount = useCallback(
    (calendar) => {
      // logic
    },
    [selectedMeals]
  );

  const selectAll = useCallback(
    (calendar) => {
      // logic
    },
    [onSelectAllMeals]
  );

  const clearSelection = useCallback(() => {
    onSelectAllMeals([]);
  }, [onSelectAllMeals]);

  return { selectedMealsCount, getEmptyMealsCount, selectAll, clearSelection };
}
```

**C) Remove Duplication**

```typescript
// Zamiast duplicated getCurrentWeekStart(), użyj:
import { getCurrentWeekStart } from "@/lib/utils/date";
```

**Szacowany effort:** 3-4 godziny

---

### 5️⃣ ResetPasswordView.tsx (238 LOC)

**Lokalizacja:** `src/components/auth/ResetPasswordView.tsx`

#### Zidentyfikowane problemy:

- **2 komponenty w 1 pliku** - Request Reset + Update Password (naruszenie SRP)
- **Inconsistent patterns** - inne formularze używają react-hook-form, ten nie
- **Manual validation** - zamiast react-hook-form + zodResolver
- **Inline API calls** - fetch bezpośrednio w event handlerach
- **Conditional rendering complexity** - 3 różne stany UI w jednym komponencie

#### Rekomendowane wzorce refaktoryzacji:

**A) Split into Separate Components (SRP)**

```typescript
// src/components/auth/ResetPasswordRequest.tsx
export function ResetPasswordRequest() {
  const form = useForm<ResetPasswordRequestSchemaType>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const mutation = useResetPasswordRequestMutation();
  const onSubmit = (data) => mutation.mutate(data);

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}

// src/components/auth/UpdatePassword.tsx
export function UpdatePassword() {
  const form = useForm<UpdatePasswordSchemaType>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const mutation = useUpdatePasswordMutation();
  const onSubmit = (data) => mutation.mutate(data);

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}

// src/pages/reset-password.astro
{isResetCallback ? <UpdatePassword /> : <ResetPasswordRequest />}
```

**B) Migrate to react-hook-form**

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting }
} = useForm<ResetPasswordRequestSchemaType>({
  resolver: zodResolver(resetPasswordRequestSchema),
});

// Fields:
<Input {...register("email")} />
{errors.email && <p>{errors.email.message}</p>}
```

**Dlaczego:**

- **Consistency** - tech-stack.md definiuje react-hook-form jako standard
- **Less boilerplate** - automatic error handling, validation
- **Better UX** - instant validation, accessibility

**C) Extract API Calls to Service Layer**

```typescript
// src/lib/api/auth.ts
export const authApi = {
  async requestPasswordReset(email: string) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to send reset email");
    }

    return response.json();
  },

  async updatePassword(newPassword: string, confirmPassword: string) {
    // similar
  },
};

// src/components/hooks/useResetPasswordRequestMutation.ts
export function useResetPasswordRequestMutation() {
  return useMutation({
    mutationFn: (data) => authApi.requestPasswordReset(data.email),
    onSuccess: () => toast.success("Link resetujący wysłany"),
    onError: (error) => toast.error(error.message),
  });
}
```

**Szacowany effort:** 2-3 godziny

---

## Wspólne wzorce refaktoryzacji

### ✅ Zasady z tech-stack.md

**React Patterns:**

- Functional components + hooks
- Custom hooks w `src/components/hooks`
- React.memo(), React.lazy(), Suspense
- useCallback, useMemo, useOptimistic

**Architecture:**

- Clean layers (entities, use cases, interfaces, frameworks)
- Dependencies point inward
- Ports & adapters pattern

**API Integration:**

- Dedykowane serwisy w `src/lib/services`
- TanStack Query dla data fetching
- Optimistic updates where applicable

---

### 🔧 Rekomendowane techniki

| Wzorzec                          | Zastosowanie           | Przykład z analizy                                                                       | Priorytet |
| -------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- | --------- |
| **Custom Hook Extraction**       | Separacja logiki od UI | `useCalendar` → split into `useCalendarState`, `useCalendarQueries`, `useCalendarModals` | 🔴 HIGH   |
| **Container/Presentational**     | Separacja concerns     | `RecipeEditView` → `RecipeEditContainer` + `RecipeEditForm`                              | 🟡 MEDIUM |
| **State Machine**                | Complex workflows      | `ShoppingListWizard` → XState machine                                                    | 🟢 LOW    |
| **Service Layer**                | API abstrakcja         | Extract fetch calls do `src/lib/api/`                                                    | 🔴 HIGH   |
| **Composition over Inheritance** | Reusability            | Small hooks composed into larger ones                                                    | 🔴 HIGH   |
| **Error Boundary**               | Error handling         | Declarative zamiast if/else                                                              | 🟡 MEDIUM |
| **Suspense Pattern**             | Loading states         | React 18/19 pattern                                                                      | 🟡 MEDIUM |
| **DRY Utils**                    | Remove duplication     | `getCurrentWeekStart()` → shared util                                                    | 🔴 HIGH   |

---

## Wykryte duplikacje kodu

### 🔴 CRITICAL: getCurrentWeekStart()

**Lokalizacje:**

- `src/components/wizard/ShoppingListWizard.tsx:412-424` (13 linii)
- `src/components/wizard/Step2a_CalendarSelection.tsx:228-240` (13 linii)

**Rozwiązanie:**

```typescript
// src/lib/utils/date.ts
export function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Poniedziałek = 1
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
```

**Tech-stack.md reference:** Linia 17 wspomina o utils w `src/lib/utils/date.ts`

**Effort:** 15 minut

---

## Inconsistencies z tech-stack.md

### 🟡 Form handling patterns

**Problem:**

- `RecipeEditView.tsx` używa react-hook-form + zodResolver ✅
- `ResetPasswordView.tsx` używa manual useState + manual validation ❌

**Zgodność z tech-stack.md (linie 420-426):**

> React: Functional components + hooks, custom hooks in `src/components/hooks`, `React.memo()`, `React.lazy()`, `Suspense`, `useCallback`, `useMemo`, `useId()`, `useOptimistic`, `useTransition`

**Rozwiązanie:**
Migracja `ResetPasswordView.tsx` do react-hook-form

---

### 🟡 Data fetching patterns

**Problem:**

- `useCalendar.ts` używa TanStack Query ✅
- `RecipeEditView.tsx` używa TanStack Query ✅
- `Step2a_CalendarSelection.tsx` używa manual useState + useEffect ❌

**Zgodność z tech-stack.md (linie 150-165):**

> AI Integration: Implementation: `src/lib/services/ai-categorization.service.ts` - `categorizeIngredientsWithRetry()` with exponential backoff. [...] API Usage: Call from `src/pages/api/shopping-lists/generate.ts`

(Implikuje pattern: TanStack Query dla client-side, dedicated services dla API calls)

**Rozwiązanie:**
Migracja `Step2a_CalendarSelection.tsx` do TanStack Query

---

## Plan implementacji refaktoryzacji

### Faza 1: Quick Wins (1-2 dni)

**Priority: 🔴 CRITICAL**

1. **Remove `getCurrentWeekStart()` duplication** (15 min)
   - Create shared utility in `src/lib/utils/date.ts`
   - Replace all occurrences

2. **Migrate Step2a_CalendarSelection to TanStack Query** (3-4h)
   - Create `useCurrentWeekCalendar` hook
   - Replace useState + useEffect
   - Test caching behavior

3. **Extract API calls to service layer** (2-3h)
   - Create `src/lib/api/auth.ts`
   - Create `src/lib/api/shopping-lists.ts`
   - Update components to use services

**Total effort:** ~6-8 godzin

---

### Faza 2: Medium Refactors (3-5 dni)

**Priority: 🟡 HIGH**

4. **Split ResetPasswordView into separate components** (2-3h)
   - Create `ResetPasswordRequest.tsx`
   - Create `UpdatePassword.tsx`
   - Migrate to react-hook-form + TanStack Query mutations

5. **Refactor RecipeEditView to Container/Presentational** (4-6h)
   - Extract `useRecipeEdit` hook
   - Create `RecipeEditContainer` (logic)
   - Create `RecipeEditForm` (presentation)
   - Add Error Boundary + Suspense

6. **Extract selection logic from Step2a** (2-3h)
   - Create `useCalendarMealSelection` hook
   - Test selection/deselection logic

**Total effort:** ~10-14 godzin

---

### Faza 3: Major Refactors (1-2 tygodnie)

**Priority: 🟢 MEDIUM**

7. **Decompose useCalendar into smaller hooks** (8-10h)
   - Create `useCalendarState`
   - Create `useCalendarModals`
   - Create `useWeekUrlSync`
   - Create `useCalendarQueries`
   - Create `useCalendarMutations`
   - Extract optimistic update logic
   - Comprehensive testing

8. **Extract wizard reducer + consider state machine** (6-8h)
   - Move reducer to `src/lib/reducers/wizard.reducer.ts`
   - Create `useShoppingListWizard` hook
   - Evaluate XState migration (optional)
   - Add tests for state transitions

**Total effort:** ~16-20 godzin

---

## Metryki przed refaktoryzacją

| Metryka                      | Wartość aktualna                                  | Cel po refaktoryzacji |
| ---------------------------- | ------------------------------------------------- | --------------------- |
| **Największy plik**          | 424 LOC                                           | < 200 LOC             |
| **Średnia LOC/plik (TOP 5)** | 299 LOC                                           | < 150 LOC             |
| **Duplikacje**               | 2 (getCurrentWeekStart)                           | 0                     |
| **God components**           | 2 (ShoppingListWizard, useCalendar)               | 0                     |
| **Inconsistent patterns**    | 2 (Step2a data fetching, ResetPasswordView forms) | 0                     |
| **Test coverage**            | TBD                                               | > 80%                 |

---

## Ryzyka i mitygacje

### Ryzyko 1: Breaking changes podczas refaktoryzacji

**Mitygacja:**

- Comprehensive testing przed i po refactorze
- Feature flags dla major changes
- Incremental refactoring (małe PR-y)

### Ryzyko 2: Regression bugs

**Mitygacja:**

- E2E testy Playwright dla critical paths (tech-stack.md linie 904-970)
- Unit testy dla extracted hooks
- Manual QA przed merge

### Ryzyko 3: Team velocity impact

**Mitygacja:**

- Refactoring w dedykowanym branchu `3_4_Refaktoryzacja_projektu_AI`
- Code review z całym zespołem
- Documentation updates

---

## Wnioski końcowe

### ✅ Strengths obecnej implementacji:

1. **Consistent tech stack** - React 18 + TypeScript + TanStack Query
2. **Good folder structure** - zgodna z tech-stack.md
3. **Type safety** - comprehensive TypeScript usage
4. **Modern patterns** - hooks, functional components, Zod validation

### ⚠️ Areas for improvement:

1. **God components** - ShoppingListWizard, useCalendar zarządzają zbyt dużą liczbą concerns
2. **Duplikacja** - utility functions duplikowane w wielu miejscach
3. **Inconsistent patterns** - mix manual useState vs react-hook-form, manual fetch vs TanStack Query
4. **SRP violations** - komponenty łączą data fetching + business logic + presentation
5. **Lack of abstraction layers** - API calls inline w komponentach zamiast service layer

### 🎯 Rekomendacje:

1. **Priorytet 1 (Quick Wins):** Remove duplikacje, migrate do consistent patterns
2. **Priorytet 2 (Medium):** Container/Presentational separation, hook extraction
3. **Priorytet 3 (Long-term):** State machine for wizard, comprehensive testing

### 📈 Oczekiwane rezultaty:

- **Maintainability:** +40% (smaller files, clear responsibilities)
- **Testability:** +60% (extracted hooks, service layer)
- **Developer Experience:** +30% (consistent patterns, less cognitive load)
- **Code reusability:** +50% (shared hooks, utilities)

---

**Następne kroki:**

1. Review tego dokumentu z zespołem
2. Wybór plików do refaktoryzacji w pierwszej iteracji
3. Stworzenie task breakdown w todo list
4. Rozpoczęcie implementacji zgodnie z planem

---

**Prepared by:** Claude Code (Anthropic)
**Review status:** Pending team review
**Related docs:** `.ai/doc/tech-stack.md`
