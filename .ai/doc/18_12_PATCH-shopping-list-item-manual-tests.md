# Manual Testing Plan: PATCH /api/shopping-lists/:list_id/items/:item_id

**Endpoint:** `PATCH /api/shopping-lists/:list_id/items/:item_id`
**Purpose:** Update `is_checked` status for shopping list item
**Date:** 2025-11-05

## Prerequisites

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Start Supabase local instance:**
   ```bash
   npx supabase start
   ```

3. **Create test data:**
   - Register a test user in the app (or use Supabase Studio)
   - Create a shopping list with items
   - Note down: `list_id`, `item_id`, and auth token

4. **Get authentication token:**
   - Login through the app
   - Extract `sb-access-token` from browser cookies (DevTools → Application → Cookies)
   - Or get token from Supabase Studio (Authentication → Users → Generate JWT)

## Test Scenarios

### Test Setup
Replace these placeholders with actual values:
- `{LIST_ID}` - UUID of your test shopping list
- `{ITEM_ID}` - UUID of an item in that list
- `{AUTH_TOKEN}` - Your authentication token
- `{OTHER_USER_LIST_ID}` - List ID from another user (for IDOR test)

---

### ✅ Test 1: Happy Path - Valid Request

**Description:** Update item checked status with valid data

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 200 OK
- **Body:** Full shopping list item with `is_checked: true`
```json
{
  "id": "950e8400-e29b-41d4-a716-446655440000",
  "shopping_list_id": "850e8400-e29b-41d4-a716-446655440000",
  "ingredient_name": "spaghetti",
  "quantity": 1500,
  "unit": "g",
  "category": "Pieczywo",
  "is_checked": true,
  "sort_order": 0
}
```

**Verification:**
- [ ] Status is 200
- [ ] Response contains updated item
- [ ] `is_checked` field matches request value
- [ ] All other fields unchanged

---

### ❌ Test 2: Invalid UUID - Malformed list_id

**Description:** Send request with invalid UUID format for list_id

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/invalid-uuid/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "error": "Validation Error",
  "details": {
    "list_id": ["Nieprawidłowy format UUID"]
  }
}
```

**Verification:**
- [ ] Status is 400
- [ ] Error message mentions UUID format
- [ ] Request was rejected before database query

---

### ❌ Test 3: Invalid UUID - Malformed item_id

**Description:** Send request with invalid UUID format for item_id

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/not-a-uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "error": "Validation Error",
  "details": {
    "item_id": ["Nieprawidłowy format UUID"]
  }
}
```

**Verification:**
- [ ] Status is 400
- [ ] Error specifically for item_id
- [ ] list_id validation passed (only item_id failed)

---

### ❌ Test 4: Missing Required Field

**Description:** Send request without `is_checked` field

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{}'
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "error": "Validation Error",
  "details": {
    "is_checked": ["Pole is_checked jest wymagane"]
  }
}
```

**Verification:**
- [ ] Status is 400
- [ ] Error mentions required field
- [ ] Polish error message displayed

---

### ❌ Test 5: Wrong Data Type

**Description:** Send `is_checked` as string instead of boolean

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": "yes"}'
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "error": "Validation Error",
  "details": {
    "is_checked": ["Pole is_checked musi być typu boolean"]
  }
}
```

**Verification:**
- [ ] Status is 400
- [ ] Error mentions type mismatch
- [ ] Zod validation working correctly

---

### ❌ Test 6: Extra Fields (Mass Assignment Protection)

**Description:** Send additional fields beyond `is_checked`

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{
    "is_checked": true,
    "quantity": 9999,
    "category": "Hacked"
  }'
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "error": "Validation Error",
  "details": {
    "_errors": ["Unrecognized key(s) in object: 'quantity', 'category'"]
  }
}
```

**Verification:**
- [ ] Status is 400
- [ ] Schema.strict() prevents extra fields
- [ ] Mass assignment attack prevented

---

### ❌ Test 7: Invalid JSON Format

**Description:** Send malformed JSON

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d 'not valid json'
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "error": "Bad Request",
  "message": "Nieprawidłowy format JSON"
}
```

**Verification:**
- [ ] Status is 400
- [ ] Error caught before validation
- [ ] Helpful error message

---

### ❌ Test 8: Unauthorized - No Auth Token

**Description:** Send request without authentication

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 401 Unauthorized
- **Body:**
```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany aby wykonać tę operację"
}
```

**Verification:**
- [ ] Status is 401
- [ ] Auth check happens before business logic
- [ ] Polish error message

---

### ❌ Test 9: Not Found - Non-existent List

**Description:** Use valid UUID that doesn't exist in database

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/00000000-0000-0000-0000-000000000000/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 404 Not Found
- **Body:**
```json
{
  "error": "Not Found",
  "message": "Element listy nie został znaleziony"
}
```

**Verification:**
- [ ] Status is 404
- [ ] Service layer throws NOT_FOUND
- [ ] Doesn't reveal if list exists (security)

---

### ❌ Test 10: Not Found - Non-existent Item

**Description:** Valid list_id but non-existent item_id

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 404 Not Found
- **Body:**
```json
{
  "error": "Not Found",
  "message": "Element listy nie został znaleziony"
}
```

