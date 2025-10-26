# REST API Plan

This document outlines the REST API for the ShopMate application, based on the database schema, product requirements, and tech stack.

## 1. Resources

The API is designed around the following main resources, which correspond to the database tables:

- **Recipes**: Represents user-created culinary recipes.
  - *Database Table*: `recipes`
- **Ingredients**: Represents the ingredients associated with a recipe.
  - *Database Table*: `ingredients`
- **Meal Plan**: Represents the weekly meal calendar assignments.
  - *Database Table*: `meal_plan`
- **Shopping Lists**: Represents generated and saved shopping lists (as snapshots).
  - *Database Table*: `shopping_lists`
- **Shopping List Items**: Represents individual items within a saved shopping list.
  - *Database Table*: `shopping_list_items`

## 2. Endpoints

All endpoints are protected and require user authentication. The `user_id` is derived from the authenticated user's session (JWT) via Supabase's `auth.uid()` function, enforced by Row Level Security (RLS) policies.

### 2.1 Recipes

#### `GET /api/recipes`
- **Description**: Retrieves a paginated, sorted, and searchable list of recipes for the authenticated user.
- **Query Parameters**:
  - `search` (string, optional): Search term to filter recipes by name (case-insensitive).
  - `sortBy` (string, optional): Field to sort by. Enum: `name`, `created_at`. Default: `created_at`.
  - `order` (string, optional): Sort order. Enum: `asc`, `desc`. Default: `desc`.
  - `page` (integer, optional): Page number for pagination. Default: `1`.
  - `pageSize` (integer, optional): Number of items per page. Default: `20`.
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Scrambled Eggs",
        "created_at": "2025-10-25T10:00:00Z",
        "updated_at": "2025-10-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.

