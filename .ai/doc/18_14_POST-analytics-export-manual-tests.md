# Manual Test Plan: POST /api/analytics/export

**Endpoint:** `POST /api/analytics/export`
**Date:** 2025-11-06
**Status:** Testing in progress

---

## Test Environment Setup

**Server:** http://localhost:3001
**Prerequisites:**

- ✅ User must be authenticated (Supabase session)
- ✅ Shopping list must exist and belong to user
- ✅ Dev server running

---

## Test Cases

### 1️⃣ Authentication Tests

#### Test 1.1: No Authentication (401 Unauthorized)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -d '{
    "shopping_list_id": "550e8400-e29b-41d4-a716-446655440000",
    "format": "pdf"
  }'
```

**Expected Response:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Expected Status:** `401`

**Result:** ⏳ Pending

---

### 2️⃣ Validation Tests

#### Test 2.1: Invalid UUID Format (400 Bad Request)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "shopping_list_id": "not-a-uuid",
    "format": "pdf"
  }'
```

**Expected Response:**

```json
{
  "error": "Validation failed",
  "details": {
    "shopping_list_id": ["Invalid shopping list ID format"]
  }
}
```

**Expected Status:** `400`

**Result:** ⏳ Pending

---

#### Test 2.2: Invalid Format Enum (400 Bad Request)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "shopping_list_id": "550e8400-e29b-41d4-a716-446655440000",
    "format": "docx"
  }'
```

**Expected Response:**

```json
{
  "error": "Validation failed",
  "details": {
    "format": ["Format must be 'pdf' or 'txt'"]
  }
}
```

**Expected Status:** `400`

**Result:** ⏳ Pending

---

#### Test 2.3: Missing Required Fields (400 Bad Request)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "format": "pdf"
  }'
```

**Expected Response:**

```json
{
  "error": "Validation failed",
  "details": {
    "shopping_list_id": ["Required"]
  }
}
```

**Expected Status:** `400`

**Result:** ⏳ Pending

---

#### Test 2.4: Extra Fields (400 Bad Request - Strict Mode)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "shopping_list_id": "550e8400-e29b-41d4-a716-446655440000",
    "format": "pdf",
    "extra_field": "should_fail"
  }'
```

**Expected Response:**

```json
{
  "error": "Validation failed",
  "details": {
    "_errors": ["Unrecognized key(s) in object: 'extra_field'"]
  }
}
```

**Expected Status:** `400`

**Result:** ⏳ Pending

---

### 3️⃣ Authorization Tests

#### Test 3.1: Shopping List Doesn't Exist (404 Not Found)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "shopping_list_id": "00000000-0000-0000-0000-000000000000",
    "format": "pdf"
  }'
```

**Expected Response:**

```json
{
  "error": "Not found",
  "message": "Shopping list not found or access denied"
}
```

**Expected Status:** `404`

**Result:** ⏳ Pending

**Notes:** UUID exists but doesn't belong to authenticated user (or doesn't exist at all). Response doesn't leak whether list exists.

---

#### Test 3.2: Shopping List Belongs to Another User (404 Not Found)

**Scenario:** List exists in DB but belongs to different user

**Expected Response:**

```json
{
  "error": "Not found",
  "message": "Shopping list not found or access denied"
}
```

**Expected Status:** `404`

**Result:** ⏳ Pending

**Security Note:** Same response as 3.1 - prevents information leakage about list existence.

---

### 4️⃣ Success Tests

#### Test 4.1: Valid Request - PDF Format (204 No Content)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "shopping_list_id": "VALID_USER_LIST_UUID",
    "format": "pdf"
  }' \
  -i
```

**Expected Response:**

- **Status:** `204 No Content`
- **Body:** Empty (no response body)
- **Console Log:** `[Analytics] Export event:` with event details

**Result:** ⏳ Pending

---

#### Test 4.2: Valid Request - TXT Format (204 No Content)

**Request:**

```bash
curl -X POST http://localhost:3001/api/analytics/export \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "shopping_list_id": "VALID_USER_LIST_UUID",
    "format": "txt"
  }' \
  -i
```

**Expected Response:**

- **Status:** `204 No Content`
- **Body:** Empty
- **Console Log:** `[Analytics] Export event:` with format="txt"

**Result:** ⏳ Pending

---

## Test Execution Notes

### Prerequisites Checklist:

- [ ] Dev server running (`npm run dev`)
- [ ] User authenticated in Supabase
- [ ] Valid shopping list created for test user
- [ ] Access token extracted from browser cookies

### How to Get Access Token:

1. Open application in browser: http://localhost:3001
2. Login with test user
3. Open DevTools → Application → Cookies
4. Copy `sb-access-token` value
5. Use in curl `-H "Cookie: sb-access-token=VALUE"`

### Expected Console Output (Success Case):

```
[Analytics] Export event: {
  user: 'user-uuid-here',
  list: 'list-uuid-here',
  format: 'pdf',
  time: '2025-11-06T18:30:00.000Z'
}
```

---

## Test Results Summary

| Test Case            | Status | Notes |
| -------------------- | ------ | ----- |
| 1.1 - No Auth        | ⏳     | -     |
| 2.1 - Invalid UUID   | ⏳     | -     |
| 2.2 - Invalid Format | ⏳     | -     |
| 2.3 - Missing Fields | ⏳     | -     |
| 2.4 - Extra Fields   | ⏳     | -     |
| 3.1 - List Not Found | ⏳     | -     |
| 3.2 - Wrong Owner    | ⏳     | -     |
| 4.1 - Success PDF    | ⏳     | -     |
| 4.2 - Success TXT    | ⏳     | -     |

**Overall Status:** ⏳ Testing in progress

---

## Performance Metrics

- **Expected Latency:** <200ms
- **Actual Latency:** TBD
- **Database Query Time:** TBD (should be <50ms for ownership check)

---

## Issues Found

_None yet - testing in progress_

---

## Next Steps

1. ⏳ Execute all test cases
2. ⏳ Document actual results
3. ⏳ Fix any issues found
4. ⏳ Verify console logging works correctly
5. ⏳ Check ESLint compliance
6. ⏳ Code review
