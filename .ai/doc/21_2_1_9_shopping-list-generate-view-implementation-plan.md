# Plan implementacji widoku Shopping List Generate (Wizard)

## 1. Przegląd

Widok Shopping List Generate jest 4-etapowym wizardem umożliwiającym wygenerowanie nowej listy zakupów z kalendarza tygodniowego lub wybranych przepisów. Wizard prowadzi użytkownika przez proces: wybór trybu → selekcja posiłków/przepisów → automatyczna generacja z AI kategoryzacją → edycja preview → zapis.

**4 etapy wizarda:**

1. **Mode Selection** - wybór trybu generowania ("Z kalendarza" lub "Z przepisów")
2. **Selection** - zaznaczenie posiłków (2a) lub przepisów (2b)
3. **Generation** - loading state z progress bar podczas fetchu i AI kategoryzacji
4. **Preview & Edit** - edycja wygenerowanej listy przed zapisem

Po zapisie użytkownik jest przekierowywany do widoku szczegółów nowo utworzonej listy.

## 2. Routing widoku

**Ścieżka:** `/shopping-lists/generate`

**Query Parameters:**

- `step` (optional) - numer aktualnego kroku (1-4)
- `mode` (optional) - `calendar` | `recipes`

**Typ:** Strona Astro z dynamicznym komponentem React (client:load)

**Zabezpieczenia:**

- Middleware sprawdza autentykację
- Walidacja na każdym kroku
- Max 20 recipes, max 100 ingredients

## 3. Struktura komponentów

```
src/pages/shopping-lists/generate.astro
└── ShoppingListGenerateView.tsx (React, client:load)
    └── ShoppingListWizard.tsx (State machine)
        ├── WizardHeader.tsx
        │   ├── ProgressBar (4 steps)
        │   └── Breadcrumbs
        ├── Step1_ModeSelection.tsx
        │   ├── ModeSelector (Radio group)
        │   └── NextButton
        ├── Step2a_CalendarSelection.tsx
        │   ├── CalendarSelector (checkboxes)
        │   ├── ShortcutButtons ("Zaznacz cały tydzień")
        │   ├── SelectionCounter
        │   └── NavigationButtons (Back, Next)
        ├── Step2b_RecipesSelection.tsx
        │   ├── SearchBar
        │   ├── RecipesList (checkboxes)
        │   ├── SelectionCounter
        │   └── NavigationButtons (Back, Next)
        ├── Step3_Generation.tsx
        │   ├── ProgressBar (animated)
        │   ├── LoadingMessages
        │   └── Spinner
        ├── Step4_PreviewEdit.tsx
        │   ├── ShoppingListPreview
        │   │   ├── CategorySection × 7 (collapsible)
        │   │   │   ├── CategoryHeader
        │   │   │   └── IngredientRow × n
        │   │   │       ├── Checkbox
        │   │   │       ├── InlineEditInputs (qty, unit, name)
        │   │   │       ├── CategoryDropdown
        │   │   │       └── DeleteButton
        │   │   └── AddIngredientButton
        │   └── NavigationButtons (Back, Anuluj, Zapisz)
        └── SaveListDialog
            ├── DialogContent (input nazwa)
            └── SaveButton
```

## 4. Szczegóły komponentów

### 4.1. ShoppingListGenerateView (Główny kontener)

**Opis:**
Główny kontener renderujący wizard.

**Główne elementy:**

```tsx
<div className="shopping-list-generate-view">
  <div className="container mx-auto max-w-5xl p-4">
    <ShoppingListWizard />
  </div>
</div>
```

### 4.2. ShoppingListWizard (State machine)

**Opis:**
Główny komponent zarządzający stanem wizarda (aktualny step, mode, selections, preview data).

**Stan wizarda:**

