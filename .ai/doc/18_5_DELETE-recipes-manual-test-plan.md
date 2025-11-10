# Manual Test Plan: DELETE /api/recipes/:id

## Test Environment Setup

**Prerequisites:**

- Server running: `npm run dev` on `http://localhost:3000`
- Valid Supabase authentication token
- Test user logged in
- At least one test recipe in the database

## Test Scenarios

### ✅ Test 1: Successful Deletion (200 OK)

**Setup:**

1. Create a test recipe with ingredients
2. Optionally assign it to meal plan
3. Note the recipe UUID

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/recipes/{recipe_id} \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "message": "Recipe deleted successfully",
  "deleted_meal_plan_assignments": 2
}
```

**Verification:**

- Status code: `200`
- Response contains correct message
- `deleted_meal_plan_assignments` matches the actual count
- Recipe no longer exists in database
- All ingredients deleted (CASCADE)
- All meal_plan assignments deleted (CASCADE)

---

### ❌ Test 2: Invalid UUID Format (400 Bad Request)

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/recipes/abc123 \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "error": "Validation error",
  "message": "Invalid recipe ID format"
}
```

**Verification:**

- Status code: `400`
- Error message indicates validation failure
- UUID validation is working

---

### ❌ Test 3: Missing Authentication (401 Unauthorized)

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/recipes/{valid_recipe_id} \
  -H "Content-Type: application/json"
# No authentication cookie
```

**Expected Response:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Verification:**

- Status code: `401`
- Authentication check is enforced
- Request is rejected before database query

---

### ❌ Test 4: Recipe Not Found (404 Not Found)

**Setup:**

- Use a valid UUID that doesn't exist in database

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/recipes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "error": "Not found",
  "message": "Recipe not found or access denied"
}
```

**Verification:**

- Status code: `404`
- Generic error message (doesn't reveal if recipe exists)

---

### ❌ Test 5: Recipe Belongs to Another User (404 Not Found)

**Setup:**

1. Login as User A
2. Create a recipe (note the ID)
3. Logout and login as User B
4. Try to delete User A's recipe

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/recipes/{user_a_recipe_id} \
  -H "Cookie: sb-access-token=USER_B_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "error": "Not found",
  "message": "Recipe not found or access denied"
}
```

**Verification:**

- Status code: `404`
- Authorization is enforced via RLS and service logic
- No information leak about recipe existence
- User A's recipe is NOT deleted

---

### ✅ Test 6: CASCADE Deletion Verification

**Setup:**

1. Create a recipe with 5 ingredients
2. Assign it to 3 meal plan slots
3. Note all IDs

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/recipes/{recipe_id} \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Database Verification:**

```sql
-- Check recipe is deleted
SELECT * FROM recipes WHERE id = '{recipe_id}';
-- Should return 0 rows

-- Check ingredients are deleted
SELECT * FROM ingredients WHERE recipe_id = '{recipe_id}';
-- Should return 0 rows

-- Check meal_plan assignments are deleted
SELECT * FROM meal_plan WHERE recipe_id = '{recipe_id}';
-- Should return 0 rows
```

**Expected:**

- All related records deleted atomically
- No orphaned ingredients
- No orphaned meal_plan assignments
- Response shows correct count of deleted assignments

---

## Edge Cases

### Test 7: Recipe with Zero Meal Plan Assignments

**Setup:**

- Create recipe without any meal plan assignments

**Expected Response:**

```json
{
  "message": "Recipe deleted successfully",
  "deleted_meal_plan_assignments": 0
}
```

### Test 8: Recipe with Many Ingredients (50)

**Setup:**

- Create recipe with maximum allowed ingredients (50)

**Expected:**

- All 50 ingredients deleted via CASCADE
- Performance acceptable (<2 seconds)

---

## Testing Tools

### Using Browser DevTools

1. Open browser to `http://localhost:3000`
2. Login to get authentication cookie
3. Open DevTools Console
4. Run:

```javascript
fetch("/api/recipes/{recipe_id}", {
  method: "DELETE",
  credentials: "include",
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

### Using Postman/Insomnia

1. Import collection or create new request
2. Set method to `DELETE`
3. URL: `http://localhost:3000/api/recipes/{recipe_id}`
4. Add cookie from browser (Supabase auth)
5. Send request

---

## Test Results Checklist

- [ ] Test 1: Successful deletion (200) ✅
- [ ] Test 2: Invalid UUID (400) ✅
- [ ] Test 3: Missing auth (401) ✅
- [ ] Test 4: Recipe not found (404) ✅
- [ ] Test 5: Wrong user (404) ✅
- [ ] Test 6: CASCADE deletion ✅
- [ ] Test 7: Zero assignments ✅
- [ ] Test 8: Many ingredients ✅

---

## Notes

- All tests should be performed in a development environment
- Use test data, not production data
- Verify database state before and after tests
- Check server logs for any errors
- Confirm no data leaks in error messages
