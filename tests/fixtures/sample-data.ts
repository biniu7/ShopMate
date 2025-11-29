/**
 * Przykładowe dane testowe (fixtures) dla testów jednostkowych i E2E
 * Factory functions do generowania testowych obiektów
 */

/**
 * Przykładowy przepis
 */
export const sampleRecipe = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Spaghetti Carbonara',
  instructions: 'Ugotuj makaron. Usmaż boczek. Połącz z jajkami i serem.',
  created_at: '2025-01-01T12:00:00Z',
  updated_at: '2025-01-01T12:00:00Z',
};

/**
 * Przykładowe składniki
 */
export const sampleIngredients = [
  {
    id: '1',
    recipe_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Makaron spaghetti',
    quantity: 500,
    unit: 'g',
    sort_order: 0,
  },
  {
    id: '2',
    recipe_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Boczek',
    quantity: 200,
    unit: 'g',
    sort_order: 1,
  },
  {
    id: '3',
    recipe_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Jajka',
    quantity: 4,
    unit: 'szt',
    sort_order: 2,
  },
];

/**
 * Przykładowy plan posiłków
 */
export const sampleMealPlan = {
  id: '1',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  recipe_id: '550e8400-e29b-41d4-a716-446655440000',
  week_start_date: '2025-01-06', // Poniedziałek
  day_of_week: 1, // Poniedziałek
  meal_type: 'dinner' as const,
};

/**
 * Przykładowa lista zakupów
 */
export const sampleShoppingList = {
  id: '1',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Lista zakupów - Tydzień 1',
  week_start_date: '2025-01-06',
  week_end_date: '2025-01-12',
  created_at: '2025-01-06T10:00:00Z',
};

/**
 * Przykładowe elementy listy zakupów
 */
export const sampleShoppingListItems = [
  {
    id: '1',
    shopping_list_id: '1',
    ingredient_name: 'Makaron spaghetti',
    quantity: 500,
    unit: 'g',
    category: 'Pieczywo' as const,
    is_checked: false,
    sort_order: 0,
  },
  {
    id: '2',
    shopping_list_id: '1',
    ingredient_name: 'Boczek',
    quantity: 200,
    unit: 'g',
    category: 'Mięso' as const,
    is_checked: false,
    sort_order: 1,
  },
  {
    id: '3',
    shopping_list_id: '1',
    ingredient_name: 'Jajka',
    quantity: 4,
    unit: 'szt',
    category: 'Nabiał' as const,
    is_checked: false,
    sort_order: 2,
  },
];

/**
 * Factory function do tworzenia custom przepisu
 */
export function createRecipe(overrides?: Partial<typeof sampleRecipe>) {
  return {
    ...sampleRecipe,
    ...overrides,
  };
}

/**
 * Factory function do tworzenia custom składnika
 */
export function createIngredient(
  overrides?: Partial<(typeof sampleIngredients)[0]>
) {
  return {
    ...sampleIngredients[0],
    ...overrides,
  };
}

/**
 * Factory function do tworzenia custom planu posiłku
 */
export function createMealPlan(overrides?: Partial<typeof sampleMealPlan>) {
  return {
    ...sampleMealPlan,
    ...overrides,
  };
}

/**
 * Factory function do tworzenia custom listy zakupów
 */
export function createShoppingList(
  overrides?: Partial<typeof sampleShoppingList>
) {
  return {
    ...sampleShoppingList,
    ...overrides,
  };
}

/**
 * Factory function do tworzenia custom elementu listy zakupów
 */
export function createShoppingListItem(
  overrides?: Partial<(typeof sampleShoppingListItems)[0]>
) {
  return {
    ...sampleShoppingListItems[0],
    ...overrides,
  };
}