**Verification:**
- [ ] Status is 404
- [ ] Same error as test 9 (doesn't leak info)
- [ ] Item doesn't exist in database

---

### 🔐 Test 11: IDOR Attack - Other User's Item

**Description:** Attempt to update item from another user's list (critical security test)

**Prerequisites:**
- Create second test user
- Create shopping list with item for second user
- Get second user's list_id and item_id
- Use **first user's** auth token

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{OTHER_USER_LIST_ID}/items/{OTHER_USER_ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={FIRST_USER_AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 404 Not Found (NOT 403!)
- **Body:**
```json
{
  "error": "Not Found",
  "message": "Element listy nie został znaleziony"
}
```

**Verification:**
- [ ] Status is 404 (security best practice: don't reveal resource existence)
- [ ] RLS policy blocks access at database level
- [ ] Application-level check also prevents access
- [ ] Second user's data NOT modified (verify in database)
- [ ] **CRITICAL:** This is the most important security test!

---

### ✅ Test 12: Toggle False → True

**Description:** Update unchecked item to checked

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response:**
- **Status:** 200 OK
- **Body:** Item with `is_checked: true`

**Verification:**
- [ ] Item updated successfully
- [ ] Value changed from false to true

---

### ✅ Test 13: Toggle True → False

**Description:** Update checked item back to unchecked

**Request:**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": false}'
```

**Expected Response:**
- **Status:** 200 OK
- **Body:** Item with `is_checked: false`

**Verification:**
- [ ] Item updated successfully
- [ ] Value changed from true to false
- [ ] Idempotent operation works both ways

---

### ✅ Test 14: Idempotency Check

**Description:** Send same request twice, verify idempotent behavior

**Request (run twice):**
```bash
curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={AUTH_TOKEN}" \
  -d '{"is_checked": true}'
```

**Expected Response (both times):**
- **Status:** 200 OK
- **Body:** Same item with `is_checked: true`

**Verification:**
- [ ] First request: updates item
- [ ] Second request: returns same result (already true)
- [ ] No errors on duplicate requests
- [ ] PATCH is idempotent

---

## Database Verification Tests

After running the above tests, verify in Supabase Studio:

### Verify RLS Policies

1. **Check policies exist:**
   ```sql
   SELECT schemaname, tablename, policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename IN ('shopping_lists', 'shopping_list_items')
   ORDER BY tablename, policyname;
   ```

   **Expected:** Should see `shopping_lists_all` and `shopping_list_items_all` policies

2. **Test RLS as different user:**
   ```sql
   -- Run in Supabase Studio SQL Editor
   -- Set role to simulate authenticated user
   SET ROLE authenticated;
   SET request.jwt.claim.sub = '{USER_A_ID}';

   -- Try to update user B's item (should return 0 rows)
   UPDATE shopping_list_items
   SET is_checked = true
   WHERE id = '{USER_B_ITEM_ID}';

   -- Verify: should show "UPDATE 0" (no rows affected)
   ```

### Verify Data Integrity

1. **Check item not modified by unauthorized user:**
   ```sql
   SELECT id, ingredient_name, is_checked, shopping_list_id
   FROM shopping_list_items
   WHERE id = '{ITEM_ID}';
   ```

2. **Verify snapshot pattern (list metadata unchanged):**
   ```sql
   SELECT id, name, created_at, updated_at
   FROM shopping_lists
   WHERE id = '{LIST_ID}';
   ```

   **Expected:** `updated_at` should NOT change when item is updated (snapshot pattern)

---

## Test Summary Checklist

### Validation Tests
- [ ] Test 1: Happy path (200 OK)
- [ ] Test 2: Invalid list_id UUID (400)
- [ ] Test 3: Invalid item_id UUID (400)
- [ ] Test 4: Missing is_checked (400)
- [ ] Test 5: Wrong data type (400)
- [ ] Test 6: Extra fields rejected (400)
- [ ] Test 7: Invalid JSON format (400)

### Authentication Tests
- [ ] Test 8: No auth token (401)

### Authorization Tests
- [ ] Test 9: Non-existent list (404)
- [ ] Test 10: Non-existent item (404)
- [ ] Test 11: IDOR attack blocked (404) ⚠️ **CRITICAL**

### Functionality Tests
- [ ] Test 12: Toggle false → true (200)
- [ ] Test 13: Toggle true → false (200)
- [ ] Test 14: Idempotency (200)

### Database Tests
- [ ] RLS policies active
- [ ] IDOR blocked at database level
- [ ] Snapshot pattern preserved

---

## Performance Benchmarks

Run after all tests pass:

```bash
# Test response time (should be < 200ms p95)
for i in {1..100}; do
  curl -X PATCH http://localhost:4321/api/shopping-lists/{LIST_ID}/items/{ITEM_ID} \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-access-token={AUTH_TOKEN}" \
    -d '{"is_checked": true}' \
    -w "%{time_total}\n" \
    -o /dev/null -s
done | awk '{sum+=$1; count++} END {print "Average:", sum/count*1000, "ms"}'
```

**Target:** < 200ms average response time

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized on valid token:**
   - Check token hasn't expired
   - Verify token is from correct Supabase instance (local vs production)
   - Try generating new token

2. **404 on valid IDs:**
   - Verify user_id matches between token and list ownership
   - Check RLS policies are enabled (run migration again if needed)
   - Verify IDs are correct in request

3. **Server not responding:**
   - Ensure `npm run dev` is running
   - Check port 4321 (or configured port)
   - Verify Supabase local instance is up: `npx supabase status`

4. **500 Internal Server Error:**
   - Check server logs: `npm run dev` output
   - Verify database connection
   - Check Supabase Studio for database errors

---

**Test Execution Date:** _________
**Tester:** _________
**Result:** PASS / FAIL
**Notes:** _________