```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  mode: "calendar" | "recipes" | null;

  // Step 2a state (calendar)
  selectedMeals: CalendarSelectionDto[]; // {day_of_week, meal_types[]}

  // Step 2b state (recipes)
  selectedRecipes: string[]; // recipe IDs

  // Step 3 state (generation)
  generationStatus: "idle" | "fetching" | "categorizing" | "done" | "error";
  generationProgress: number; // 0-100

  // Step 4 state (preview)
  previewItems: ShoppingListItemPreviewDto[];
  previewMetadata: ShoppingListPreviewMetadataDto | null;

  // Modified items (for save)
  modifiedItems: SaveShoppingListItemDto[];
}
```

**Główne metody:**

```typescript
- goToStep(step: number)
- selectMode(mode: 'calendar' | 'recipes')
- toggleMeal(dayOfWeek: number, mealType: MealType)
- toggleRecipe(recipeId: string)
- generatePreview() // POST /api/shopping-lists/preview
- updateItem(index: number, field: string, value: any)
- removeItem(index: number)
- addItem(item: SaveShoppingListItemDto)
- saveList(name: string) // POST /api/shopping-lists
```

**Renderowanie conditional steps:**

```tsx
<div className="wizard">
  <WizardHeader currentStep={state.currentStep} />

  {state.currentStep === 1 && (
    <Step1_ModeSelection
      selectedMode={state.mode}
      onSelectMode={(mode) => selectMode(mode)}
      onNext={() => goToStep(2)}
    />
  )}

  {state.currentStep === 2 && state.mode === "calendar" && (
    <Step2a_CalendarSelection
      selectedMeals={state.selectedMeals}
      onToggleMeal={toggleMeal}
      onBack={() => goToStep(1)}
      onNext={() => {
        goToStep(3);
        generatePreview();
      }}
    />
  )}

  {state.currentStep === 2 && state.mode === "recipes" && (
    <Step2b_RecipesSelection
      selectedRecipes={state.selectedRecipes}
      onToggleRecipe={toggleRecipe}
      onBack={() => goToStep(1)}
      onNext={() => {
        goToStep(3);
        generatePreview();
      }}
    />
  )}

  {state.currentStep === 3 && <Step3_Generation status={state.generationStatus} progress={state.generationProgress} />}

  {state.currentStep === 4 && (
    <Step4_PreviewEdit
      items={state.modifiedItems}
      metadata={state.previewMetadata}
      onUpdateItem={updateItem}
      onRemoveItem={removeItem}
      onAddItem={addItem}
      onBack={() => goToStep(2)}
      onCancel={() => router.push("/shopping-lists")}
      onSave={(name) => saveList(name)}
    />
  )}
</div>
```

### 4.3. WizardHeader

**Opis:**
Header z breadcrumbs i progress bar.

**Główne elementy:**

```tsx
<div className="wizard-header mb-8">
  <Breadcrumbs
    items={[
      { label: "Listy zakupów", href: "/shopping-lists" },
      { label: "Generuj listę", href: "/shopping-lists/generate" },
    ]}
  />

  <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-6">Generuj listę zakupów</h1>

  <ProgressBar currentStep={currentStep} totalSteps={4} />
</div>
```

**ProgressBar:**

```tsx
<div className="progress-bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
  <div className="flex justify-between mb-2">
    {[1, 2, 3, 4].map((step) => (
      <div
        key={step}
        className={cn("flex-1 text-center", step <= currentStep ? "text-primary font-medium" : "text-gray-400")}
      >
        <div className="text-sm">Krok {step}</div>
        <div className="text-xs">{getStepLabel(step)}</div>
      </div>
    ))}
  </div>

  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(currentStep / 4) * 100}%` }} />
  </div>
