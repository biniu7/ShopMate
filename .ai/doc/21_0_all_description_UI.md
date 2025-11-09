
2.2.1 Dashboard
Ścieżka: /dashboard

Główny cel: Przegląd stanu aplikacji i szybki dostęp do kluczowych akcji

Kluczowe informacje:

Liczba przepisów użytkownika
Liczba zaplanowanych posiłków w bieżącym tygodniu
Liczba zapisanych list zakupów
Ostatnie 3 przepisy (quick access)
Nadchodzące posiłki na dziś i jutro
Kluczowe komponenty:

<StatsCards> - 3 karty ze statystykami
<StatCard icon="ChefHat" label="Przepisy" value={recipesCount} />
<StatCard icon="Calendar" label="Zaplanowane posiłki" value={mealPlansCount} />
<StatCard icon="ShoppingCart" label="Listy zakupów" value={shoppingListsCount} />
<QuickActions> - 3 CTA buttons
"Dodaj przepis" → /recipes/new
"Zaplanuj tydzień" → /calendar
"Generuj listę" → /shopping-lists/generate
<RecentRecipes> - 3 ostatnie przepisy (cards z preview)
<UpcomingMeals> - Posiłki na dziś i jutro (timeline view)
UX considerations:

Dla nowego użytkownika (0 przepisów): Empty state z onboarding hints
"Zacznij od dodania pierwszego przepisu" + duży CTA button
Tooltip: "Będziesz mógł przypisać go do kalendarza"
Quick actions sticky na mobile (bottom bar)
Stats jako skeleton podczas ładowania
Accessibility:

Stats cards z aria-label opisującym wartość
Links opisowe (nie tylko ikony)
Security:

Middleware sprawdza auth (redirect do /login jeśli brak sesji)
RLS: fetch tylko danych zalogowanego użytkownika
2.2.2 Recipes List
Ścieżka: /recipes

Główny cel: Przeglądanie, wyszukiwanie i zarządzanie przepisami użytkownika

Kluczowe informacje:

Lista wszystkich przepisów użytkownika
Search query (URL param ?search=pasta)
Sort (URL param ?sort=name_asc)
Pagination/Infinite scroll
Kluczowe komponenty:

<RecipesHeader> (sticky top)
<SearchBar> - Input z debounce 300ms, ikona search
<SortDropdown> - Select: "Alfabetycznie A-Z" | "Z-A" | "Najnowsze" | "Najstarsze"
<Button> "Dodaj przepis" (primary, sticky w prawym dolnym rogu mobile)
<RecipesList> (main content)
Grid: 3 kolumny (desktop), 2 (tablet), 1 (mobile)
<RecipeCard> × n
Nazwa przepisu (truncate 50 znaków)
Liczba składników (badge)
Data dodania (relative time: "2 dni temu")
Hover: Prefetch recipe details (TanStack Query)
Click: Navigate to /recipes/:id
<LoadMoreButton> - "Załaduj więcej" (pojawia się przy scroll 80%)
<LoadingState> - Skeleton cards podczas fetch
<EmptyState> - "Brak przepisów" + ilustracja + CTA
UX considerations:

Search z live results (debounce 300ms)
URL state dla search i sort (bookmarkable)
ARIA live region: "Załadowano 40 z 120 przepisów"
Infinite scroll z fallback button (WCAG AA compliance)
Skeleton screens podczas ładowania (lepsze niż spinner)
Accessibility:

Search input z aria-label="Wyszukaj przepisy"
Recipe cards jako <article> z semantic HTML
Sort dropdown z <label> visible
"Load more" button focusable z klawiatury
Security:

RLS: tylko przepisy zalogowanego użytkownika
Search query sanitization (Zod)
API Integration:

GET /api/recipes?search={query}&sort={sort}&page={page}&limit=20
TanStack Query:
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
queryKey: ['recipes', search, sort],
queryFn: ({ pageParam = 1 }) => fetchRecipes({ page: pageParam, search, sort }),
staleTime: 5 * 60 * 1000, // 5 minut
});
2.2.3 Recipe Create
Ścieżka: /recipes/new

Główny cel: Dodać nowy przepis do kolekcji użytkownika

Kluczowe informacje:

