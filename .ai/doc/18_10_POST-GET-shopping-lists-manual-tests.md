# Manual Testing Guide: POST & GET /api/shopping-lists

**Data:** 2025-11-04
**Endpointy:** POST /api/shopping-lists, GET /api/shopping-lists
**Base URL:** http://localhost:3001 (lub http://localhost:3000)

---

## 🔑 Prerequisites: Uzyskanie Access Token

### Krok 1: Zaloguj się lub zarejestruj użytkownika

Otwórz aplikację w przeglądarce i zaloguj się. Następnie otwórz DevTools Console (F12) i wykonaj:

```javascript
// Pobierz access token z Supabase
const { data } = await window.supabase.auth.getSession();
const accessToken = data.session?.access_token;
console.log("Access Token:", accessToken);
```

Lub jeśli to nie działa, możesz użyć tego kodu:

```javascript
// Alternatywny sposób
localStorage.getItem("sb-" + "YOUR_PROJECT_REF" + "-auth-token");
```

### Krok 2: Zapisz token do zmiennej środowiskowej

**Windows (PowerShell):**

```powershell
$env:ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"
```

**Linux/Mac:**

```bash
export ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"
```

**Sprawdź czy token działa:**

```bash
# Windows PowerShell
curl -X GET http://localhost:3001/api/shopping-lists `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"

# Linux/Mac
curl -X GET http://localhost:3001/api/shopping-lists \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 📋 Test Cases: POST /api/shopping-lists

### ✅ TC1: Successful Creation - Full Data

**Description:** Utworzenie listy zakupów ze wszystkimi polami

**Request:**

```bash
# Windows PowerShell
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "name": "Lista zakupów - Tydzień 20-26 stycznia",
    "week_start_date": "2025-01-20",
    "items": [
      {
        "ingredient_name": "mleko",
        "quantity": 1,
        "unit": "l",
        "category": "Nabiał",
        "sort_order": 0
      },
      {
        "ingredient_name": "chleb",
        "quantity": 2,
        "unit": "szt",
        "category": "Pieczywo",
        "sort_order": 1
      },
      {
        "ingredient_name": "pomidory",
        "quantity": 500,
        "unit": "g",
        "category": "Warzywa",
        "sort_order": 2
      }
    ]
  }'

# Linux/Mac (użyj \ zamiast `)
curl -X POST http://localhost:3001/api/shopping-lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Lista zakupów - Tydzień 20-26 stycznia",
    "week_start_date": "2025-01-20",
    "items": [
      {
        "ingredient_name": "mleko",
        "quantity": 1,
        "unit": "l",
        "category": "Nabiał",
        "sort_order": 0
      },
      {
        "ingredient_name": "chleb",
        "quantity": 2,
        "unit": "szt",
        "category": "Pieczywo",
        "sort_order": 1
      },
      {
        "ingredient_name": "pomidory",
        "quantity": 500,
        "unit": "g",
        "category": "Warzywa",
        "sort_order": 2
      }
    ]
  }'
```

**Expected Response:** `201 Created`

```json
{
  "id": "uuid-here",
  "user_id": "uuid-here",
  "name": "Lista zakupów - Tydzień 20-26 stycznia",
  "week_start_date": "2025-01-20",
  "created_at": "2025-01-26T14:00:00Z",
  "updated_at": "2025-01-26T14:00:00Z",
  "items": [
    {
      "id": "uuid-here",
      "shopping_list_id": "uuid-here",
      "ingredient_name": "mleko",
      "quantity": 1,
      "unit": "l",
      "category": "Nabiał",
      "is_checked": false,
      "sort_order": 0
    }
    // ... other items
  ]
}
```

---

### ✅ TC2: Successful Creation - Minimal Data

**Description:** Lista z minimalnymi danymi (bez name i week_start_date)

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "items": [
      {
        "ingredient_name": "jajka",
        "category": "Nabiał",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:** `201 Created`

- `name` powinno być "Lista zakupów" (default)
- `week_start_date` powinno być `null`
- `quantity` i `unit` powinny być `null`

---

### ✅ TC3: Successful Creation - From Recipes Mode

**Description:** Lista wygenerowana z przepisów (week_start_date = null)

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "name": "Lista z przepisów - Spaghetti + Sałatka",
    "week_start_date": null,
    "items": [
      {
        "ingredient_name": "spaghetti",
        "quantity": 500,
        "unit": "g",
        "category": "Pieczywo",
        "sort_order": 0
      },
      {
        "ingredient_name": "pomidory",
        "quantity": 400,
        "unit": "g",
        "category": "Warzywa",
        "sort_order": 1
      }
    ]
  }'
```