</div>
```

### 4.4. Step1_ModeSelection

**Opis:**
Wybór trybu generowania listy.

**Główne elementy:**

```tsx
<div className="step-1 max-w-2xl mx-auto">
  <h2 className="text-2xl font-semibold mb-6">Wybierz tryb generowania</h2>

  <RadioGroup value={selectedMode} onValueChange={onSelectMode}>
    <div className="space-y-4">
      <div
        className={cn(
          "border rounded-lg p-6 cursor-pointer transition",
          selectedMode === "calendar" && "border-primary bg-primary/5"
        )}
      >
        <RadioGroupItem value="calendar" id="mode-calendar" />
        <Label htmlFor="mode-calendar" className="cursor-pointer ml-3">
          <div className="font-medium text-lg">Z kalendarza</div>
          <div className="text-sm text-gray-600">Wybierz posiłki z kalendarza tygodniowego</div>
        </Label>
      </div>

      <div
        className={cn(
          "border rounded-lg p-6 cursor-pointer transition",
          selectedMode === "recipes" && "border-primary bg-primary/5"
        )}
      >
        <RadioGroupItem value="recipes" id="mode-recipes" />
        <Label htmlFor="mode-recipes" className="cursor-pointer ml-3">
          <div className="font-medium text-lg">Z przepisów</div>
          <div className="text-sm text-gray-600">Wybierz dowolne przepisy z kolekcji</div>
        </Label>
      </div>
    </div>
  </RadioGroup>

  <div className="flex justify-end mt-8">
    <Button onClick={onNext} disabled={!selectedMode} size="lg">
      Dalej
      <ChevronRight className="h-4 w-4 ml-2" />
    </Button>
  </div>
</div>
```

### 4.5. Step2a_CalendarSelection

**Opis:**
Wybór posiłków z kalendarza tygodniowego.

**Główne elementy:**

```tsx
<div className="step-2a">
  <h2 className="text-2xl font-semibold mb-6">Wybierz posiłki z kalendarza</h2>

  {/* Fetch current week calendar */}
  {isLoadingCalendar && <CalendarSkeleton />}

  {calendar && (
    <>
      <div className="mb-4 flex justify-between items-center">
        <SelectionCounter count={countSelectedMeals(selectedMeals)} label="posiłków" />

        <Button variant="outline" onClick={() => selectAllMeals()}>
          <Check className="h-4 w-4 mr-2" />
          Zaznacz cały tydzień
        </Button>
      </div>

      <CalendarSelector calendar={calendar} selectedMeals={selectedMeals} onToggleMeal={onToggleMeal} />

      {emptyMealsCount > 0 && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {emptyMealsCount} {emptyMealsCount === 1 ? "posiłek nie ma" : "posiłki nie mają"} przypisanych przepisów
          </AlertDescription>
        </Alert>
      )}
    </>
  )}

  <NavigationButtons
    onBack={onBack}
    onNext={onNext}
    nextDisabled={selectedMealsCount === 0}
    nextLabel="Generuj listę"
  />
</div>
```

**CalendarSelector:**
Mini-widok kalendarza z checkboxami.

```tsx
<div className="calendar-selector border rounded-lg p-4">
  {/* Grid 7 days × 4 meals */}
  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
    {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
      <div key={dayOfWeek} className="day-column">
        <div className="font-medium text-sm mb-2">{getDayName(dayOfWeek)}</div>

        {MEAL_TYPES.map((mealType) => {
          const assignment = getAssignment(calendar, dayOfWeek, mealType);
          const isSelected = isMealSelected(selectedMeals, dayOfWeek, mealType);
          const isEmpty = !assignment;

          return (
            <div
              key={mealType}
              className={cn("meal-checkbox-item p-2 border rounded", isEmpty && "bg-gray-50 text-gray-400")}
            >
              <Checkbox
                id={`meal-${dayOfWeek}-${mealType}`}
                checked={isSelected}
                onCheckedChange={() => onToggleMeal(dayOfWeek, mealType)}
                disabled={isEmpty}
              />
              <Label htmlFor={`meal-${dayOfWeek}-${mealType}`} className="ml-2 text-xs cursor-pointer">
                {MEAL_TYPE_LABELS[mealType]}
                {assignment && <div className="text-xs truncate">{assignment.recipe_name}</div>}
              </Label>
            </div>
          );
        })}
      </div>
    ))}
  </div>