Nazwa przepisu (3-100 znaków)
Instrukcje (10-5000 znaków, textarea)
Lista składników (dynamiczna, min 1, max 50)
Ilość (opcjonalna, numeryczna)
Jednostka (opcjonalna, max 50 znaków)
Nazwa (wymagana, 1-100 znaków)
Kluczowe komponenty:

<RecipeForm> (React component, client:load)
<Input> nazwa (validation inline)
<Textarea> instrukcje (auto-resize, character counter)
<IngredientsList> (dynamic field array)
<IngredientRow> × n
<Input> ilość (type="number", placeholder="200")
<Input> jednostka (placeholder="g")
<Input> nazwa (placeholder="mąka")
<Button> "×" usuń składnik (icon button, destructive)
<Button> "+ Dodaj składnik" (secondary)
<FormActions> (sticky bottom)
<Button> "Anuluj" (ghost) → Navigate back
<Button> "Zapisz przepis" (primary, disabled if invalid)
UX considerations:

Auto-focus na nazwa input
Validation w czasie rzeczywistym (Zod schema)
Character counter przy textarea (5000/5000)
Składniki: min 1 wymagany (nie można usunąć ostatniego)
Składniki: drag-and-drop reordering (opcjonalne w MVP)
Success: Toast "Przepis dodany" + redirect do /recipes/:id
Error: Toast + retry button
Accessibility:

Form z semantic <form>
Labels powiązane z inputs
Error messages z aria-describedby
"Dodaj składnik" button z clear label
Security:

Zod validation (client + server)
Max 50 składników (protection against abuse)
RLS: przepis przypisany do zalogowanego użytkownika
API Integration:

POST /api/recipes (body: RecipeSchema)
TanStack Query mutation:
const createRecipe = useMutation({
mutationFn: (recipe) => api.createRecipe(recipe),
onSuccess: (newRecipe) => {
queryClient.invalidateQueries(['recipes']);
navigate(`/recipes/${newRecipe.id}`);
toast.success('Przepis dodany pomyślnie');
},
});
2.2.4 Recipe Details
Ścieżka: /recipes/:id

Główny cel: Wyświetlić pełne szczegóły przepisu i umożliwić edycję/usunięcie

Kluczowe informacje:

Nazwa przepisu
Data dodania i ostatniej edycji
Lista składników (ilość, jednostka, nazwa)
Instrukcje (full text z zachowaniem newlines)
Liczba przypisań w kalendarzu (info message jeśli >0)
Kluczowe komponenty:

<RecipeHeader> (sticky top)
Breadcrumbs: "Przepisy > Nazwa przepisu"
<Button> "Edytuj" → /recipes/:id/edit
<Button> "Usuń" (destructive) → Confirmation dialog
<RecipeDetails> (main content)
<RecipeName> - h1, nazwa przepisu
<RecipeMeta> - Data dodania, edycji (small text, gray)
<IngredientsSection>
Heading: "Składniki ({count})"
<IngredientsList> - lista z bullet points
{quantity} {unit} {name} (np. "200 g mąki")
<InstructionsSection>
Heading: "Instrukcje"
Paragraph z preserved newlines (white-space: pre-wrap)
<AssignmentsInfo> (jeśli >0 przypisań)
Info alert: "Ten przepis jest przypisany do 3 posiłków w kalendarzu"
Link: "Zobacz kalendarz" → /calendar
<DeleteConfirmationDialog> (modal)
Title: "Usuń przepis?"
Description: "Ten przepis jest przypisany do {count} posiłków. Usunięcie spowoduje usunięcie przypisań."
Actions:
<Button> "Anuluj" (default focus)
<Button> "Usuń przepis i przypisania" (destructive)
UX considerations:

Breadcrumbs dla orientacji użytkownika
Składniki jako checklist (opcjonalnie do dodania w przyszłości)
Instrukcje z czytelną typografią (line-height 1.6)
Delete confirmation z jasnym komunikatem o konsekwencjach
Success po usunięciu: redirect do /recipes + Toast
Accessibility:

Semantic headings (h1, h2)
Lists z <ul> dla składników
Delete button z aria-label="Usuń przepis {name}"
Dialog z focus trap
Security:

RLS: tylko przepisy zalogowanego użytkownika
404 jeśli przepis nie istnieje lub nie należy do użytkownika
API Integration:

GET /api/recipes/:id
DELETE /api/recipes/:id
TanStack Query:
const { data: recipe } = useQuery({
queryKey: ['recipe', recipeId],
queryFn: () => api.getRecipe(recipeId),
staleTime: 10 * 60 * 1000,
});

const deleteRecipe = useMutation({
mutationFn: (id) => api.deleteRecipe(id),
onSuccess: () => {
queryClient.invalidateQueries(['recipes']);
queryClient.invalidateQueries(['meal-plan']); // Może być przypisany
navigate('/recipes');
toast.success('Przepis usunięty');
},
});
2.2.5 Recipe Edit
Ścieżka: /recipes/:id/edit (lub modal/inline w Recipe Details)

Główny cel: Edytować istniejący przepis

Kluczowe informacje:

Wszystkie pola z Recipe Create, wypełnione aktualnymi danymi
Info message: "Zmiany zaktualizują wszystkie przypisania w kalendarzu"
Kluczowe komponenty:

Identyczne jak <RecipeForm> w Recipe Create
Dodatkowo:
<InfoAlert> - "Zmiany propagują się do kalendarza"
Button label: "Zapisz zmiany" (zamiast "Zapisz przepis")
UX considerations:

Wypełniony formularz z aktualnymi danymi
Validation identyczna jak Create
Success: redirect do /recipes/:id + Toast "Przepis zaktualizowany"
Cancel: pytanie "Odrzucić zmiany?" jeśli formularz dirty
Accessibility:

Identyczne jak Recipe Create
Security:

RLS: tylko przepisy zalogowanego użytkownika
Validation identyczna jak Create
API Integration:

PUT /api/recipes/:id (full replacement)
TanStack Query mutation z invalidation:
const updateRecipe = useMutation({
mutationFn: ({ id, recipe }) => api.updateRecipe(id, recipe),
onSuccess: (updatedRecipe) => {
queryClient.invalidateQueries(['recipe', updatedRecipe.id]);
queryClient.invalidateQueries(['recipes']);
queryClient.invalidateQueries(['meal-plan']); // Live update
navigate(`/recipes/${updatedRecipe.id}`);
toast.success('Przepis zaktualizowany pomyślnie');
},
});
2.2.6 Calendar
Ścieżka: /calendar?week=2025-01-20

Główny cel: Planować posiłki na tydzień poprzez przypisywanie przepisów do konkretnych dni i posiłków

Kluczowe informacje:

Zakres tygodnia (poniedziałek - niedziela)
7 dni × 4 posiłki = 28 komórek
Typy posiłków: Śniadanie, Drugie śniadanie, Obiad, Kolacja
Przypisane przepisy w komórkach (nazwa, przycisk ×)
URL state: ?week=YYYY-MM-DD (deep linking)
Kluczowe komponenty:

<Calendar> (main container, React component, client:load)

Desktop (≥1024px):

Grid layout: 7 kolumn (dni) × 4 wiersze (posiłki)
Fixed header row z nazwami dni
Fixed left column z nazwami posiłków
Tablet (768-1023px):

Horizontal scroll container
Fixed width kolumn
Mobile (<768px):

Accordion: każdy dzień jako <details> element
4 posiłki wewnątrz każdego dnia
<WeekNavigator> (sticky top)

<Button> "← Poprzedni tydzień" → week - 7 dni
<span> "Tydzień 20-26 stycznia 2025" (center, bold)
<Button> "Bieżący tydzień" → today's week
<Button> "Następny tydzień →" → week + 7 dni
URL update: /calendar?week=2025-01-27
<CalendarGrid> (responsive layout)

Desktop: CSS Grid (7 columns)
Tablet: Horizontal scroll + flexbox
Mobile: Accordion (vertical stack)
<DayColumn> (desktop/tablet)

Header: Dzień tygodnia + data (np. "Pon 20.01")
<MealCell> × 4
<MealCell> (pojedyncza komórka)

Stan 1: Pusta komórka

<Button> "Przypisz przepis" (secondary, full width)
Click: Open <RecipePickerModal>
Stan 2: Przypisany przepis