**Expected Response:** `201 Created` with `week_start_date: null`

---

### ❌ TC4: Validation Error - Empty Items Array

**Description:** Lista bez itemów (minimum 1 required)

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "name": "Empty list",
    "items": []
  }'
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "items": ["At least 1 item is required"]
  }
}
```

---

### ❌ TC5: Validation Error - Invalid Category

**Description:** Item z nieprawidłową kategorią

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "items": [
      {
        "ingredient_name": "mleko",
        "category": "InvalidCategory",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "items.0.category": ["Invalid ingredient category"]
  }
}
```

**Valid categories:** Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne

---

### ❌ TC6: Validation Error - Name Too Long

**Description:** Nazwa przekracza 200 znaków

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "name": "' + 'A'.repeat(201) + '",
    "items": [
      {
        "ingredient_name": "mleko",
        "category": "Nabiał",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Name must not exceed 200 characters"]
  }
}
```

---

### ❌ TC7: Validation Error - Invalid Date Format

**Description:** Nieprawidłowy format daty

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "week_start_date": "20-01-2025",
    "items": [
      {
        "ingredient_name": "mleko",
        "category": "Nabiał",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date format. Use YYYY-MM-DD"]
  }
}
```

---

### ❌ TC8: Validation Error - Too Many Items

**Description:** Więcej niż 100 itemów (maximum limit)

**Request:**

```bash
# Wygeneruj payload z 101 itemami
# Przykład w PowerShell:
$items = @()
for ($i = 0; $i -lt 101; $i++) {
  $items += @{
    ingredient_name = "item$i"
    category = "Inne"
    sort_order = $i
  }
}
$payload = @{
  items = $items
} | ConvertTo-Json -Depth 10

curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d $payload
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "items": ["Maximum 100 items allowed"]
  }
}
```

---

### ❌ TC9: Validation Error - Negative Quantity

**Description:** Quantity <= 0 (must be positive or null)

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{
    "items": [
      {
        "ingredient_name": "mleko",
        "quantity": -5,
        "unit": "l",
        "category": "Nabiał",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "items.0.quantity": ["Quantity must be positive"]
  }
}
```

---

### ❌ TC10: Authentication Error - No Token

**Description:** Request bez Authorization header

**Request:**

```bash
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -d '{
    "items": [
      {
        "ingredient_name": "mleko",
        "category": "Nabiał",
        "sort_order": 0
      }
    ]
  }'
```

**Expected Response:** `401 Unauthorized`

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to create a shopping list"
}
```

---

### ⚡ TC11: Performance Test - Large Payload (100 items)

**Description:** Test z maksymalną liczbą itemów (100)

**PowerShell script do generowania:**

