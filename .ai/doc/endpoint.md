Recipes:
- GET /api/recipes - Lista przepisów
- GET /api/recipes/:id - Szczegóły przepisu
- POST /api/recipes - Tworzenie przepisu
- PUT /api/recipes/:id - Aktualizacja przepisu
- DELETE /api/recipes/:id - Usuwanie przepisu

Meal Plan:
- GET /api/meal-plan - Plan posiłków na tydzień
- POST /api/meal-plan - Przypisanie przepisu do kalendarza
- DELETE /api/meal-plan/:id - Usunięcie przypisania

Shopping Lists:
- GET /api/shopping-lists - Lista zakupów
- GET /api/shopping-lists/:id - Szczegóły listy
- POST /api/shopping-lists/generate - Generowanie listy (z AI)
- POST /api/shopping-lists - Zapisanie listy
- PATCH /api/shopping-lists/:id/items/:itemId - Aktualizacja pozycji
- DELETE /api/shopping-lists/:id - Usunięcie listy
