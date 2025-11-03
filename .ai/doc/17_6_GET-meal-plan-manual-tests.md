# Manual Testing Guide: GET /api/meal-plan

## Prerequisites

1. Start dev server: `npm run dev`
2. Ensure you're logged in (valid Supabase session)
3. Get session cookies from browser DevTools (Application → Cookies)
4. Export cookies for testing:
   ```bash
   export SB_ACCESS_TOKEN="your-access-token"
   export SB_REFRESH_TOKEN="your-refresh-token"
   ```

---

## Test Case 1: Successful Request - Week with Assignments

**Purpose:** Test successful retrieval of meal plan for a week with existing assignments

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2025-01-20" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `200 OK`
```json
{
  "week_start_date": "2025-01-20",
  "week_end_date": "2025-01-26",
  "assignments": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "recipe_id": "uuid",
      "recipe_name": "Recipe Name",
      "week_start_date": "2025-01-20",
      "day_of_week": 1,
      "meal_type": "breakfast",
      "created_at": "2025-01-20T08:00:00Z"
    }
    // ... more assignments
  ]
}
```

**Validation:**
- ✅ Status code: 200
- ✅ `week_end_date` = `week_start_date` + 6 days
- ✅ Assignments sorted by `day_of_week` then `meal_type`
- ✅ All assignments have `recipe_name` field
- ✅ `meal_type` values: breakfast, second_breakfast, lunch, dinner

---

## Test Case 2: Empty Week (No Assignments)

**Purpose:** Test response when week has no meal plan assignments

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2025-12-01" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `200 OK`
```json
{
  "week_start_date": "2025-12-01",
  "week_end_date": "2025-12-07",
  "assignments": []
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Empty `assignments` array
- ✅ `week_start_date` and `week_end_date` still calculated correctly

---

## Test Case 3: Missing Query Parameter

**Purpose:** Test validation error when required parameter is missing

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Required"]
  }
}
```

**Validation:**
- ✅ Status code: 400
- ✅ Error type: "Validation failed"
- ✅ Details indicate missing `week_start_date`

---

## Test Case 4: Invalid Date Format

**Purpose:** Test validation error for incorrect date format

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=20250120" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date format. Expected YYYY-MM-DD"]
  }
}
```

**Validation:**
- ✅ Status code: 400
- ✅ Clear error message about format

**Additional Test - Invalid Date:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2025-13-40" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Validation failed",
  "details": {
    "week_start_date": ["Invalid date. Must be a valid ISO date"]
  }
}
```

---

## Test Case 5: Unauthorized (No Session)

**Purpose:** Test authentication requirement

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2025-01-20" \
  -v
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Validation:**
- ✅ Status code: 401
- ✅ Clear authentication error message

---

## Test Case 6: Date from Past

**Purpose:** Verify endpoint accepts historical dates

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2024-01-01" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `200 OK`
```json
{
  "week_start_date": "2024-01-01",
  "week_end_date": "2024-01-07",
  "assignments": []
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Accepts past dates without restriction

---

## Test Case 7: Date from Future

**Purpose:** Verify endpoint accepts future dates

**Request:**
```bash
curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2026-06-15" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -v
```

**Expected Response:** `200 OK`
```json
{
  "week_start_date": "2026-06-15",
  "week_end_date": "2026-06-21",
  "assignments": []
}
```

**Validation:**
- ✅ Status code: 200
- ✅ Accepts future dates without restriction

---

## Test Case 8: Performance Test (Multiple Assignments)

**Purpose:** Test response time with full week (28 assignments)

**Setup:** Create meal plan with 28 assignments (7 days × 4 meals)

**Request:**
```bash
time curl -X GET "http://localhost:3000/api/meal-plan?week_start_date=2025-01-20" \
  -H "Cookie: sb-access-token=${SB_ACCESS_TOKEN}; sb-refresh-token=${SB_REFRESH_TOKEN}" \
  -o /dev/null -s -w "%{time_total}\n"
