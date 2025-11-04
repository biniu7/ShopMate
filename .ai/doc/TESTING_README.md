# Testing Guide: Shopping Lists API

Quick reference dla testowania endpointów POST & GET /api/shopping-lists

---

## 🚀 Quick Start

### 1. Upewnij się, że serwer działa

```bash
npm run dev
```

Serwer powinien być dostępny na `http://localhost:3000` lub `http://localhost:3001`

### 2. Zdobądź Access Token

**Metoda 1: Z przeglądarki (DevTools Console)**
```javascript
const { data } = await window.supabase.auth.getSession();
console.log('Token:', data.session?.access_token);
```

**Metoda 2: Z localStorage**
```javascript
// Sprawdź klucze w localStorage
Object.keys(localStorage).filter(k => k.includes('auth'));
```

### 3. Ustaw token jako zmienną środowiskową

**PowerShell:**
```powershell
$env:ACCESS_TOKEN = "YOUR_TOKEN_HERE"
```

**Bash/Zsh:**
```bash
export ACCESS_TOKEN="YOUR_TOKEN_HERE"
```

### 4. Uruchom testy

**Opcja A: Automatyczny skrypt (PowerShell)**
```powershell
cd .ai/doc
.\test-shopping-lists.ps1
```

**Opcja B: Manualne testy (curl)**
Otwórz plik: `.ai/doc/18_10_POST-GET-shopping-lists-manual-tests.md`
Kopiuj i wklej komendy curl

---

## 📁 Pliki testowe

| Plik | Opis |
|------|------|
| `18_10_POST-GET-shopping-lists-manual-tests.md` | Kompletny przewodnik z 21 test cases (curl commands) |
| `test-shopping-lists.ps1` | Automatyczny skrypt PowerShell (10 podstawowych testów) |
| `18_10_shopping-lists-database-setup.sql` | SQL queries dla setup bazy danych (RLS, indexes) |
| `18_10_POST-GET-shopping-lists-IMPLEMENTATION_SUMMARY.md` | Podsumowanie implementacji |

---

## 🧪 Test Cases

### POST /api/shopping-lists
- ✅ TC1-3: Successful creation (full data, minimal, from recipes)
- ❌ TC4-9: Validation errors (empty items, invalid category, name too long, etc.)
- ❌ TC10: Authentication error
- ⚡ TC11: Performance test (100 items)

### GET /api/shopping-lists
- ✅ TC12-15: Successful fetch (default pagination, custom, page 2, empty)
- ❌ TC16-19: Validation errors (invalid page/limit, no token)
- ✅ TC20: Cache headers verification

### Security
- 🔐 TC21: User isolation (RLS)

---

## 🎯 Automated Testing (PowerShell Script)

```powershell
# Setup
$env:ACCESS_TOKEN = "YOUR_TOKEN"
cd .ai/doc

# Run all tests
.\test-shopping-lists.ps1

# Expected output:
# ✅ All tests passed!
# Total: 10 | Passed: 10 | Failed: 0 | Pass rate: 100%
```

**Co testuje skrypt:**
- 5 test cases dla POST (success, validation, auth)
- 5 test cases dla GET (success, validation, auth)
- Automatyczne sprawdzanie status codes
- Pomiar response time
- Pretty-printed JSON responses

---

## 📋 Manual Testing Checklist

### Before Testing
- [ ] Server is running (`npm run dev`)
- [ ] Database setup completed (RLS policies, indexes)
- [ ] Access token obtained
- [ ] Environment variable set

### POST Endpoint
- [ ] TC1: Create list with full data (201)
- [ ] TC2: Create list with minimal data (201)
- [ ] TC3: Create list from recipes mode (201, week_start_date=null)
- [ ] TC4: Empty items array (400)
- [ ] TC5: Invalid category (400)
- [ ] TC10: No auth token (401)
- [ ] TC11: 100 items performance test (< 500ms)

### GET Endpoint
- [ ] TC12: Default pagination (200)
- [ ] TC13: Custom pagination (200)
- [ ] TC15: Empty result for new user (200)
- [ ] TC16: Invalid page (400)
- [ ] TC17: Limit too high (400)
- [ ] TC19: No auth token (401)

### Security
- [ ] TC21: User isolation - verify RLS works

---

## 🐛 Troubleshooting

### "ACCESS_TOKEN not set"
```powershell
# Check if set
$env:ACCESS_TOKEN

# Set again
$env:ACCESS_TOKEN = "paste_token_here"
```

### "401 Unauthorized" with valid token
- Token might be expired - get fresh one from browser
- Check format: `Bearer <token>` in header
- Verify user is logged in Supabase

### "Connection refused"
- Check if server is running: `npm run dev`
- Verify port: 3000 or 3001
- Try: `curl http://localhost:3001`

### PowerShell script permission error
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run again
.\test-shopping-lists.ps1
```

---

## 📊 Expected Results

### Successful POST (201 Created)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Lista zakupów",
  "week_start_date": "2025-01-20",
  "created_at": "2025-01-26T14:00:00Z",
  "updated_at": "2025-01-26T14:00:00Z",
  "items": [...]
}
```

### Successful GET (200 OK)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": {
    "items": ["At least 1 item is required"]
  }
}
```

### Auth Error (401)
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in..."
}
```

---

## 🔗 Quick Links

- **Manual tests:** `.ai/doc/18_10_POST-GET-shopping-lists-manual-tests.md`
- **Auto script:** `.ai/doc/test-shopping-lists.ps1`
- **Database setup:** `.ai/doc/18_10_shopping-lists-database-setup.sql`
- **Implementation:** `.ai/doc/18_10_POST-GET-shopping-lists-IMPLEMENTATION_SUMMARY.md`

---

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All 21 test cases passing
- [ ] Database setup completed (RLS + indexes)
- [ ] Performance targets met (POST < 500ms, GET < 200ms)
- [ ] User isolation verified (RLS working)
- [ ] Error messages are user-friendly
- [ ] Response DTOs match TypeScript types
- [ ] Code review completed
- [ ] Documentation updated

---

**Created:** 2025-11-04
**Last Updated:** 2025-11-04
**Status:** Ready for testing
