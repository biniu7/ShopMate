# Manual Tests: PUT /api/recipes/:id

## Test Setup

**Server:** http://localhost:3002
**Endpoint:** `PUT /api/recipes/:id`
**Authentication:** Required (Supabase JWT token)

---

## Test 1: ✅ Success - Update Recipe

**Scenario:** Authenticated user updates their own recipe

### Prerequisites:

1. User must be logged in (have valid Supabase session)
2. Recipe must exist and belong to the user
3. Get recipe ID from database or previous GET request

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Updated Spaghetti Carbonara",
    "instructions": "1. Boil pasta al dente (8-10 min)\n2. Cook bacon until crispy\n3. Mix eggs with parmesan\n4. Combine all ingredients",
    "ingredients": [
      {
        "name": "spaghetti",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      },
      {
        "name": "bacon",
        "quantity": 200,
        "unit": "g",
        "sort_order": 1
      },
      {
        "name": "eggs",
        "quantity": 3,
        "unit": null,
        "sort_order": 2
      },
      {
        "name": "parmesan cheese",
        "quantity": 100,
        "unit": "g",
        "sort_order": 3
      }
    ]
  }'
```

### Expected Response:

**Status:** `200 OK`

**Body:**

```json
{
  "id": "recipe-uuid",
  "user_id": "user-uuid",
  "name": "Updated Spaghetti Carbonara",
  "instructions": "1. Boil pasta al dente (8-10 min)\n2. Cook bacon until crispy\n3. Mix eggs with parmesan\n4. Combine all ingredients",
  "created_at": "2025-01-26T10:00:00Z",
  "updated_at": "2025-01-26T17:30:00Z",
  "ingredients": [
    {
      "id": "new-uuid-1",
      "recipe_id": "recipe-uuid",
      "name": "spaghetti",
      "quantity": 500,
      "unit": "g",
      "sort_order": 0
    },
    {
      "id": "new-uuid-2",
      "recipe_id": "recipe-uuid",
      "name": "bacon",
      "quantity": 200,
      "unit": "g",
      "sort_order": 1
    },
    {
      "id": "new-uuid-3",
      "recipe_id": "recipe-uuid",
      "name": "eggs",
      "quantity": 3,
      "unit": null,
      "sort_order": 2
    },
    {
      "id": "new-uuid-4",
      "recipe_id": "recipe-uuid",
      "name": "parmesan cheese",
      "quantity": 100,
      "unit": "g",
      "sort_order": 3
    }
  ],
  "meal_plan_assignments": 2
}
```

### Verification:

- ✅ Status code is 200
- ✅ Recipe name and instructions are updated
- ✅ Old ingredients are replaced with new ones (different UUIDs)
- ✅ Ingredients are sorted by sort_order
- ✅ `updated_at` timestamp is newer than `created_at`
- ✅ `meal_plan_assignments` count is included

---

## Test 2: ❌ Error - Invalid Recipe ID (UUID)

**Scenario:** User provides invalid UUID format

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/invalid-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions here...",
    "ingredients": [
      {
        "name": "flour",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

### Expected Response:

**Status:** `400 Bad Request`

**Body:**

```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

### Verification:

- ✅ Status code is 400
- ✅ Error message indicates invalid UUID format

---

## Test 3: ❌ Error - Missing Ingredients

**Scenario:** Request body has empty ingredients array

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions here...",
    "ingredients": []
  }'
```

### Expected Response:

**Status:** `400 Bad Request`

**Body:**

```json
{
  "error": "Validation error",
  "details": {
    "ingredients": ["At least 1 ingredient required"]
  }
}
```

### Verification:

- ✅ Status code is 400
- ✅ Validation error details show ingredients error

---

## Test 4: ❌ Error - Recipe Name Too Short

**Scenario:** Recipe name is less than 3 characters

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Ab",
    "instructions": "Test instructions here...",
    "ingredients": [
      {
        "name": "flour",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

### Expected Response:

**Status:** `400 Bad Request`

**Body:**

```json
{
  "error": "Validation error",
  "details": {
    "name": ["Name must be at least 3 characters"]
  }
}
```

### Verification:

- ✅ Status code is 400
- ✅ Validation error shows name length requirement

---

## Test 5: ❌ Error - Instructions Too Short

**Scenario:** Instructions are less than 10 characters

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Short",
    "ingredients": [
      {
        "name": "flour",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

### Expected Response:

**Status:** `400 Bad Request`

**Body:**

```json
{
  "error": "Validation error",
  "details": {
    "instructions": ["Instructions must be at least 10 characters"]
  }
}
```

### Verification:

- ✅ Status code is 400
- ✅ Validation error shows instructions length requirement

---

## Test 6: ❌ Error - Recipe Not Found

**Scenario:** Recipe ID doesn't exist in database

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions here...",
    "ingredients": [
      {
        "name": "flour",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

### Expected Response:

**Status:** `404 Not Found`

**Body:**

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

### Verification:

- ✅ Status code is 404
- ✅ Error message indicates recipe not found

---

## Test 7: ❌ Error - Recipe Belongs to Another User

**Scenario:** User tries to update recipe that belongs to another user

### Prerequisites:

1. Create recipe with User A
2. Try to update it with User B's token

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{USER_A_RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={USER_B_TOKEN}" \
  -d '{
    "name": "Hacked Recipe",
    "instructions": "Trying to update someone else recipe",
    "ingredients": [
      {
        "name": "flour",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

### Expected Response:

**Status:** `404 Not Found`

**Body:**

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

### Verification:

- ✅ Status code is 404 (not 403 - for security reasons, we don't reveal that recipe exists)
- ✅ Recipe is not updated in database

---

## Test 8: ❌ Error - Not Authenticated

**Scenario:** User is not logged in (no session cookie)

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions here...",
    "ingredients": [
      {
        "name": "flour",
        "quantity": 500,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

### Expected Response:

**Status:** `401 Unauthorized`

**Body:**

```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