```

**Expected:**
- ✅ Response time < 200ms
- ✅ All 28 assignments returned
- ✅ Proper sorting (day 1-7, meals in order)

---

## Testing with Postman/Insomnia

### Postman Collection Setup:

1. **Environment Variables:**
   - `base_url`: `http://localhost:3000`
   - `sb_access_token`: Your Supabase access token
   - `sb_refresh_token`: Your Supabase refresh token

2. **Request Setup:**
   - Method: GET
   - URL: `{{base_url}}/api/meal-plan?week_start_date=2025-01-20`
   - Headers:
     - `Cookie`: `sb-access-token={{sb_access_token}}; sb-refresh-token={{sb_refresh_token}}`

3. **Tests Script (Postman):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("week_start_date");
    pm.expect(jsonData).to.have.property("week_end_date");
    pm.expect(jsonData).to.have.property("assignments");
    pm.expect(jsonData.assignments).to.be.an("array");
});

pm.test("Week dates are correct", function () {
    var jsonData = pm.response.json();
    var startDate = new Date(jsonData.week_start_date);
    var endDate = new Date(jsonData.week_end_date);
    var diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    pm.expect(diffDays).to.equal(6); // 6 days difference
});

pm.test("Assignments are sorted correctly", function () {
    var jsonData = pm.response.json();
    var assignments = jsonData.assignments;

    for (let i = 0; i < assignments.length - 1; i++) {
        var current = assignments[i];
        var next = assignments[i + 1];

        // Check day_of_week is ascending
        pm.expect(current.day_of_week).to.be.at.most(next.day_of_week);
    }
});
```

---

## Browser Testing

### 1. Using Browser DevTools (Console)

```javascript
// Fetch meal plan for current week
const response = await fetch('/api/meal-plan?week_start_date=2025-01-20');
const data = await response.json();
console.log(data);

// Check response structure
console.assert(data.week_start_date, "Missing week_start_date");
console.assert(data.week_end_date, "Missing week_end_date");
console.assert(Array.isArray(data.assignments), "Assignments is not an array");
```

### 2. Using fetch with error handling

```javascript
async function testMealPlanEndpoint(weekStartDate) {
  try {
    const response = await fetch(`/api/meal-plan?week_start_date=${weekStartDate}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error);
      return;
    }

    const data = await response.json();
    console.log('Success:', data);

    // Validation
    console.log(`Week: ${data.week_start_date} to ${data.week_end_date}`);
    console.log(`Total assignments: ${data.assignments.length}`);

  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Test valid date
testMealPlanEndpoint('2025-01-20');

// Test invalid date
testMealPlanEndpoint('2025-13-40'); // Should return 400

// Test missing parameter
testMealPlanEndpoint(''); // Should return 400
```

---

## Troubleshooting

### Issue: 401 Unauthorized despite being logged in

**Solution:**
- Refresh browser and check cookies
- Verify `sb-access-token` and `sb-refresh-token` exist
- Check token expiration in DevTools → Application → Cookies
- Try logging out and logging back in

### Issue: 500 Internal Server Error

**Check:**
1. Database connection (Supabase URL and key)
2. RLS policies enabled on `meal_plan` table
3. `recipes` table accessible via JOIN
4. Server logs: `console.error` output

### Issue: Empty assignments array when data exists

**Check:**
1. `user_id` matches logged-in user
2. `week_start_date` format is correct
3. Data exists in database for that week
4. RLS policies allow access

---

## Success Criteria

✅ All 8 test cases pass
✅ Response time < 200ms for typical requests
✅ Proper error messages for all validation failures
✅ Authentication properly enforced
✅ Data sorting correct (day_of_week, meal_type)
✅ Empty weeks return valid response (not error)
✅ Date calculations correct (week_end_date)

---

## Next Steps After Testing

1. Document any bugs found
2. Test with real user data
3. Perform load testing (optional)
4. Verify RLS policies in Supabase dashboard
5. Check database indexes (see Step 5)