# Test Data for POST /api/recipes Endpoint

This document contains test payloads for manually testing the POST /api/recipes endpoint.

## Prerequisites

1. **Start the dev server:**

   ```bash
   npm run dev
   ```

2. **Get authentication token:**
   - Login to your application
   - Open browser DevTools → Application → Cookies
   - Copy the value of `sb-<project-ref>-auth-token` cookie

3. **Set environment variables:**
   Make sure your `.env` file contains:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

---

## Test Case 1: ✅ Successful Recipe Creation

**Description:** Valid recipe with 5 ingredients

**cURL Command:**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=YOUR_TOKEN_HERE" \
  -d '{
    "name": "Spaghetti Carbonara",
    "instructions": "1. Boil pasta in salted water until al dente.\n2. Fry bacon until crispy.\n3. Mix eggs with parmesan.\n4. Combine all ingredients while pasta is hot.",
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
        "name": "parmesan cheese",
        "quantity": 100,
        "unit": "g",
        "sort_order": 2
      },
      {
        "name": "eggs",
        "quantity": 3,
        "unit": "pcs",
        "sort_order": 3
      },
      {
        "name": "salt",
        "quantity": null,
        "unit": null,
        "sort_order": 4
      }
    ]
  }'
```

**Expected Response:**

- Status: `201 Created`
- Body: Complete recipe with generated IDs and timestamps

**JSON Payload (copy-paste friendly):**

```json
{
  "name": "Spaghetti Carbonara",
  "instructions": "1. Boil pasta in salted water until al dente.\n2. Fry bacon until crispy.\n3. Mix eggs with parmesan.\n4. Combine all ingredients while pasta is hot.",
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
      "name": "parmesan cheese",
      "quantity": 100,
      "unit": "g",
      "sort_order": 2
    },
    {
      "name": "eggs",
      "quantity": 3,
      "unit": "pcs",
      "sort_order": 3
    },
    {
      "name": "salt",
      "quantity": null,
      "unit": null,
      "sort_order": 4
    }
  ]
}
```

---

## Test Case 2: ❌ Validation Error - Name Too Short

**Description:** Recipe name is only 2 characters (minimum is 3)

**JSON Payload:**

```json
{
  "name": "AB",
  "instructions": "Test instructions that are long enough to pass validation",
  "ingredients": [
    {
      "name": "test ingredient",
      "quantity": 100,
      "unit": "g",
      "sort_order": 0
    }
  ]
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Name must be at least 3 characters"]
  }
}
```

---

## Test Case 3: ❌ Validation Error - Instructions Too Short

**Description:** Instructions are only 5 characters (minimum is 10)

**JSON Payload:**

```json
{
  "name": "Test Recipe",
  "instructions": "Short",
  "ingredients": [
    {
      "name": "test ingredient",
      "quantity": 100,
      "unit": "g",
      "sort_order": 0
    }
  ]
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation failed",
  "details": {
    "instructions": ["Instructions must be at least 10 characters"]
  }
}
```

---

## Test Case 4: ❌ Validation Error - No Ingredients

**Description:** Empty ingredients array

**JSON Payload:**

```json
{
  "name": "Test Recipe",
  "instructions": "Test instructions that are long enough",
  "ingredients": []
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation failed",
  "details": {
    "ingredients": ["At least 1 ingredient required"]
  }
}
```

---

## Test Case 5: ❌ Validation Error - Too Many Ingredients

**Description:** 51 ingredients (maximum is 50)

**Note:** Generate payload with 51 ingredients programmatically or manually.

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation failed",
  "details": {
    "ingredients": ["Maximum 50 ingredients allowed"]
  }
}
```

---

## Test Case 6: ✅ Maximum Valid Ingredients (50)

**Description:** Recipe with exactly 50 ingredients (boundary test)

**Note:** This payload is large. Generate it programmatically if needed.

**Expected Response:**

- Status: `201 Created`
- Body: Complete recipe with 50 ingredients

---

## Test Case 7: ❌ Authentication Error

**Description:** No authentication cookie provided