<RecipeAssignment>
Nazwa przepisu (truncate 30 znaków)
Hover: tooltip z pełną nazwą
Click na nazwę: Podgląd przepisu (modal/slide-over)
<Button> "×" usuń przypisanie (top-right corner, icon button)
Click: Optimistic delete (natychmiastowe UI update)
Rollback jeśli API error
<RecipePickerModal> (lazy loaded, client:idle)

Size: Large (max 900px width desktop, fullscreen mobile)
Header:
Title: "Wybierz przepis"
Close button (×)
Content:
<SearchBar> - search przepisów (debounce 300ms)
<RecipeList> - lista przepisów (infinite scroll)
<RecipeCard> clickable
Click: Przypisz przepis + zamknij modal + optimistic update
Footer: <Button> "Anuluj"
Backdrop click: zamknij (ale toast "Anulowano")
Escape key: zamknij
UX considerations:

Dzisiejszy dzień highlighted (border, background color)
Puste komórki z hover state (border dashed)
Week navigator sticky dla łatwej nawigacji
Deep linking: bookmarkable URLs dla konkretnych tygodni
Optimistic UI dla assign/delete (instant feedback)
Loading: skeleton calendar podczas fetch
Empty state (cały tydzień pusty): hint "Kliknij komórkę aby przypisać przepis"
Accessibility:

Każda komórka z aria-label="Przypisz przepis do Poniedziałek Śniadanie"
Modal z focus trap
Keyboard navigation: Tab między komórkami, Enter otwiera modal
ARIA live region: "Przepis przypisany do Poniedziałek Obiad"
Security:

RLS: tylko meal plan zalogowanego użytkownika
Recipe picker: tylko przepisy użytkownika
API Integration:

GET /api/meal-plan?week_start_date=2025-01-20
POST /api/meal-plan (body: { recipe_id, week_start_date, day_of_week, meal_type })
DELETE /api/meal-plan/:id
TanStack Query:
const { data: mealPlan } = useQuery({
queryKey: ['meal-plan', weekStartDate],
queryFn: () => api.getMealPlan(weekStartDate),
staleTime: 0, // Zawsze fresh
refetchOnWindowFocus: true,
});

const assignRecipe = useMutation({
mutationFn: (assignment) => api.assignRecipe(assignment),
onMutate: async (newAssignment) => {
// Optimistic update
await queryClient.cancelQueries(['meal-plan']);
const previous = queryClient.getQueryData(['meal-plan']);
queryClient.setQueryData(['meal-plan'], (old) => [...old, newAssignment]);
return { previous };
},
onError: (err, variables, context) => {
queryClient.setQueryData(['meal-plan'], context.previous);
toast.error('Nie udało się przypisać przepisu');
},
onSettled: () => {
queryClient.invalidateQueries(['meal-plan']);
},
});
Performance optimizations:

Prefetch sąsiednich tygodni podczas nawigacji
Recipe picker modal lazy loaded
Virtual scrolling dla długiej listy przepisów (opcjonalne)
2.2.7 Shopping Lists History
Ścieżka: /shopping-lists

Główny cel: Przeglądanie wszystkich zapisanych list zakupów użytkownika

Kluczowe informacje:

Lista wszystkich zapisanych list (sorted by created_at DESC)
Każda lista: nazwa, data utworzenia, zakres dat (jeśli z kalendarza), liczba składników
Kluczowe komponenty:

<ShoppingListsHeader> (sticky top)
Breadcrumbs: "Listy zakupów"
<Button> "Generuj nową listę" (primary, sticky mobile) → /shopping-lists/generate
<ShoppingListsList> (main content)
<ShoppingListCard> × n
Nazwa listy (truncate 60 znaków)
Data utworzenia (relative time: "2 dni temu")
Zakres dat: "Tydzień 20-26 stycznia" (jeśli z kalendarza)
Liczba składników: badge "23 składniki"
Click: Navigate to /shopping-lists/:id
<Button> "Usuń" (icon button, top-right) → Confirmation dialog
Grid: 2 kolumny (desktop), 1 (mobile)
<DeleteConfirmationDialog>
Title: "Usuń listę zakupów?"
Description: "Czy na pewno usunąć listę '{name}'?"
Actions: "Anuluj" | "Usuń listę"
<EmptyState> (jeśli 0 list)
Ilustracja
"Nie masz jeszcze list zakupów. Wygeneruj pierwszą!"
<Button> "Generuj listę"
UX considerations:

Cards clickable (cała powierzchnia, nie tylko tekst)
Hover state na cards
Delete button z confirmation (prevent accidental deletion)
Pagination jeśli >20 list (opcjonalne w MVP)
Accessibility:

Cards jako <article> z semantic HTML
Delete button z aria-label="Usuń listę {name}"
Security:

RLS: tylko listy zalogowanego użytkownika
API Integration:

GET /api/shopping-lists?page=1&limit=20
DELETE /api/shopping-lists/:id
2.2.8 Shopping List Generate (Wizard)
Ścieżka: /shopping-lists/generate

Główny cel: Wygenerować nową listę zakupów poprzez 4-etapowy wizard

Kluczowe informacje:

Tryb generowania (z kalendarza / z przepisów)
Wybrane posiłki lub przepisy
Preview składników z AI kategoryzacją
Edycja przed zapisem
Kluczowe komponenty:

<ShoppingListWizard> (main container, React component, client:load)

Struktura 4 etapów:

ETAP 1: Wybór trybu

Komponenty:

<ProgressBar> - 4 steps, current: 1
<ModeSelector>
Radio group: "Z kalendarza" (default) | "Z przepisów"
Pod każdym: opis
"Z kalendarza": "Wybierz posiłki z kalendarza tygodniowego"
"Z przepisów": "Wybierz dowolne przepisy z kolekcji"
<Button> "Dalej" (disabled jeśli nic nie wybrane)
UX:

Auto-select "Z kalendarza" jako default
Button "Dalej" always enabled (przejście do Step 2)
ETAP 2a: Selekcja z kalendarza

Komponenty:

<ProgressBar> - current: 2
<CalendarSelector>
Mini-widok kalendarza (read-only)
Checkbox przy każdym dniu/posiłku
Shortcut: <Button> "Zaznacz cały tydzień" (akcja masowa)
Counter: "Zaznaczono 12 posiłków" (live update)
Walidacja: Jeśli puste komórki → warning "3 posiłki nie mają przypisanych przepisów" (ale pozwól kontynuować)
<Button> "Wstecz" (secondary)
<Button> "Generuj listę" (primary, disabled jeśli 0 zaznaczonych)
UX:

Checkbox group z select all
Visual feedback: zaznaczone checkboxy
Warning alert (żółty) jeśli puste komórki, ale nie blokuj
ETAP 2b: Selekcja z przepisów

Komponenty:

<ProgressBar> - current: 2
<RecipeSelector>
<SearchBar> - search przepisów (debounce 300ms)
Lista przepisów z checkboxami
Counter: "Zaznaczono 5 przepisów"
<Button> "Wstecz"
<Button> "Generuj listę" (disabled jeśli 0 zaznaczonych)
UX:

Live search
Checkbox przy każdym przepisie
Tooltip na disabled button: "Zaznacz minimum 1 przepis"
ETAP 3: Loading state

Komponenty:

<ProgressBar> - animated progress
"Pobieram składniki... 40%"
"Agregacja... 70%"
"Kategoryzacja AI... 90%"
<Spinner> (center)
Komunikat: "Kategoryzuję składniki..." (podczas AI call)
UX:

Progress bar animated (smooth transition)
Nie można anulować (loading state)
Jeśli AI timeout: Toast info "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie." + kontynuuj z "Inne"
ETAP 4: Preview i edycja

Komponenty:

<ProgressBar> - current: 4
<ShoppingListPreview>
Lista składników pogrupowana po kategoriach (7 sekcji)
<CategorySection> × 7 (collapsible)
Header: Nazwa kategorii (np. "Nabiał") + liczba składników
<IngredientRow> × n
Checkbox (niezaznaczony default)
Inline editable: ilość (input), jednostka (input), nazwa (input)
Dropdown: zmiana kategorii (7 opcji)
<Button> "×" usuń składnik (icon button)
<Button> "+ Dodaj składnik" → Mini-form: nazwa, ilość, jednostka, kategoria
<FormActions> (sticky bottom)
<Button> "Wstecz"
<Button> "Anuluj" → redirect do /shopping-lists
<Button> "Zapisz listę" (primary) → Open dialog z nazwą
UX:

Kategorie collapsible (accordion)
Inline editing z auto-save (local state, nie API)
Drag-and-drop między kategoriami (opcjonalne w MVP)
Success: Dialog z nazwą listy → Zapis → Redirect do /shopping-lists/:id
<SaveListDialog> (modal)

Title: "Zapisz listę zakupów"
Input: Nazwa listy (default: "Lista zakupów - {data}")
Validation: max 200 znaków
Actions: "Anuluj" | "Zapisz" (primary)
Success: Close modal + redirect + Toast "Lista zapisana"
UX considerations:

Wizard z clear progress indicator (breadcrumbs/steps)
Back navigation: powrót do poprzedniego etapu (zachowanie stanu)
Walidacja na każdym etapie przed przejściem dalej
Optimistic UI podczas edycji preview (local state)
Success flow: redirect do saved list
Accessibility:

Progress bar z aria-valuenow, aria-valuemin, aria-valuemax
Each step z aria-label="Krok 2 z 4: Wybierz posiłki"
Checkboxes z labels
Inline editing z focus management
Security:

Validation na każdym etapie
Max 20 przepisów, max 100 składników
API Integration:

POST /api/shopping-lists/preview (etap 3) - zwraca preview z AI kategoryzacją
POST /api/shopping-lists (etap 4) - zapisuje ostateczną listę
2.2.9 Shopping List Details
Ścieżka: /shopping-lists/:id

Główny cel: Wyświetlić szczegóły listy zakupów, umożliwić zaznaczanie składników i eksport

Kluczowe informacje:

Nazwa listy
Data utworzenia
Zakres dat (jeśli z kalendarza)
Składniki pogrupowane po kategoriach (7 sekcji)
Checkboxy dla składników (is_checked state)
Kluczowe komponenty:

<ShoppingListHeader> (sticky top)
Breadcrumbs: "Listy zakupów > Nazwa listy"
<ExportButtons>
<Button> "Eksportuj PDF" (primary) → Open preview modal
<Button> "Eksportuj TXT" (secondary) → Direct download
<Button> "Usuń listę" (destructive) → Confirmation
<ShoppingListDetails> (main content)
Title: Nazwa listy (h1)
Meta: Data utworzenia, zakres dat (small text)
<CategorySection> × 7 (collapsible accordion)
Header: Nazwa kategorii + liczba składników
<IngredientItem> × n
<Checkbox> - is_checked (toggle z optimistic update)
Ilość + jednostka + nazwa (np. "200 g mąki")
Checked state: line-through text, muted color
<PDFPreviewModal> (lazy loaded)
Size: Fullscreen (mobile), large modal (desktop)
Content: <iframe> z renderowanym PDF
Actions: "Pobierz PDF" | "Anuluj"
Loading: Skeleton + "Generuję PDF..."
UX considerations:

Checkboxy duże, touch-friendly (min 44px)
Checked items na dół sekcji (opcjonalne)
Kategorie collapsible dla łatwiejszego scrollowania
PDF preview przed pobraniem (user confirmation)
TXT direct download (no preview)
Filename: {nazwa-listy}-{data}.pdf|txt (lowercase, spacje → myślniki)
Accessibility:

Checkboxes z labels
Kategorie jako accordion z aria-expanded
PDF preview modal z focus trap
Security:

RLS: tylko listy zalogowanego użytkownika
404 jeśli lista nie istnieje
API Integration:

GET /api/shopping-lists/:id
PATCH /api/shopping-lists/:list_id/items/:item_id (toggle checkbox)
Optimistic update: toggle natychmiast, rollback on error
DELETE /api/shopping-lists/:id
Export Implementation:

PDF: @react-pdf/renderer (client-side generation)
Layout: A4 pionowy, Helvetica
Header: "Lista zakupów - {nazwa}", data
Kategorie: bold, uppercase
Składniki: checkbox ☐, ilość, jednostka, nazwa
Footer: "Wygenerowano przez ShopMate"
TXT: plaintext
Header: "LISTA ZAKUPÓW SHOPMATE", separator (50x =)
Kategorie: uppercase, separator (20x -)
Składniki: ilość jednostka nazwa (jedna linia)
Footer: separator, timestamp
Encoding: UTF-8