</div>
```

### 4.6. Step2b_RecipesSelection

**Opis:**
Wybór przepisów z listy z wyszukiwaniem.

**Główne elementy:**

```tsx
<div className="step-2b">
  <h2 className="text-2xl font-semibold mb-6">Wybierz przepisy</h2>

  <div className="mb-4">
    <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Szukaj przepisu..." />
  </div>

  <SelectionCounter count={selectedRecipes.length} label="przepisów" max={20} />

  {isLoadingRecipes && <RecipesListSkeleton />}

  {recipes && (
    <div className="recipes-list max-h-96 overflow-y-auto border rounded-lg p-4">
      {recipes.filter(filterBySearch).map((recipe) => (
        <div key={recipe.id} className="recipe-checkbox-item flex items-center p-3 hover:bg-gray-50">
          <Checkbox
            id={`recipe-${recipe.id}`}
            checked={selectedRecipes.includes(recipe.id)}
            onCheckedChange={() => onToggleRecipe(recipe.id)}
            disabled={selectedRecipes.length >= 20 && !selectedRecipes.includes(recipe.id)}
          />
          <Label htmlFor={`recipe-${recipe.id}`} className="ml-3 flex-1 cursor-pointer">
            <div className="font-medium">{recipe.name}</div>
            <div className="text-sm text-gray-600">{recipe.ingredients_count} składników</div>
          </Label>
        </div>
      ))}
    </div>
  )}

  <NavigationButtons
    onBack={onBack}
    onNext={onNext}
    nextDisabled={selectedRecipes.length === 0}
    nextLabel="Generuj listę"
  />
</div>
```

### 4.7. Step3_Generation

**Opis:**
Loading state z animated progress bar i komunikatami.

**Główne elementy:**

```tsx
<div className="step-3 text-center py-16">
  <Spinner className="h-16 w-16 mx-auto mb-6" />

  <h2 className="text-2xl font-semibold mb-2">{getGenerationMessage(status)}</h2>

  <p className="text-gray-600 mb-8">{getGenerationDescription(status)}</p>

  <div className="max-w-md mx-auto">
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
    </div>
    <div className="text-sm text-gray-600 mt-2">{progress}%</div>
  </div>

  {status === "error" && (
    <Alert variant="destructive" className="mt-8 max-w-md mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Nie udało się wygenerować listy. Spróbuj ponownie.</AlertDescription>
    </Alert>
  )}
