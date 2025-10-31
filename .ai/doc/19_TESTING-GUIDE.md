# Quick Testing Guide - POST /api/recipes

## 🚀 Quick Start (5 minutes)

### Step 1: Start Dev Server

```bash
npm run dev
```

Wait for: `Server running at http://localhost:3000`

### Step 2: Get Authentication Token

1. Open `http://localhost:3000` in browser
2. Login to your account (or register if needed)
3. Open DevTools (F12) → Application → Cookies
4. Find cookie starting with `sb-` (e.g., `sb-xxxxx-auth-token`)
5. Copy its value

### Step 3: Test the Endpoint

**Option A: Using cURL (Git Bash/Terminal)**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-YOUR-PROJECT-auth-token=YOUR_TOKEN_VALUE" \
  -d '{
    "name": "Quick Test Recipe",
    "instructions": "This is a test recipe to verify the endpoint works correctly.",
    "ingredients": [
      {
        "name": "test ingredient",
        "quantity": 100,
        "unit": "g",
        "sort_order": 0
      }
    ]
  }'
```

**Option B: Using VS Code REST Client Extension**

Create file `test.http`:

```http
### Create Recipe - Success Case
POST http://localhost:3000/api/recipes
Content-Type: application/json
Cookie: sb-YOUR-PROJECT-auth-token=YOUR_TOKEN_VALUE

{
  "name": "Quick Test Recipe",
  "instructions": "This is a test recipe to verify the endpoint works correctly.",
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

Click "Send Request" above the POST line.

### Step 4: Verify Response

**Expected: 201 Created**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Quick Test Recipe",
  "instructions": "This is a test recipe to verify the endpoint works correctly.",
  "created_at": "2025-10-30T10:00:00Z",
  "updated_at": "2025-10-30T10:00:00Z",
  "ingredients": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "recipe_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "test ingredient",
      "quantity": 100,
      "unit": "g",
      "sort_order": 0
    }
  ],
  "meal_plan_assignments": 0
}
```

---

## ✅ What to Check

### Response Validation

- [ ] Status code is `201 Created`
- [ ] Response has `id` field (UUID format)
- [ ] Response has `user_id` field
- [ ] `name` matches input
- [ ] `instructions` matches input
- [ ] `ingredients` array exists and has correct data
- [ ] Each ingredient has `id`, `recipe_id`, `name`, `quantity`, `unit`, `sort_order`
- [ ] `meal_plan_assignments` is `0`
- [ ] `created_at` and `updated_at` are ISO timestamps

### Database Verification (Optional)

Go to Supabase Dashboard → Table Editor:

1. **Check recipes table:**
   - New row exists with matching `id`
   - `name` and `instructions` are correct
   - `user_id` matches your authenticated user

2. **Check ingredients table:**
   - Ingredients exist with `recipe_id` matching the recipe
   - All fields are correct
   - Sorted by `sort_order`

---

## 🧪 Additional Tests

### Test 1: Validation Error

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-YOUR-PROJECT-auth-token=YOUR_TOKEN_VALUE" \
  -d '{"name": "AB", "instructions": "short", "ingredients": []}'
```

**Expected: 400 Bad Request** with validation details

### Test 2: No Authentication

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "instructions": "test instructions", "ingredients": [{"name": "test", "quantity": 1, "unit": "g", "sort_order": 0}]}'
```

**Expected: 401 Unauthorized**

```json
{
  "error": "Authentication required"
}
```

### Test 3: Full Recipe (like from plan)

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-YOUR-PROJECT-auth-token=YOUR_TOKEN_VALUE" \
  -d '{
    "name": "Spaghetti Carbonara",
    "instructions": "1. Boil pasta in salted water until al dente.\n2. Fry bacon until crispy.\n3. Mix eggs with parmesan.\n4. Combine all ingredients while pasta is hot.",
    "ingredients": [
      {"name": "spaghetti", "quantity": 500, "unit": "g", "sort_order": 0},
      {"name": "bacon", "quantity": 200, "unit": "g", "sort_order": 1},
      {"name": "parmesan cheese", "quantity": 100, "unit": "g", "sort_order": 2},
      {"name": "eggs", "quantity": 3, "unit": "pcs", "sort_order": 3},
      {"name": "salt", "quantity": null, "unit": null, "sort_order": 4}
    ]
  }'
```

**Expected: 201 Created** with all 5 ingredients

---

## 🐛 Troubleshooting

### Error: "Authentication required" (401)

- **Cause:** No valid auth token or expired session
- **Fix:**
  1. Make sure you're logged in
  2. Refresh the page and get a new token
  3. Check cookie name matches your Supabase project

### Error: "Validation failed" (400)

- **Cause:** Input doesn't meet validation rules
- **Fix:** Check the `details` field in response for specific errors:
  - `name`: 3-100 characters
  - `instructions`: 10-5000 characters
  - `ingredients`: 1-50 items
  - `quantity`: positive number or null
  - `unit`: max 50 characters or null

### Error: "Internal server error" (500)

- **Cause:** Database connection issue or unexpected error
- **Fix:**
  1. Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`
  2. Verify Supabase project is running
  3. Check server logs in terminal for details
  4. Verify RLS policies are correctly set up

### Server won't start

- **Cause:** Missing environment variables or dependencies
- **Fix:**
  ```bash
  # Install dependencies
  npm install

  # Check .env file exists
  ls -la .env

  # If missing, copy from example
  cp .env.example .env
  # Then edit .env with your Supabase credentials
  ```

---

## 📚 Full Test Suite

For comprehensive testing, see: `.ai/doc/18_POST-recipes-test-data.md`

Contains 10 detailed test cases covering:
- ✅ Success scenarios
- ❌ Validation errors
- ❌ Authentication errors
- 🔍 Edge cases (max ingredients, null values, etc.)

---

**Quick Reference:**

| Test | Method | Expected Status | Description |
|------|--------|----------------|-------------|
| Success | POST | 201 | Valid recipe created |
| Invalid name | POST | 400 | Name < 3 or > 100 chars |
| Invalid instructions | POST | 400 | Instructions < 10 or > 5000 chars |
| No ingredients | POST | 400 | Empty ingredients array |
| Too many ingredients | POST | 400 | More than 50 ingredients |
| No auth | POST | 401 | Missing auth cookie |
| Server error | POST | 500 | Database/unexpected error |

---

**Date:** 2025-10-30
**Status:** Ready for Testing