#### `POST /api/recipes`
- **Description**: Creates a new recipe with its ingredients for the authenticated user.
- **Request Body**:
  ```json
  {
    "name": "Pancakes",
    "instructions": "1. Mix flour, eggs, and milk. 2. Fry on a pan.",
    "ingredients": [
      {
        "name": "Flour",
        "quantity": 200,
        "unit": "g",
        "sort_order": 1
      },
      {
        "name": "Eggs",
        "quantity": 2,
        "unit": null,
        "sort_order": 2
      }
    ]
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "id": "new-recipe-uuid",
    "name": "Pancakes",
    "instructions": "1. Mix flour, eggs, and milk. 2. Fry on a pan.",
    "created_at": "2025-10-25T10:00:00Z",
    "updated_at": "2025-10-25T10:00:00Z",
    "ingredients": [
      {
        "id": "ingredient-uuid-1",
        "name": "Flour",
        "quantity": 200,
        "unit": "g",
        "sort_order": 1
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failed (e.g., name too short, no ingredients).
  - `401 Unauthorized`: User is not authenticated.

#### `GET /api/recipes/{id}`
- **Description**: Retrieves a single recipe with its full details, including ingredients.
- **URL Parameters**:
  - `id` (UUID): The ID of the recipe to retrieve.
- **Success Response (200 OK)**:
  ```json
  {
    "id": "recipe-uuid",
    "name": "Pancakes",
    "instructions": "1. Mix flour, eggs, and milk. 2. Fry on a pan.",
    "created_at": "2025-10-25T10:00:00Z",
    "updated_at": "2025-10-25T10:00:00Z",
    "ingredients": [
      {
        "id": "ingredient-uuid-1",
        "recipe_id": "recipe-uuid",
        "name": "Flour",
        "quantity": 200,
        "unit": "g",
        "sort_order": 1
      }
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Recipe with the given ID does not exist or does not belong to the user.

#### `PUT /api/recipes/{id}`
- **Description**: Updates an existing recipe and its ingredients.
- **URL Parameters**:
  - `id` (UUID): The ID of the recipe to update.
- **Request Body**: (Same structure as `POST /api/recipes`)
- **Success Response (200 OK)**: (Returns the updated recipe object, same structure as `GET /api/recipes/{id}`)
- **Error Responses**:
  - `400 Bad Request`: Validation failed.
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Recipe not found.

#### `DELETE /api/recipes/{id}`
- **Description**: Deletes a recipe and its associated ingredients and meal plan assignments.
- **URL Parameters**:
  - `id` (UUID): The ID of the recipe to delete.
- **Success Response (204 No Content)**:
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Recipe not found.

### 2.2 Meal Plan

#### `GET /api/meal-plan`
- **Description**: Retrieves the meal plan for a specific week.
- **Query Parameters**:
  - `week_start_date` (string, required): The start date of the week in `YYYY-MM-DD` format (must be a Monday).
- **Success Response (200 OK)**:
  ```json
  {
    "week_start_date": "2025-10-20",
    "assignments": [
      {
        "id": "meal-plan-uuid",
        "recipe_id": "recipe-uuid",
        "day_of_week": 1,
        "meal_type": "dinner",
        "recipe": {
          "name": "Spaghetti Bolognese"
        }
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `week_start_date` is missing or invalid.
  - `401 Unauthorized`: User is not authenticated.

#### `POST /api/meal-plan`
- **Description**: Assigns a recipe to a specific day and meal in the calendar.
- **Request Body**:
  ```json
  {
    "recipe_id": "recipe-uuid",
    "week_start_date": "2025-10-20",
    "day_of_week": 1,
    "meal_type": "dinner"
  }
  ```
- **Success Response (201 Created)**: (Returns the newly created assignment object)
  ```json
  {
    "id": "new-assignment-uuid",
    "recipe_id": "recipe-uuid",
    "week_start_date": "2025-10-20",
    "day_of_week": 1,
    "meal_type": "dinner"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failed.
  - `401 Unauthorized`: User is not authenticated.
  - `409 Conflict`: An assignment for this slot already exists.

#### `DELETE /api/meal-plan/{id}`
- **Description**: Removes a recipe assignment from the meal plan.
- **URL Parameters**:
  - `id` (UUID): The ID of the meal plan assignment to delete.
- **Success Response (204 No Content)**:
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Assignment not found.

### 2.3 Shopping Lists

#### `POST /api/shopping-lists/generate`
- **Description**: Generates a new shopping list by aggregating ingredients from selected recipes or a meal plan. This is a business logic endpoint.
- **Request Body**:
  ```json
  {
    "mode": "calendar", // "calendar" or "recipes"
    "recipe_ids": null, // or ["uuid1", "uuid2"] if mode is "recipes"
    "meal_plan_selection": { // if mode is "calendar"
      "week_start_date": "2025-10-20",
      "days": [1, 2, 3, 4, 5, 6, 7]
    }
  }
  ```
- **Success Response (200 OK)**: (Returns a transient, uncategorized list)
  ```json
  {
    "items": [
      {
        "ingredient_name": "Flour",
        "quantity": 500,
        "unit": "g"
      },
      {
        "ingredient_name": "Salt",
        "quantity": null,
        "unit": "to taste"
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid input or no recipes found for the selection.
  - `401 Unauthorized`: User is not authenticated.

#### `POST /api/shopping-lists/categorize`
- **Description**: Takes a list of ingredients and returns them with AI-powered categories.
- **Request Body**:
  ```json
  {
    "items": [
      { "ingredient_name": "Milk" },
      { "ingredient_name": "Apple" }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "categorized_items": [
      { "ingredient_name": "Milk", "category": "Nabiał" },
      { "ingredient_name": "Apple", "category": "Owoce" }
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `503 Service Unavailable`: AI service is unavailable or timed out.

#### `POST /api/shopping-lists`
- **Description**: Saves a finalized shopping list (snapshot) to the database. This uses the `generate_shopping_list` RPC function for atomicity.
- **Request Body**:
  ```json
  {
    "name": "Weekly Groceries",
    "week_start_date": "2025-10-20", // Can be null
    "items": [
      {
        "ingredient_name": "Milk",
        "quantity": 1,
        "unit": "L",
        "category": "Nabiał",
        "sort_order": 0
      }
    ]
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "id": "new-shopping-list-uuid"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failed.
  - `401 Unauthorized`: User is not authenticated.

#### `GET /api/shopping-lists`
- **Description**: Retrieves a paginated list of saved shopping lists for the user.
- **Query Parameters**: (Standard pagination: `page`, `pageSize`)
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Weekly Groceries",
        "created_at": "2025-10-25T12:00:00Z",
        "week_start_date": "2025-10-20"
      }
    ],
    "pagination": { ... }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.

#### `GET /api/shopping-lists/{id}`
- **Description**: Retrieves a single saved shopping list with all its items.
- **URL Parameters**:
  - `id` (UUID): The ID of the shopping list.
- **Success Response (200 OK)**:
  ```json
  {
    "id": "uuid",
    "name": "Weekly Groceries",
    "created_at": "2025-10-25T12:00:00Z",
    "items": [
      {
        "id": "item-uuid",
        "ingredient_name": "Milk",
        "quantity": 1,
        "unit": "L",
        "category": "Nabiał",
        "is_checked": false,
        "sort_order": 0
      }
    ]
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Shopping list not found.

#### `PATCH /api/shopping-lists/items/{itemId}`
- **Description**: Updates an item on a shopping list, primarily for checking/unchecking.
- **URL Parameters**:
  - `itemId` (UUID): The ID of the shopping list item.
- **Request Body**:
  ```json
  {
    "is_checked": true
  }
  ```
- **Success Response (200 OK)**: (Returns the updated item)
- **Error Responses**:
  - `400 Bad Request`: Invalid body.
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Item not found.

#### `DELETE /api/shopping-lists/{id}`
- **Description**: Deletes a saved shopping list and all its items.
- **URL Parameters**:
  - `id` (UUID): The ID of the shopping list to delete.
- **Success Response (204 No Content)**:
- **Error Responses**:
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: Shopping list not found.

## 3. Authentication and Authorization

- **Authentication**: Handled by Supabase Auth. The client authenticates using email/password, and Supabase provides a JWT stored in a secure, `httpOnly` cookie. All subsequent API requests from the client to Astro server endpoints will include this cookie, which is then passed to the Supabase client on the server.
- **Authorization**: Implemented via PostgreSQL Row Level Security (RLS) policies in the database.
  - All policies ensure that users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` data that belongs to them (i.e., where `table.user_id = auth.uid()`).
  - For nested resources like `ingredients` or `shopping_list_items`, authorization is checked by verifying ownership of the parent resource (e.g., `recipes` or `shopping_lists`).
  - This server-side, database-level authorization ensures data isolation and prevents unauthorized access, even if the client-side code is compromised.

## 4. Validation and Business Logic

- **Input Validation**:
  - All incoming request bodies and query parameters are validated using **Zod** schemas within each Astro API route handler.
  - This provides a "defense in depth" approach, complementing the database `CHECK` constraints.
  - Validation rules from the PRD (e.g., `FR-006`) are implemented in these Zod schemas (e.g., `name` length between 3 and 100 characters).

- **Business Logic Implementation**:
  - **Ingredient Aggregation (`FR-018`)**: Implemented in the `/api/shopping-lists/generate` endpoint. The logic fetches ingredients, normalizes names and units (lowercase, trim), groups them, and sums quantities.
  - **AI Categorization (`FR-019`)**: Handled by the `/api/shopping-lists/categorize` endpoint. This endpoint acts as a secure proxy to the OpenAI API, ensuring the API key is not exposed to the client. It includes retry and fallback logic as specified in the PRD.
  - **Atomic Shopping List Creation**: The `POST /api/shopping-lists` endpoint uses the `generate_shopping_list` PostgreSQL RPC function. This ensures that the creation of the `shopping_lists` record and the bulk insertion of its `shopping_list_items` happen in a single, atomic transaction, preventing partial data writes.
  - **Snapshot Pattern**: The separation of `shopping_lists` from `recipes` and `meal_plan` is enforced by the API. The generation endpoint reads from recipes, but the save endpoint writes denormalized data to the `shopping_list_items` table, fulfilling the snapshot requirement.
  - **Cascade Deletes (`FR-005`)**: This logic is primarily handled by `ON DELETE CASCADE` foreign key constraints in the database. The `DELETE /api/recipes/{id}` endpoint simply needs to delete the recipe, and the database ensures related `ingredients` and `meal_plan` assignments are also removed.

    