```powershell
$items = @()
for ($i = 0; $i -lt 100; $i++) {
  $category = @("Nabiał", "Warzywa", "Owoce", "Mięso", "Pieczywo", "Przyprawy", "Inne")[$i % 7]
  $items += @{
    ingredient_name = "Składnik $i"
    quantity = $i + 1
    unit = "kg"
    category = $category
    sort_order = $i
  }
}
$payload = @{
  name = "Test 100 items"
  items = $items
} | ConvertTo-Json -Depth 10

# Measure time
Measure-Command {
  curl -X POST http://localhost:3001/api/shopping-lists `
    -H "Content-Type: application/json" `
    -H "Authorization: Bearer $env:ACCESS_TOKEN" `
    -d $payload
}
```

**Expected Response:** `201 Created`
**Performance Target:** < 500ms

**Verification:**

- Check response time
- Verify all 100 items are returned
- Check payload size < 50KB

---

## 📋 Test Cases: GET /api/shopping-lists

### ✅ TC12: Successful Fetch - Default Pagination

**Description:** Pobierz listy z domyślną paginacją (page=1, limit=20)

**Request:**

```bash
curl -X GET http://localhost:3001/api/shopping-lists `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"
```

**Expected Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Lista zakupów - Tydzień 20-26 stycznia",
      "week_start_date": "2025-01-20",
      "items_count": 23,
      "created_at": "2025-01-26T14:00:00Z"
    }
    // ... up to 20 lists
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

**Verification:**

- Lists are sorted by created_at DESC (newest first)
- Max 20 items returned
- items_count is correct (count manually from TC1 if possible)

---

### ✅ TC13: Successful Fetch - Custom Pagination

**Description:** Pobierz listy z custom pagination (page=1, limit=5)

**Request:**

```bash
curl -X GET "http://localhost:3001/api/shopping-lists?page=1&limit=5" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"
```

**Expected Response:** `200 OK`

```json
{
  "data": [
    // ... max 5 lists
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 12,
    "total_pages": 3
  }
}
```

**Verification:**

- Only 5 lists returned
- total_pages = ceil(total / limit) = ceil(12 / 5) = 3

---

### ✅ TC14: Successful Fetch - Page 2

**Description:** Pobierz drugą stronę (page=2, limit=5)

**Request:**

```bash
curl -X GET "http://localhost:3001/api/shopping-lists?page=2&limit=5" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"
```

**Expected Response:** `200 OK`

```json
{
  "data": [
    // ... next 5 lists (items 6-10)
  ],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 12,
    "total_pages": 3
  }
}
```

**Verification:**

- Different lists than page 1
- Sorted by created_at DESC (continuation)

---

### ✅ TC15: Empty Result - New User

**Description:** Nowy użytkownik bez list

**Request:**

```bash
# Use token from different user (or create new user first)
curl -X GET http://localhost:3001/api/shopping-lists `
  -H "Authorization: Bearer $NEW_USER_TOKEN"
```

**Expected Response:** `200 OK`

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0
  }
}
```

---

### ❌ TC16: Validation Error - Invalid Page (< 1)

**Description:** Page number < 1

**Request:**

```bash
curl -X GET "http://localhost:3001/api/shopping-lists?page=0" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "page": ["Page must be at least 1"]
  }
}
```

---

### ❌ TC17: Validation Error - Limit Too High

**Description:** Limit > 100 (maximum)

**Request:**

```bash
curl -X GET "http://localhost:3001/api/shopping-lists?limit=200" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "limit": ["Limit must not exceed 100"]
  }
}
```

---

### ❌ TC18: Validation Error - Invalid Limit (< 1)

**Description:** Limit < 1

**Request:**

```bash
curl -X GET "http://localhost:3001/api/shopping-lists?limit=0" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"
```

**Expected Response:** `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": {
    "limit": ["Limit must be at least 1"]
  }
}
```

---

### ❌ TC19: Authentication Error - No Token

**Description:** Request bez Authorization header

**Request:**

```bash
curl -X GET http://localhost:3001/api/shopping-lists
```

**Expected Response:** `401 Unauthorized`

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to view shopping lists"
}
```

---

### ✅ TC20: Cache Headers Verification

**Description:** Sprawdź czy Cache-Control header jest ustawiony

**Request:**

```bash
curl -X GET http://localhost:3001/api/shopping-lists `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -i  # Show response headers
```

**Expected Response Headers:**

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=300
```

**Verification:**

- Cache-Control header is present
- max-age=300 (5 minutes)
- private (not cacheable by public caches)

---

## 🔒 Security Test Cases

### 🔐 TC21: User Isolation (RLS)

**Description:** Verify users can't see each other's lists

**Steps:**

1. Create list as User A
2. Try to fetch lists as User B
3. Verify User B doesn't see User A's list

**Request (User A):**

```bash
$env:ACCESS_TOKEN_A = "USER_A_TOKEN"

# Create list as User A
curl -X POST http://localhost:3001/api/shopping-lists `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN_A" `
  -d '{
    "name": "User A List",
    "items": [{"ingredient_name": "mleko", "category": "Nabiał", "sort_order": 0}]
  }'

# Get lists as User A (should see the list)
curl -X GET http://localhost:3001/api/shopping-lists `
  -H "Authorization: Bearer $env:ACCESS_TOKEN_A"
```

**Request (User B):**

```bash
$env:ACCESS_TOKEN_B = "USER_B_TOKEN"