**cURL Command:**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Recipe",
    "instructions": "Test instructions",
    "ingredients": [
      {
        "name": "test",
        "quantity": 100,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:**

- Status: `401 Unauthorized`
- Body:

```json
{
  "error": "Authentication required"
}
```

---

## Test Case 8: ✅ Recipe with Null Quantities and Units

**Description:** Some ingredients without quantity/unit (like spices)

**JSON Payload:**

```json
{
  "name": "Simple Pasta",
  "instructions": "Cook pasta. Add salt and pepper to taste. Serve with olive oil.",
  "ingredients": [
    {
      "name": "pasta",
      "quantity": 250,
      "unit": "g",
      "sort_order": 0
    },
    {
      "name": "salt",
      "quantity": null,
      "unit": null,
      "sort_order": 1
    },
    {
      "name": "pepper",
      "quantity": null,
      "unit": null,
      "sort_order": 2
    },
    {
      "name": "olive oil",
      "quantity": 2,
      "unit": "tbsp",
      "sort_order": 3
    }
  ]
}
```

**Expected Response:**

- Status: `201 Created`
- Body: Complete recipe with null values preserved

---

## Test Case 9: ❌ Validation Error - Invalid Quantity

**Description:** Negative quantity (must be positive)

**JSON Payload:**

```json
{
  "name": "Invalid Recipe",
  "instructions": "This recipe has invalid quantity",
  "ingredients": [
    {
      "name": "sugar",
      "quantity": -100,
      "unit": "g",
      "sort_order": 0
    }
  ]
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation failed",
  "details": {
    "ingredients.0.quantity": ["Quantity must be a positive number"]
  }
}
```

---

## Test Case 10: ❌ Validation Error - Unit Too Long

**Description:** Unit exceeds 50 characters

**JSON Payload:**

```json
{
  "name": "Test Recipe",
  "instructions": "Test instructions for validation",
  "ingredients": [
    {
      "name": "test ingredient",
      "quantity": 100,
      "unit": "this is a very very very very very long unit name that exceeds fifty characters",
      "sort_order": 0
    }
  ]
}
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation failed",
  "details": {
    "ingredients.0.unit": ["Unit must not exceed 50 characters"]
  }
}
```

---

## Verification Steps

After successful creation (201 response):

1. **Check response structure:**
   - `id` (UUID)
   - `user_id` (UUID)
   - `name` (string)
   - `instructions` (string)
   - `created_at` (ISO timestamp)
   - `updated_at` (ISO timestamp)
   - `ingredients` (array of objects)
   - `meal_plan_assignments` (should be 0)

2. **Verify ingredients:**
   - Each ingredient has `id`, `recipe_id`, `name`, `quantity`, `unit`, `sort_order`
   - Ingredients are sorted by `sort_order`
   - `recipe_id` matches parent recipe's `id`

3. **Verify database state (Supabase Dashboard):**

   ```sql
   -- Check recipe was created
   SELECT * FROM recipes WHERE id = '<recipe_id_from_response>';

   -- Check ingredients were created
   SELECT * FROM ingredients WHERE recipe_id = '<recipe_id_from_response>' ORDER BY sort_order;

   -- Verify RLS (as different user, should return empty)
   SELECT * FROM recipes WHERE id = '<recipe_id_from_response>';
   ```

---

## Quick Test Script (Bash)

Save this as `test-recipe-endpoint.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/recipes"
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

# Test 1: Successful creation
echo "Test 1: Successful recipe creation..."
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=$AUTH_TOKEN" \
  -d @test-payloads/success.json \
  | jq

# Test 2: Name too short
echo -e "\n\nTest 2: Validation error - name too short..."
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=$AUTH_TOKEN" \
  -d @test-payloads/name-too-short.json \
  | jq

# Test 3: No authentication
echo -e "\n\nTest 3: Authentication error..."
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d @test-payloads/success.json \
  | jq
```

---

## Notes

- Replace `YOUR_TOKEN_HERE` with actual auth token
- Replace `sb-xxx-auth-token` with your actual Supabase cookie name
- Use `jq` for pretty-printing JSON responses (install: `npm install -g jq`)
- For Windows, use Git Bash or WSL for running cURL commands
- Alternatively, use Postman, Thunder Client, or REST Client VS Code extension

---

**Date:** 2025-10-30
**Status:** Ready for Testing