### Verification:

- ✅ Status code is 401
- ✅ Error message indicates authentication required

---

## Test 9: ❌ Error - Invalid JSON

**Scenario:** Request body contains malformed JSON

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test",
    "ingredients": [
      {
        "name": "flour"
        "quantity": 500,  # Missing comma
      }
    ]
  }'
```

### Expected Response:

**Status:** `400 Bad Request`

**Body:**

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

### Verification:

- ✅ Status code is 400
- ✅ Error message indicates invalid JSON

---

## Test 10: ✅ Edge Case - Null Quantities and Units

**Scenario:** Update recipe with ingredients that have null quantity/unit

### Request:

```bash
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Simple Salad",
    "instructions": "Mix all ingredients together",
    "ingredients": [
      {
        "name": "lettuce",
        "quantity": null,
        "unit": null,
        "sort_order": 0
      },
      {
        "name": "tomatoes",
        "quantity": 3,
        "unit": null,
        "sort_order": 1
      }
    ]
  }'
```

### Expected Response:

**Status:** `200 OK`

**Body:**

```json
{
  "id": "recipe-uuid",
  "name": "Simple Salad",
  "ingredients": [
    {
      "name": "lettuce",
      "quantity": null,
      "unit": null,
      "sort_order": 0
    },
    {
      "name": "tomatoes",
      "quantity": 3,
      "unit": null,
      "sort_order": 1
    }
  ],
  ...
}
```

### Verification:

- ✅ Status code is 200
- ✅ Null values are accepted and stored correctly

---

## Test 11: ❌ Error - Too Many Ingredients

**Scenario:** Request with more than 50 ingredients (max limit)

### Request:

```bash
# Create array with 51 ingredients
curl -X PUT http://localhost:3002/api/recipes/{RECIPE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={YOUR_TOKEN}" \
  -d '{
    "name": "Mega Recipe",
    "instructions": "Too many ingredients...",
    "ingredients": [
      ... 51 ingredients ...
    ]
  }'
```

### Expected Response:

**Status:** `400 Bad Request`

**Body:**

```json
{
  "error": "Validation error",
  "details": {
    "ingredients": ["Maximum 50 ingredients allowed"]
  }
}
```

### Verification:

- ✅ Status code is 400
- ✅ Validation error shows max ingredients limit

---

## How to Get Authentication Token

### Option 1: Browser DevTools

1. Log in to the application
2. Open DevTools (F12)
3. Go to Application > Cookies
4. Find `sb-access-token` cookie
5. Copy the value

### Option 2: Using Supabase Client

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Summary

| Test # | Scenario                     | Expected Status  | Status     |
| ------ | ---------------------------- | ---------------- | ---------- |
| 1      | Success - Update recipe      | 200 OK           | ⏳ To test |
| 2      | Invalid UUID                 | 400 Bad Request  | ⏳ To test |
| 3      | Missing ingredients          | 400 Bad Request  | ⏳ To test |
| 4      | Name too short               | 400 Bad Request  | ⏳ To test |
| 5      | Instructions too short       | 400 Bad Request  | ⏳ To test |
| 6      | Recipe not found             | 404 Not Found    | ⏳ To test |
| 7      | Recipe belongs to other user | 404 Not Found    | ⏳ To test |
| 8      | Not authenticated            | 401 Unauthorized | ⏳ To test |
| 9      | Invalid JSON                 | 400 Bad Request  | ⏳ To test |
| 10     | Null quantities/units        | 200 OK           | ⏳ To test |
| 11     | Too many ingredients         | 400 Bad Request  | ⏳ To test |

---

## Next Steps

After completing manual tests, verify:

1. ✅ Meal Plan Live Update (changes propagate)
2. ✅ Shopping List Snapshot (changes do NOT propagate)