</div>
```

**Generation flow:**

```typescript
async function generatePreview() {
  setState({ generationStatus: "fetching", generationProgress: 0 });

  try {
    // Prepare request body
    const requestBody: ShoppingListPreviewRequestDto =
      state.mode === "calendar"
        ? {
            source: "calendar",
            week_start_date: currentWeekStart,
            selections: state.selectedMeals,
          }
        : {
            source: "recipes",
            recipe_ids: state.selectedRecipes,
          };

    // Simulate progress updates
    updateProgress(40);

    // POST /api/shopping-lists/preview
    const response = await fetch("/api/shopping-lists/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    updateProgress(70);

    if (!response.ok) {
      throw new Error("Failed to generate preview");
    }

    const data: ShoppingListPreviewResponseDto = await response.json();

    updateProgress(90);

    setState({
      generationStatus: "categorizing",
      previewItems: data.items,
      previewMetadata: data.metadata,
      modifiedItems: data.items.map((item) => ({
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        sort_order: item.sort_order,
      })),
    });

    updateProgress(100);

    // Transition to step 4
    setTimeout(() => {
      goToStep(4);
    }, 500);
  } catch (error) {
    setState({ generationStatus: "error" });
    toast.error("Nie udało się wygenerować listy");
  }
}
```

### 4.8. Step4_PreviewEdit

**Opis:**
Preview wygenerowanej listy z możliwością edycji przed zapisem.

**Główne elementy:**

```tsx
<div className="step-4">
  <h2 className="text-2xl font-semibold mb-2">Podgląd listy zakupów</h2>
  <p className="text-gray-600 mb-6">Sprawdź i edytuj listę przed zapisem</p>

  {metadata && (
    <Alert variant={metadata.ai_categorization_status === "success" ? "info" : "warning"} className="mb-6">
      {metadata.ai_categorization_status === "success" ? (
        <>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Lista zawiera {metadata.total_items} składników z {metadata.total_recipes} przepisów. Kategoryzacja AI:
            sukces.
          </AlertDescription>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie.
          </AlertDescription>
        </>
      )}
    </Alert>
  )}

  <ShoppingListPreview items={items} onUpdateItem={onUpdateItem} onRemoveItem={onRemoveItem} onAddItem={onAddItem} />

  <NavigationButtons
    onBack={onBack}
    onCancel={onCancel}
    onSave={() => setSaveDialogOpen(true)}
    saveLabel="Zapisz listę"
  />
</div>
```

**ShoppingListPreview:**

```tsx
<div className="shopping-list-preview space-y-4">
  {CATEGORY_ORDER.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);

    if (categoryItems.length === 0) return null;

    return (
      <Collapsible key={category} defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4" />
            <h3 className="font-semibold">{category}</h3>
            <Badge variant="secondary">{categoryItems.length}</Badge>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-2 pl-4">
          {categoryItems.map((item, index) => (
            <IngredientRow
              key={index}
              item={item}
              onUpdate={(field, value) => onUpdateItem(index, field, value)}
              onRemove={() => onRemoveItem(index)}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  })}

  <Button variant="outline" onClick={() => setAddDialogOpen(true)} className="w-full">
    <Plus className="h-4 w-4 mr-2" />
    Dodaj składnik
  </Button>
</div>
```

**IngredientRow (editable):**

```tsx
<div className="ingredient-row flex items-center gap-2 p-3 border rounded-lg bg-white">
  <Checkbox checked={false} disabled />

  <Input
    type="number"
    value={item.quantity ?? ""}
    onChange={(e) => onUpdate("quantity", e.target.value ? Number(e.target.value) : null)}
    className="w-20"
    placeholder="200"
  />

  <Input
    type="text"
    value={item.unit ?? ""}
    onChange={(e) => onUpdate("unit", e.target.value || null)}
    className="w-20"
    placeholder="g"
  />

  <Input
    type="text"
    value={item.ingredient_name}
    onChange={(e) => onUpdate("ingredient_name", e.target.value)}
    className="flex-1"
    placeholder="nazwa"
  />

  <Select value={item.category} onValueChange={(value) => onUpdate("category", value)}>
    <SelectTrigger className="w-32">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {INGREDIENT_CATEGORIES.map((cat) => (
        <SelectItem key={cat} value={cat}>
          {cat}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Usuń składnik">
    <Trash2 className="h-4 w-4 text-red-600" />
  </Button>
</div>
```

### 4.9. SaveListDialog

**Opis:**
Dialog z inputem dla nazwy listy przed zapisem.

**Główne elementy:**

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Zapisz listę zakupów</DialogTitle>
      <DialogDescription>Podaj nazwę dla listy zakupów</DialogDescription>
    </DialogHeader>

    <div className="py-4">
      <Label htmlFor="list-name">Nazwa listy</Label>
      <Input
        id="list-name"
        value={listName}
        onChange={(e) => setListName(e.target.value)}
        placeholder={getDefaultName()}
        maxLength={200}
        autoFocus
      />
      <p className="text-sm text-gray-600 mt-1">{listName.length}/200</p>
    </div>

    <DialogFooter>
      <Button variant="ghost" onClick={onClose}>
        Anuluj
      </Button>
      <Button onClick={() => onSave(listName)} disabled={isSaving}>
        {isSaving ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            Zapisywanie...
          </>
        ) : (
          "Zapisz"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Default name:**

```typescript
function getDefaultName(): string {
  if (metadata?.source === "calendar" && metadata.week_start_date) {
    return `Lista zakupów - ${formatWeekRange(metadata.week_start_date)}`;
  }
  return `Lista zakupów - ${format(new Date(), "d MMMM yyyy", { locale: pl })}`;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
export interface CalendarSelectionDto {
  day_of_week: number;
  meal_types: MealType[];
}

export interface ShoppingListPreviewCalendarRequestDto {
  source: "calendar";
  week_start_date: string;
  selections: CalendarSelectionDto[];
}

export interface ShoppingListPreviewRecipesRequestDto {
  source: "recipes";
  recipe_ids: string[];
}

export type ShoppingListPreviewRequestDto =
  | ShoppingListPreviewCalendarRequestDto
  | ShoppingListPreviewRecipesRequestDto;

export interface ShoppingListItemPreviewDto {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory;
  sort_order: number;
}

export interface ShoppingListPreviewMetadataDto {
  source: "calendar" | "recipes";
  week_start_date?: string;
  total_recipes: number;
  total_items: number;
  ai_categorization_status: "success" | "failed";
  ai_error?: string;
  skipped_empty_meals?: number;
}

export interface ShoppingListPreviewResponseDto {
  items: ShoppingListItemPreviewDto[];
  metadata: ShoppingListPreviewMetadataDto;
}

export interface SaveShoppingListItemDto {
  ingredient_name: string;
  quantity?: number | null;
  unit?: string | null;
  category: IngredientCategory;
  sort_order: number;
}

export interface SaveShoppingListDto {
  name: string;
  week_start_date?: string | null;
  items: SaveShoppingListItemDto[];
}
```

### 5.2. Stała kolejność kategorii

```typescript
export const CATEGORY_ORDER: IngredientCategory[] = [
  "Nabiał",
  "Warzywa",
  "Owoce",
  "Mięso",
  "Pieczywo",
  "Przyprawy",
  "Inne",
];
```

## 6. Zarządzanie stanem

### 6.1. Wizard State Machine

Używamy `useReducer` lub state management library (Zustand, Jotai) dla złożonego stanu wizarda.

```typescript
type WizardAction =
  | { type: 'SET_MODE'; payload: 'calendar' | 'recipes' }
  | { type: 'TOGGLE_MEAL'; payload: { dayOfWeek: number; mealType: MealType } }
  | { type: 'TOGGLE_RECIPE'; payload: string }
  | { type: 'SET_PREVIEW_DATA'; payload: ShoppingListPreviewResponseDto }
  | { type: 'UPDATE_ITEM'; payload: { index: number; field: string; value: any } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'ADD_ITEM'; payload: SaveShoppingListItemDto }
  | { type: 'GO_TO_STEP'; payload: 1 | 2 | 3 | 4 };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'TOGGLE_MEAL':
      // Toggle meal in selectedMeals array
      // ...

    case 'SET_PREVIEW_DATA':
      return {
        ...state,
        previewItems: action.payload.items,
        previewMetadata: action.payload.metadata,
        modifiedItems: action.payload.items.map(item => ({...})),
      };

    // ... other cases
  }
}
```

## 7. Integracja API

### 7.1. POST /api/shopping-lists/preview

**Request (Calendar Mode):**

```json
{
  "source": "calendar",
  "week_start_date": "2025-01-20",
  "selections": [
    {
      "day_of_week": 1,
      "meal_types": ["breakfast", "lunch"]
    },
    {
      "day_of_week": 2,
      "meal_types": ["breakfast", "second_breakfast", "lunch", "dinner"]
    }
  ]
}
```

**Request (Recipes Mode):**

```json
{
  "source": "recipes",
  "recipe_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    }
  ],
  "metadata": {
    "source": "calendar",
    "week_start_date": "2025-01-20",
    "total_recipes": 5,
    "total_items": 23,
    "ai_categorization_status": "success",
    "skipped_empty_meals": 2
  }
}
```

### 7.2. POST /api/shopping-lists

**Request:**

```json
{
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "items": [
    {
      "ingredient_name": "spaghetti",
      "quantity": 1500,
      "unit": "g",
      "category": "Pieczywo",
      "sort_order": 0
    }
  ]
}
```

**Response (201 Created):**
`ShoppingListResponseDto`

## 8. Interakcje użytkownika

### 8.1. Przepływ wizarda (Calendar mode)

1. User wchodzi na `/shopping-lists/generate`
2. Step 1: wybiera "Z kalendarza" → click "Dalej"
3. Step 2a: fetch calendar → zaznacza posiłki → click "Generuj listę"
4. Step 3: POST /api/shopping-lists/preview → loading → AI kategoryzacja
5. Step 4: preview → edycja składników → click "Zapisz listę"
6. Dialog: input nazwa → click "Zapisz"
7. POST /api/shopping-lists → redirect do `/shopping-lists/:id`

### 8.2. Edycja składnika w preview

1. User modyfikuje ilość w input
2. `onUpdate(index, 'quantity', value)`
3. Local state update (modifiedItems)
4. Nie ma API call do momentu final save

### 8.3. Dodanie składnika w preview

1. User klika "+ Dodaj składnik"
2. Dialog z formularzem (name, qty, unit, category)
3. Click "Dodaj" → append do modifiedItems

### 8.4. Usunięcie składnika z preview

1. User klika trash icon
2. `onRemove(index)`
3. Remove from modifiedItems

## 9. Warunki i walidacja

### 9.1. Step 1: Enable "Dalej" button

```typescript
disabled={!selectedMode}
```

### 9.2. Step 2: Enable "Generuj" button

Calendar:

```typescript
disabled={selectedMealsCount === 0}
```

Recipes:

```typescript
disabled={selectedRecipes.length === 0 || selectedRecipes.length > 20}
```

### 9.3. Step 3: Auto-transition

Gdy `generationStatus === 'done'` i `progress === 100`:

```typescript
setTimeout(() => goToStep(4), 500);
```

### 9.4. Step 4: Validation przed save

```typescript
const isValid = modifiedItems.length > 0 && modifiedItems.every((item) => item.ingredient_name.trim().length > 0);
```

### 9.5. Empty meals warning

```typescript
{emptyMealsCount > 0 && (
  <Alert variant="warning">...</Alert>
)}
```

## 10. Obsługa błędów

### 10.1. Preview generation failed

- Step 3: status = 'error'
- Alert z komunikatem błędu
- Przycisk "Spróbuj ponownie" → back to step 2

### 10.2. Save failed

- Toast: "Nie udało się zapisać listy"
- Dialog pozostaje otwarty
- User może spróbować ponownie

### 10.3. AI categorization failed

- metadata.ai_categorization_status = "failed"
- Wszystkie składniki → category "Inne"
- Warning alert w step 4
- User może ręcznie zmienić kategorie

## 11. Kroki implementacji

### Krok 1: Struktura plików + state machine

### Krok 2: Step 1 (mode selection)

### Krok 3: Step 2a (calendar selection) + fetch calendar

### Krok 4: Step 2b (recipes selection) + fetch recipes

### Krok 5: Step 3 (generation) + POST preview

### Krok 6: Step 4 (preview edit) + inline editing

### Krok 7: Save dialog + POST save

### Krok 8: Navigation + validation

### Krok 9: Testy

---

**Koniec planu implementacji widoku Shopping List Generate**