# Try to get lists as User B
curl -X GET http://localhost:3001/api/shopping-lists `
  -H "Authorization: Bearer $env:ACCESS_TOKEN_B"
```

**Expected Result:**

- User A sees "User A List"
- User B does NOT see "User A List"
- Each user sees only their own lists

---

## 📊 Test Results Template

**Date:** ******\_\_\_******
**Tester:** ******\_\_\_******
**Environment:** Local / Staging / Production

| Test Case                       | Status | Response Time | Notes |
| ------------------------------- | ------ | ------------- | ----- |
| TC1: POST - Full Data           | ⏳     |               |       |
| TC2: POST - Minimal Data        | ⏳     |               |       |
| TC3: POST - From Recipes        | ⏳     |               |       |
| TC4: POST - Empty Items         | ⏳     |               |       |
| TC5: POST - Invalid Category    | ⏳     |               |       |
| TC6: POST - Name Too Long       | ⏳     |               |       |
| TC7: POST - Invalid Date        | ⏳     |               |       |
| TC8: POST - Too Many Items      | ⏳     |               |       |
| TC9: POST - Negative Quantity   | ⏳     |               |       |
| TC10: POST - No Token           | ⏳     |               |       |
| TC11: POST - 100 Items          | ⏳     |               |       |
| TC12: GET - Default Pagination  | ⏳     |               |       |
| TC13: GET - Custom Pagination   | ⏳     |               |       |
| TC14: GET - Page 2              | ⏳     |               |       |
| TC15: GET - Empty Result        | ⏳     |               |       |
| TC16: GET - Invalid Page        | ⏳     |               |       |
| TC17: GET - Limit Too High      | ⏳     |               |       |
| TC18: GET - Invalid Limit       | ⏳     |               |       |
| TC19: GET - No Token            | ⏳     |               |       |
| TC20: GET - Cache Headers       | ⏳     |               |       |
| TC21: Security - User Isolation | ⏳     |               |       |

**Legend:** ✅ Pass | ❌ Fail | ⏳ Not Tested | ⚠️ Warning

---

## 🎯 Quick Test Script (All Success Cases)

**PowerShell:**

```powershell
# Set your access token
$env:ACCESS_TOKEN = "YOUR_TOKEN_HERE"
$baseUrl = "http://localhost:3001"

Write-Host "=== TC1: POST with full data ===" -ForegroundColor Green
curl -X POST "$baseUrl/api/shopping-lists" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN" `
  -d '{"name":"Test 1","week_start_date":"2025-01-20","items":[{"ingredient_name":"mleko","quantity":1,"unit":"l","category":"Nabiał","sort_order":0}]}'

Start-Sleep -Seconds 1

Write-Host "`n=== TC12: GET default pagination ===" -ForegroundColor Green
curl -X GET "$baseUrl/api/shopping-lists" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"

Start-Sleep -Seconds 1

Write-Host "`n=== TC13: GET custom pagination ===" -ForegroundColor Green
curl -X GET "$baseUrl/api/shopping-lists?page=1&limit=5" `
  -H "Authorization: Bearer $env:ACCESS_TOKEN"

Write-Host "`n=== Tests completed ===" -ForegroundColor Cyan
```

---

## 🐛 Troubleshooting

### Problem: "401 Unauthorized" nawet z tokenem

**Solution:**

1. Check if token is expired (tokens expire after some time)
2. Get fresh token from browser console
3. Verify token format: `Bearer <token>` (nie `<token>`)

### Problem: "CORS error" w przeglądarce

**Solution:**

- Use curl/Postman instead of browser fetch
- Or add CORS headers in middleware (not recommended for production)

### Problem: "Connection refused"

**Solution:**

1. Check if dev server is running: `npm run dev`
2. Verify correct port (3000 or 3001)
3. Check firewall settings

### Problem: Response is empty or malformed

**Solution:**

1. Check Content-Type header is set to `application/json`
2. Verify JSON syntax (use JSON validator)
3. Check server logs for errors

---

## 📝 Notes

- All tests assume RLS policies are enabled in database
- Tokens expire after some time - regenerate if needed
- Response times may vary based on database location
- Use `-i` flag with curl to see full response headers
- Use `| jq` for pretty-printed JSON (if jq is installed)

---

**Created by:** Claude Code
**Last updated:** 2025-11-04
