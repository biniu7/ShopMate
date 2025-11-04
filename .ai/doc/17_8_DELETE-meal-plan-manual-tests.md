# Manual Testing Guide: DELETE /api/meal-plan/:id

**Endpoint:** `DELETE /api/meal-plan/:id`
**Created:** 2025-11-04
**Status:** Ready for testing

## Prerequisites

1. Development server running on `http://localhost:3001`
2. Valid user account with authentication token
3. At least one meal plan assignment in database (for positive test)

## Setup: Getting Authentication Token

```bash
# Login to get JWT token (adjust based on your auth endpoint)
# Save the token for use in tests below
export AUTH_TOKEN="your-jwt-token-here"
```

## Test Cases

### ✅ Test 1: Success - Delete Own Assignment (200 OK)

**Scenario:** User successfully deletes their own meal plan assignment

**Steps:**
1. First, create a test assignment:
```bash
curl -X POST http://localhost:3001/api/meal-plan \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_id": "VALID_RECIPE_UUID",
    "week_start_date": "2025-11-04",
    "day_of_week": 1,
    "meal_type": "lunch"
  }'
```

2. Note the `id` from response, then delete it:
```bash
curl -X DELETE http://localhost:3001/api/meal-plan/ASSIGNMENT_UUID \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

**Expected Response:**
- **Status Code:** `200 OK`
- **Body:**
```json
{
  "message": "Assignment removed successfully"
}
```

**Verification:**
- Assignment is removed from database
- GET /api/meal-plan for that week no longer shows the assignment

---

### ❌ Test 2: Error - Missing Authorization (401 Unauthorized)

**Scenario:** Request without authentication token

```bash
curl -X DELETE http://localhost:3001/api/meal-plan/550e8400-e29b-41d4-a716-446655440000 \
  -v
```

**Expected Response:**
- **Status Code:** `401 Unauthorized`
- **Body:**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to perform this action"
}
```

**Verification:**
- No data is deleted from database
- Proper security logging (check console for warning)

---

### ❌ Test 3: Error - Invalid UUID Format (400 Bad Request)

**Scenario:** Malformed UUID in URL parameter

```bash
curl -X DELETE http://localhost:3001/api/meal-plan/invalid-uuid-format \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

**Expected Response:**
- **Status Code:** `400 Bad Request`
- **Body:**
```json
{
  "error": "Invalid assignment ID format",
  "message": "Assignment ID must be a valid UUID"
}
```

**Verification:**
- No database queries executed
- Validation happens before auth check

---

### ❌ Test 4: Error - Assignment Not Found (404 Not Found)

**Scenario:** Valid UUID but assignment doesn't exist

```bash
# Using a valid UUID format that doesn't exist in database
curl -X DELETE http://localhost:3001/api/meal-plan/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

**Expected Response:**
- **Status Code:** `404 Not Found`
- **Body:**
```json
{
  "error": "Assignment not found",
  "message": "Assignment not found or you don't have permission to delete it"
}
```

**Verification:**
- Service layer `deleteMealPlanAssignment` throws `NotFoundError`
- Count = 0 from Supabase DELETE query

---

### 🔒 Test 5: Security - Cannot Delete Another User's Assignment (404 Not Found)

**Scenario:** User A tries to delete User B's assignment

**Steps:**
1. User A creates an assignment (save the ID)
2. User B attempts to delete it using User A's assignment ID

```bash
# User B's request (with User B's token)
curl -X DELETE http://localhost:3001/api/meal-plan/USER_A_ASSIGNMENT_UUID \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -v
```

**Expected Response:**
- **Status Code:** `404 Not Found` (NOT 403 Forbidden - security best practice)
- **Body:**
```json
{
  "error": "Assignment not found",
  "message": "Assignment not found or you don't have permission to delete it"
}
```

**Verification:**
- User A's assignment remains in database (unchanged)
- RLS policy + explicit user_id check prevents unauthorized access
- Response doesn't reveal whether assignment exists (information disclosure prevention)

---

## Edge Cases to Test

### Test 6: Empty ID Parameter

```bash
curl -X DELETE http://localhost:3001/api/meal-plan/ \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

**Expected:** 404 (Astro routing) or 400 (missing ID)

---

### Test 7: Database Connection Error (Simulated)

**Scenario:** Database temporarily unavailable

**Expected Response:**
- **Status Code:** `500 Internal Server Error`
- **Body:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while deleting the assignment"
}
```

**Note:** This test requires mocking or temporarily breaking database connection

---

## Checklist

After running all tests, verify:

- [ ] Test 1 (Success) returns 200 and deletes assignment
- [ ] Test 2 (No auth) returns 401 and doesn't delete
- [ ] Test 3 (Invalid UUID) returns 400 and doesn't query DB
- [ ] Test 4 (Not found) returns 404 with appropriate message
- [ ] Test 5 (Security) returns 404 (not 403) and doesn't delete
- [ ] All responses have `Content-Type: application/json`
- [ ] Error messages are user-friendly (no stack traces)
- [ ] Console logs show appropriate warnings for security attempts
- [ ] TypeScript types are enforced (no compilation errors)

---

## Performance Verification

Check response times:
```bash
# Run Test 1 multiple times and check timing
time curl -X DELETE http://localhost:3001/api/meal-plan/ASSIGNMENT_UUID \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected:** < 200ms average response time

---

## Cleanup

After testing, clean up test data:
```bash
# Get list of assignments
curl http://localhost:3001/api/meal-plan?week_start_date=2025-11-04 \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Delete any test assignments created during testing
# (use the endpoint we just implemented!)
```

---

**Testing completed:** [Date]
**All tests passed:** [ ] Yes / [ ] No
**Issues found:** [List any issues]
